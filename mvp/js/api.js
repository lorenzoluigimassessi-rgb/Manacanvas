const API_BASE = "https://api.scryfall.com";
let currentSearch = null;
let nextPageUrl = null;
let isLoading = false;

let sortOrder = "random"; // default: Shuffle
let sortDir = "auto";

const SORT_OPTIONS = [
  { label: "Random",      order: "random",   dir: "auto" },
  { label: "Newest First", order: "released", dir: "desc" },
  { label: "Oldest First", order: "released", dir: "asc"  },
  { label: "A → Z",        order: "name",     dir: "asc"  },
  { label: "Z → A",        order: "name",     dir: "desc" },
];

async function fetchCards(query = "t:creature", page = 1) {
  isLoading = true;
  const isRandom = sortOrder === "random";
  const isDefaultQuery = query === "t:creature has:illustration";
  // Cap at page 100 to stay well within available pages and avoid empty results
  const randomPage = (isRandom && isDefaultQuery) ? Math.floor(Math.random() * 100) + 1 : page;
  const order = isRandom ? "released" : sortOrder;
  const dir = isRandom ? "asc" : sortDir;
  const url = (!isRandom && nextPageUrl) || `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&order=${order}&dir=${dir}&page=${randomPage}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // If random page fails, fall back to page 1
      if (isRandom && isDefaultQuery) {
        const fallback = await fetch(`${API_BASE}/cards/search?q=${encodeURIComponent(query)}&order=${order}&dir=${dir}&page=1`);
        if (!fallback.ok) return { data: [], hasMore: false };
        const fjson = await fallback.json();
        nextPageUrl = fjson.has_more ? fjson.next_page : null;
        isLoading = false;
        return { data: shuffleArray(fjson.data || []), hasMore: fjson.has_more || false };
      }
      return { data: [], hasMore: false };
    }
    const json = await res.json();
    nextPageUrl = json.has_more ? json.next_page : null;
    isLoading = false;
    const data = json.data || [];
    return { data: isRandom ? shuffleArray(data) : data, hasMore: json.has_more || false };
  } catch (e) {
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

async function fetchRandomCard() {
  const query = buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, activeStyles.map(i => ART_STYLES[i]), activeYearMin, activeYearMax, activeSearch);
  try {
    const res = await fetch(`${API_BASE}/cards/random?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
    // Fallback to truly random if filtered query returns no results
    const fallback = await fetch(`${API_BASE}/cards/random?q=has:illustration`);
    return fallback.ok ? await fallback.json() : null;
  } catch (e) {
    return null;
  }
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
  if (colours && colours.length === 1) q += ` c:${colours[0]}`;
  if (colours && colours.length > 1) q += ` (${colours.map(c => `c:${c}`).join(" OR ")})`;
  if (sets && sets.length === 1) q += ` s:${sets[0]}`;
  if (sets && sets.length > 1) q += ` (${sets.map(s => `s:${s}`).join(" OR ")})`;
  if (styles && styles.length === 1) q += ` ${styles[0].query}`;
  if (styles && styles.length > 1) q += ` (${styles.map(s => s.query).join(" OR ")})`;
  if (yearMin) q += ` year>=${yearMin}`;
  if (yearMax) q += ` year<=${yearMax}`;
  const hasFilters = (artists?.length || creatureTypes?.length || cardTypes?.length || colours?.length ||
    sets?.length || styles?.length || yearMin || yearMax || searchText);
  if (!hasFilters) q = "t:creature has:illustration";
  return q;
}
