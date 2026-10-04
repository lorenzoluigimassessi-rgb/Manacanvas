const API_BASE = "https://api.scryfall.com";
let currentSearch = null;
let nextPageUrl = null;
let isLoading = false;

let sortOrder = "random";
let sortDir = "auto";

const SORT_OPTIONS = [
  { label: "Shuffle", order: "random",   dir: "auto" },
  { label: "Popular", order: "edhrec",   dir: "auto" },
  { label: "Newest",  order: "released", dir: "desc" },
  { label: "Oldest",  order: "released", dir: "asc"  },
];

// Feed state for infinite scroll: shuffle keeps drawing random pages of the
// current query, never repeating a card, until the whole query is seen
const PAGE_SIZE = 175;
const _pageCounts = {};      // query -> number of result pages (learned from responses)
let _seenIds = new Set();
let _feedTotal = 0;
let _feedEpoch = 0; // bumped by resetPagination; responses from an older feed are discarded

async function _search(query, order, dir, page) {
  const url = `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=art&order=${order}&dir=${dir}&page=${page}`;
  let res = await fetch(url);
  if (res.status === 429) { await new Promise(r => setTimeout(r, 2000)); res = await fetch(url); }
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) return null;
  const json = await res.json();
  if (json.object === 'error') return null;
  // Full pages only — Scryfall can reject the last, partial page
  _pageCounts[query] = Math.max(1, Math.floor((json.total_cards || 0) / PAGE_SIZE));
  return json;
}

async function fetchCards(query = "t:creature") {
  isLoading = true;
  const epoch = _feedEpoch;
  try {
    const isRandom = sortOrder === "random";
    let json;
    if (isRandom) {
      // Random page (and direction) of the query; learn the page count on first miss
      const dir = Math.random() < 0.5 ? "asc" : "desc";
      const pages = _pageCounts[query] || 200;
      json = await _search(query, "released", dir, Math.floor(Math.random() * pages) + 1);
      if (!json) {
        // Page out of range (count unknown or off by one): learn it from page 1, then try a page inside it
        json = await _search(query, "released", dir, 1);
        const known = _pageCounts[query] || 1;
        if (json && known > 1) json = await _search(query, "released", dir, Math.floor(Math.random() * known) + 1) || json;
      }
    } else {
      json = nextPageUrl ? await (await fetch(nextPageUrl)).json() : await _search(query, sortOrder, sortDir, 1);
      if (json && json.object === 'error') json = null;
    }
    if (epoch !== _feedEpoch) return { data: [], hasMore: false, stale: true };
    if (!json || json.rateLimited) return { data: [], hasMore: false, rateLimited: !!(json && json.rateLimited) };
    nextPageUrl = !isRandom && json.has_more ? json.next_page : null;
    _feedTotal = json.total_cards || 0;
    const data = (json.data || []).filter(c => !_seenIds.has(c.id));
    data.forEach(c => _seenIds.add(c.id));
    const hasMore = isRandom ? _seenIds.size < _feedTotal : !!json.has_more;
    return { data: isRandom ? shuffleArray(data) : data, hasMore };
  } catch (e) {
    return { data: [], hasMore: false };
  } finally {
    isLoading = false;
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resetPagination() {
  nextPageUrl = null;
  _seenIds = new Set();
  _feedTotal = 0;
  _feedEpoch++;
}

async function fetchCreatureTypes() {
  try {
    const res = await fetch(`${API_BASE}/catalog/creature-types`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

async function fetchCardTypes() {
  try {
    const res = await fetch(`${API_BASE}/catalog/card-types`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

async function fetchArtistNames() {
  try {
    const res = await fetch(`${API_BASE}/catalog/artist-names`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

// Random card pool — fetch 175 cards at once, serve locally, refetch when low
window._randomPool = window._randomPool || [];
window._randomPoolLoading = false;
window._randomPoolQuery = null;

async function _fillRandomPool(query) {
  if (window._randomPoolLoading) return;
  window._randomPoolLoading = true;
  try {
    const page = Math.floor(Math.random() * 50) + 1; // pages 1-50
    const res = await fetch(`${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=art&order=released&dir=asc&page=${page}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data?.length) {
        const fresh = shuffleArray(json.data.filter(c => c.image_uris?.art_crop || c.card_faces?.[0]?.image_uris?.art_crop));
        window._randomPool.push(...fresh);
      }
    }
  } catch(e) {}
  window._randomPoolLoading = false;
}

async function fetchRandomCard() {
  const query = buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, activeStyles.map(i => ART_STYLES[i]), activeYearMin, activeYearMax, activeSearch);

  // Reset pool if query changed
  if (window._randomPoolQuery !== query) {
    window._randomPool = [];
    window._randomPoolQuery = query;
  }

  // Refill when running low
  if (window._randomPool.length < 10) {
    await _fillRandomPool(query);
  }

  // Serve from pool
  if (window._randomPool.length > 0) {
    return window._randomPool.shift();
  }

  // Pool empty (rate limited or no results) — try direct random as last resort
  try {
    const res = await fetch(`${API_BASE}/cards/random?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
    const fallback = await fetch(`${API_BASE}/cards/random?q=has:illustration`);
    return fallback.ok ? await fallback.json() : null;
  } catch(e) { return null; }
}

function buildQuery(artists, creatureTypes, cardTypes, colours, sets, styles, yearMin, yearMax, searchText) {
  let q = "has:illustration";
  if (searchText) q += ` ${searchText}`;
  if (artists && artists.length === 1) q += ` a:"${artists[0]}"`;
  if (artists && artists.length > 1) q += ` (${artists.map(a => `a:"${a}"`).join(" OR ")})`;
  if (creatureTypes && creatureTypes.length === 1) q += ` t:${creatureTypes[0]}`;
  if (creatureTypes && creatureTypes.length > 1) q += ` (${creatureTypes.map(t => `t:${t}`).join(" OR ")})`;
  if (cardTypes && cardTypes.length === 1) q += ` t:${cardTypes[0]}`;
  if (cardTypes && cardTypes.length > 1) q += ` (${cardTypes.map(t => `t:${t}`).join(" OR ")})`;
  if (colours && colours.length === 1) {
    const c = colours[0];
    if (c === 'm') q += ` c>=2`;
    else if (c === 'c') q += ` c:c`;
    else q += ` color=${c}`;
  }
  if (colours && colours.length > 1) q += ` (${colours.map(c => c === 'm' ? 'c>=2' : c === 'c' ? 'c:c' : `color=${c}`).join(" OR ")})`;
  if (sets && sets.length === 1) q += ` s:${sets[0]}`;
  if (sets && sets.length > 1) q += ` (${sets.map(s => `s:${s}`).join(" OR ")})`;
  if (styles && styles.length === 1) q += ` ${styles[0].query}`;
  if (styles && styles.length > 1) q += ` (${styles.map(s => s.query).join(" OR ")})`;
  if (yearMin) q += ` year>=${yearMin}`;
  if (yearMax) q += ` year<=${yearMax}`;
  // Lens raw query injection (moods, etc.) — combine with search if active
  if (window._lensRawQuery) {
    q = searchText ? `${window._lensRawQuery} ${searchText}` : window._lensRawQuery;
    window._lensRawQuery = null;
  }
  const hasFilters = (artists?.length || creatureTypes?.length || cardTypes?.length || colours?.length ||
    sets?.length || styles?.length || yearMin || yearMax || searchText || q !== 'has:illustration');
  if (!hasFilters) q = "t:creature has:illustration";
  return q;
}
