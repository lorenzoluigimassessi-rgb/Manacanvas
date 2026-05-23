const API_BASE = "https://api.scryfall.com";
let currentSearch = null;
let nextPageUrl = null;
let isLoading = false;

let sortOrder = "random"; // default: Shuffle
let sortDir = "auto";

const SORT_OPTIONS = [
  { label: "Shuffle",      order: "random",   dir: "auto" },
  { label: "Newest First", order: "released", dir: "desc" },
  { label: "Oldest First", order: "released", dir: "asc"  },
  { label: "A → Z",        order: "name",     dir: "asc"  },
  { label: "Z → A",        order: "name",     dir: "desc" },
];

async function fetchCards(query = "t:creature", page = 1) {
  isLoading = true;
  const isRandom = sortOrder === "random";
  // For shuffle, fetch with released order then shuffle client-side
  const order = isRandom ? "released" : sortOrder;
  const dir = isRandom ? "asc" : sortDir;
  const url = nextPageUrl || `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&order=${order}&dir=${dir}&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { data: [], hasMore: false };
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
  const query = buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, activeYearMin, activeYearMax, activeSearch);
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

function buildQuery(artist, creatureType, cardType, colour, sets, styles, yearMin, yearMax, searchText) {
  let q = "has:illustration";
  if (searchText) q += ` ${searchText}`;
  if (artist) q += ` a:"${artist}"`;
  if (creatureType) q += ` t:${creatureType}`;
  if (cardType) q += ` t:${cardType}`;
  if (colour) q += ` c:${colour}`;
  if (sets && sets.length === 1) q += ` s:${sets[0]}`;
  if (sets && sets.length > 1) q += ` (${sets.map(s => `s:${s}`).join(" OR ")})`;
  if (styles && styles.length === 1) q += ` ${styles[0].query}`;
  if (styles && styles.length > 1) q += ` (${styles.map(s => s.query).join(" OR ")})`;
  if (yearMin) q += ` year>=${yearMin}`;
  if (yearMax) q += ` year<=${yearMax}`;
  if (!artist && !creatureType && !cardType && !colour && (!sets || !sets.length) && (!styles || !styles.length) && !yearMin && !yearMax && !searchText) q = "t:creature has:illustration";
  return q;
}
