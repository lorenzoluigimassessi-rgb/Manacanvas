const API_BASE = "https://api.scryfall.com";
let currentSearch = null;
let nextPageUrl = null;
let isLoading = false;
let _fetchController = null; // abort controller for grid fetches

let sortOrder = "random";
let sortDir = "auto";

const SORT_OPTIONS = [
  { label: "Random",       order: "random",   dir: "auto" },
  { label: "Oldest First", order: "released", dir: "asc"  },
  { label: "Newest First", order: "released", dir: "desc" },
  { label: "A → Z",        order: "name",     dir: "asc"  },
  { label: "Z → A",        order: "name",     dir: "desc" },
];

async function fetchCards(query = "t:creature", page = 1) {
  // Cancel any in-flight grid fetch (small delay to avoid aborting legitimate first loads)
  if (_fetchController) {
    _fetchController.abort();
  }
  _fetchController = new AbortController();
  const signal = _fetchController.signal;

  isLoading = true;
  const isRandom = sortOrder === "random";
  const randomPage = isRandom ? Math.floor(Math.random() * 100) + 1 : page;
  const order = isRandom ? "released" : sortOrder;
  const dir   = isRandom ? "asc"      : sortDir;
  const url   = (!isRandom && nextPageUrl) ||
    `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=art&order=${order}&dir=${dir}&page=${randomPage}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      if (isRandom) {
        const fallback = await fetch(
          `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=art&order=${order}&dir=${dir}&page=1`,
          { signal }
        );
        if (!fallback.ok) { isLoading = false; return { data: [], hasMore: false }; }
        const fjson = await fallback.json();
        if (fjson.object === 'error') { isLoading = false; return { data: [], hasMore: false }; }
        nextPageUrl = fjson.has_more ? fjson.next_page : null;
        isLoading = false;
        return { data: shuffleArray(fjson.data || []), hasMore: fjson.has_more || false };
      }
      isLoading = false;
      return { data: [], hasMore: false };
    }
    const json = await res.json();
    if (json.object === 'error') { isLoading = false; return { data: [], hasMore: false }; }
    nextPageUrl = json.has_more ? json.next_page : null;
    isLoading = false;
    return { data: isRandom ? shuffleArray(json.data || []) : (json.data || []), hasMore: json.has_more || false };
  } catch (e) {
    if (e.name === 'AbortError') { isLoading = false; return { data: [], hasMore: false }; }
    isLoading = false;
    return { data: [], hasMore: false };
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
}

// Catalog fetches — cached in sessionStorage to avoid re-fetching every load
async function fetchCatalog(endpoint, cacheKey) {
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch(e) {} }
  try {
    const res = await fetch(`${API_BASE}/catalog/${endpoint}`);
    const json = await res.json();
    const data = json.data || [];
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (e) { return []; }
}

async function fetchCreatureTypes() { return fetchCatalog('creature-types', 'mc_creature_types'); }
async function fetchCardTypes()     { return fetchCatalog('card-types',     'mc_card_types');     }
async function fetchArtistNames()   { return fetchCatalog('artist-names',   'mc_artist_names');   }

// Random card — with timeout so it never hangs the UI
async function fetchRandomCard() {
  const query = buildQuery(
    activeArtist, activeType, activeCardType, activeColour,
    activeSets, activeStyles.map(i => ART_STYLES[i]),
    activeYearMin, activeYearMax, activeSearch
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // 6s max
  try {
    const res = await fetch(`${API_BASE}/cards/random?q=${encodeURIComponent(query)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const card = await res.json();
      if (card.object === 'error') throw new Error('no results');
      return card;
    }
    // Fallback to any illustrated card
    const fallback = await fetch(`${API_BASE}/cards/random?q=has:illustration`, { signal: controller.signal });
    clearTimeout(timeout);
    return fallback.ok ? await fallback.json() : null;
  } catch (e) {
    clearTimeout(timeout);
    return null;
  }
}

function buildQuery(artists, creatureTypes, cardTypes, colours, sets, styles, yearMin, yearMax, searchText) {
  let q = "has:illustration";
  if (searchText) q += ` ${searchText}`;
  if (artists?.length === 1) q += ` a:"${artists[0]}"`;
  if (artists?.length > 1)   q += ` (${artists.map(a => `a:"${a}"`).join(" OR ")})`;
  if (creatureTypes?.length === 1) q += ` t:${creatureTypes[0]}`;
  if (creatureTypes?.length > 1)   q += ` (${creatureTypes.map(t => `t:${t}`).join(" OR ")})`;
  if (cardTypes?.length === 1) q += ` t:${cardTypes[0]}`;
  if (cardTypes?.length > 1)   q += ` (${cardTypes.map(t => `t:${t}`).join(" OR ")})`;
  if (colours?.length === 1) {
    const c = colours[0];
    if (c === 'm') q += ` c>=2`;
    else if (c === 'c') q += ` c:c`;
    else q += ` color=${c}`;
  }
  if (colours?.length > 1) q += ` (${colours.map(c => c === 'm' ? 'c>=2' : c === 'c' ? 'c:c' : `color=${c}`).join(" OR ")})`;
  if (sets?.length === 1) q += ` s:${sets[0]}`;
  if (sets?.length > 1)   q += ` (${sets.map(s => `s:${s}`).join(" OR ")})`;
  if (styles?.length === 1) q += ` ${styles[0].query}`;
  if (styles?.length > 1)   q += ` (${styles.map(s => s.query).join(" OR ")})`;
  if (yearMin) q += ` year>=${yearMin}`;
  if (yearMax) q += ` year<=${yearMax}`;
  const hasFilters = artists?.length || creatureTypes?.length || cardTypes?.length ||
    colours?.length || sets?.length || styles?.length || yearMin || yearMax || searchText;
  if (!hasFilters) q = "t:creature has:illustration";
  return q;
}
