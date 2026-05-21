const API_BASE = "https://api.scryfall.com";
let currentSearch = null;
let nextPageUrl = null;
let isLoading = false;

let sortOrder = "asc";

async function fetchCards(query = "t:creature", page = 1) {
  isLoading = true;
  const url = nextPageUrl || `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&order=released&dir=${sortOrder}&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { data: [], hasMore: false };
    const json = await res.json();
    nextPageUrl = json.has_more ? json.next_page : null;
    isLoading = false;
    return { data: json.data || [], hasMore: json.has_more || false };
  } catch (e) {
    isLoading = false;
    return { data: [], hasMore: false };
  }
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

async function fetchArtistNames() {
  try {
    const res = await fetch(`${API_BASE}/catalog/artist-names`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

function buildQuery(artist, creatureType, set, yearMin, yearMax, searchText) {
  let q = "has:illustration";
  if (searchText) q += ` ${searchText}`;
  if (artist) q += ` a:"${artist}"`;
  if (creatureType) q += ` t:${creatureType}`;
  if (set) q += ` s:${set}`;
  if (yearMin) q += ` year>=${yearMin}`;
  if (yearMax) q += ` year<=${yearMax}`;
  if (!artist && !creatureType && !set && !yearMin && !yearMax && !searchText) q = "t:creature has:illustration";
  return q;
}
