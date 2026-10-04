// Grid rendering + infinite scroll
const grid = document.getElementById("grid");
const loader = document.getElementById("loader");
const scrollTopBtn = document.getElementById("scrollTop");

let activeArtist = [];
let activeType = [];
let activeCardType = [];
let activeColour = [];
let activeSets = [];
let activeStyles = [];
let activeYearMin = null;
let activeYearMax = null;
let activeSearch = null;

// Track cards currently in the feed for lightbox prev/next
let filteredCards = [];

// Query behind the current feed — reused by infinite scroll, reshuffle and sort changes
let currentQuery = null;
let _feedHasMore = false;
let _feedGen = 0; // bumps on every new feed so late page loads from an old feed are dropped

function currentFiltersQuery() {
  return buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, (typeof ART_STYLES !== 'undefined' ? activeStyles.map(i => ART_STYLES[i]) : []), activeYearMin, activeYearMax, activeSearch);
}

async function loadInitialGrid(query) {
  // Reset all fetch state immediately to prevent stale data from previous queries
  isLoading = false;
  window._randomPool = [];
  window._randomPoolQuery = null;
  // Only persist filters in prod (staging uses lens system)
  if (typeof initLens !== 'function') {
    localStorage.setItem("mc_filters", JSON.stringify({
      activeArtist, activeType, activeCardType, activeColour,
      activeSets, activeStyles, activeYearMin, activeYearMax, activeSearch,
      sortOrder, sortDir
    }));
  }
  showShimmers();
  resetPagination();
  const gen = ++_feedGen;
  currentQuery = query || currentFiltersQuery();
  const { data, hasMore, rateLimited } = await fetchCards(currentQuery);
  if (gen !== _feedGen) return; // a newer feed started meanwhile
  grid.innerHTML = "";
  if (!data.length) {
    grid.innerHTML = rateLimited
      ? `<div class="empty-state"><h2>Too many requests</h2><p>Scryfall is rate limiting us. Wait a moment and try again.</p></div>`
      : `<div class="empty-state"><h2>No artwork found</h2><p>Try adjusting your filters or clearing them to browse all art.</p></div>`;
    return;
  }
  showFeed(data, hasMore, currentQuery, true);
  // Write to lens cache (shuffle only) — but NOT if search is active (prevents cache poisoning)
  if (typeof _lensCache !== 'undefined' && typeof _activeLens !== 'undefined' && !activeSearch && sortOrder === 'random') {
    const key = _activeLens + ':' + (typeof _activeSubPill !== 'undefined' ? (_activeSubPill || '') : '');
    _lensCache[key] = { cards: data, hasMore, query: currentQuery };
    if (typeof prewarmAdjacentLenses === 'function') prewarmAdjacentLenses();
  }
}

// Render a fresh feed (from network or lens cache) and arm infinite scroll
function showFeed(cards, hasMore, query, fromNetwork) {
  if (scrollObserver) scrollObserver.disconnect();
  _feedGen++;
  if (!fromNetwork) resetPagination();
  currentQuery = query;
  _seenIds = new Set(cards.map(c => c.id));
  _feedHasMore = hasMore;
  grid.innerHTML = '';
  filteredCards = cards;
  renderCards(cards);
  insertFeedBridge();
  const sc = document.getElementById('searchCount');
  if (sc) sc.textContent = activeSearch && _feedTotal ? _feedTotal.toLocaleString() + ' artworks' : '';
  if (hasMore) observeLastCard();
}

// "Looking for something specific?" band after the first rows of the All feed — gone once used
function insertFeedBridge() {
  if (typeof _activeLens === 'undefined' || _activeLens !== 'picks' || activeSearch) return;
  try { if (localStorage.getItem('mc_bridge_used') === '1') return; } catch (e) {}
  const after = grid.querySelectorAll('.card')[19];
  if (!after) return;
  const band = document.createElement('div');
  band.className = 'feed-bridge';
  band.innerHTML = `<span class="feed-bridge-q">Looking for something specific?</span>
    <button onclick="useFeedBridge()">Explore by categories <span class="feed-bridge-arrow" aria-hidden="true">→</span></button>`;
  after.after(band);
}

function useFeedBridge() {
  try { localStorage.setItem('mc_bridge_used', '1'); } catch (e) {}
  document.querySelectorAll('.feed-bridge').forEach(el => el.remove());
  setMode('collections');
}

// One-time hint that the feed can be reshuffled; gone once used or after scrolling into the feed
const _isTouch = 'ontouchstart' in window;
function updateFeedHint() {
  const hint = document.getElementById('feedHint');
  if (!hint) return;
  let seen = false;
  try { seen = localStorage.getItem('mc_hint_mix') === '1'; } catch (e) {}
  hint.innerHTML = `<span class="feed-hint-pill"><svg class="feed-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>Pull down for a new mix</span>`;
  hint.style.display = seen || activeSearch ? 'none' : '';
}
function dismissFeedHint() {
  try { localStorage.setItem('mc_hint_mix', '1'); } catch (e) {}
  const hint = document.getElementById('feedHint');
  if (hint && hint.style.display !== 'none') { hint.classList.add('fade'); setTimeout(() => { hint.style.display = 'none'; hint.classList.remove('fade'); }, 400); }
}
window.addEventListener('scroll', () => { if (window.scrollY > 1500 && _currentMode === 'gallery') dismissFeedHint(); }, { passive: true });

// ── Search results: an editorial header (what you searched, count, sort) replaces the lens tabs ──
const SEARCH_SORTS = [
  { key: 'random',  label: 'Shuffle', order: 'random',   dir: 'auto' },
  { key: 'popular', label: 'Popular', order: 'edhrec',   dir: 'auto' },
  { key: 'newest',  label: 'Newest',  order: 'released', dir: 'desc' },
  { key: 'oldest',  label: 'Oldest',  order: 'released', dir: 'asc'  },
];
const SEARCH_KINDS = { Card: 'Cards', Artist: 'Artist', Creature: 'Creature type', Type: 'Card type', Set: 'Set' };
let _searchMeta = null, _preSearchSort = null;


// A search opens on Shuffle; the gallery's own order comes back when the search ends
function startSearchSort(label, tag) {
  _searchMeta = { label, tag };
  if (!_preSearchSort) _preSearchSort = { order: sortOrder, dir: sortDir };
  sortOrder = 'random'; sortDir = 'auto';
  renderSearchHead();
}
function endSearchSort() {
  _searchMeta = null;
  if (_preSearchSort) { sortOrder = _preSearchSort.order; sortDir = _preSearchSort.dir; _preSearchSort = null; }
}
function setSearchSort(key) {
  const o = SEARCH_SORTS.find(x => x.key === key);
  sortOrder = o.order; sortDir = o.dir;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderSearchHead();
  loadInitialGrid(currentQuery);
}

function renderSearchHead() {
  const head = document.getElementById('searchHead');
  if (!head) return;
  const on = !!activeSearch && typeof _currentMode !== 'undefined' && _currentMode === 'gallery';
  head.style.display = on ? '' : 'none';
  grid.classList.toggle('grid--search', on); // tighter gap under the results chip
  const lensRow = document.getElementById('lensRow');
  if (lensRow && typeof _currentMode !== 'undefined') lensRow.style.display = _currentMode === 'gallery' && !activeSearch ? '' : 'none';
  if (!on) return;
  const m = _searchMeta || { label: activeSearch, tag: 'Card' };
  const active = (SEARCH_SORTS.find(o => o.order === sortOrder && o.dir === sortDir) || SEARCH_SORTS[0]).key;
  const sortPills = `<div class="l2-sort">${SEARCH_SORTS.map(o =>
    `<button class="l2-sort-btn ${o.key === active ? 'active' : ''}" onclick="setSearchSort('${o.key}')">${o.label}</button>`).join('')}</div>`;
  const count = `<span class="search-count" id="searchCount">${_feedTotal ? _feedTotal.toLocaleString() + ' artworks' : ''}</span>`;
  // The search as a title, its kind as a tinted chip beside it; cleared from the search bar (or Gallery tab on mobile)
  head.innerHTML = `
    <div class="search-row search-row--title">
      <h2 class="search-title">${m.label}</h2>
      <span class="search-kind-chip search-chip--${m.tag.toLowerCase()}">${SEARCH_KINDS[m.tag] || m.tag}</span>
      ${count}
      ${sortPills}
    </div>`;
}

// New random cards for the same lens/filters (↻ button, pull-to-refresh)
function reshuffleFeed() {
  dismissFeedHint();
  if (typeof _lensCache !== 'undefined' && typeof _activeLens !== 'undefined') delete _lensCache[_activeLens + ':' + (window._activeSubPill || '')];
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadInitialGrid(currentQuery);
}

// Deterministic height class from card id — same card always gets same height
function cardHeightClass(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = Math.abs(h) % 10;
  if (n < 2) return 'card-short';  // 20%
  if (n < 8) return 'card-normal'; // 60%
  return 'card-tall';              // 20%
}

// Entrance animation observer
let _entranceObserver = null;
function observeCardEntrance(el) {
  if (!_entranceObserver) {
    _entranceObserver = new IntersectionObserver((entries) => {
      let delay = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        card.style.transitionDelay = `${delay}ms`;
        delay += 40;
        card.classList.add('card-visible');
        _entranceObserver.unobserve(card);
        setTimeout(() => { card.style.transitionDelay = '0ms'; }, 400 + delay);
      });
    }, { threshold: 0.05 });
  }
  _entranceObserver.observe(el);
}

function renderCards(cards) {
  cards.forEach(card => {
    const artCrop = card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop;
    if (!artCrop) return;

    const el = document.createElement("div");
    el.className = `card ${cardHeightClass(card.id)}`;
    el.innerHTML = `
      <img src="${artCrop}" alt="${card.name.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'card-error', textContent: this.alt }))">
      <div class="overlay">
        <div class="name">${card.name}</div>
        <div class="artist">${card.artist || "Unknown"}</div>
      </div>
    `;
    el.addEventListener("click", () => openLightbox(card, 'feed'));
    grid.appendChild(el);
    observeCardEntrance(el);
  });
}

function showShimmers() {
  if (_entranceObserver) { _entranceObserver.disconnect(); _entranceObserver = null; }
  grid.innerHTML = "";
  const hClasses = ['card-short', 'card-normal', 'card-normal', 'card-normal', 'card-tall', 'card-normal', 'card-normal', 'card-short'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("div");
    s.className = `shimmer ${hClasses[i % hClasses.length]}`;
    grid.appendChild(s);
  }
}

// Infinite scroll
let scrollObserver = null;

function observeLastCard() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(async (entries) => {
    if (!entries[0].isIntersecting || isLoading || !_feedHasMore) return;
    scrollObserver.disconnect();
    const query = currentQuery, gen = _feedGen;
    const placeholders = appendShimmers(6);
    let data = [], hasMore = false;
    // Shuffle can land on a page already shown — try a couple of other pages
    for (let tries = 0; tries < 3 && !data.length; tries++) ({ data, hasMore } = await fetchCards(query));
    placeholders.forEach(el => el.remove());
    if (gen !== _feedGen) return; // feed changed while loading
    _feedHasMore = hasMore && data.length > 0;
    filteredCards = filteredCards.concat(data);
    renderCards(data);
    if (_feedHasMore) observeLastCard();
  }, { rootMargin: "600px" });

  const cards = grid.querySelectorAll(".card");
  if (cards.length) scrollObserver.observe(cards[cards.length - 1]);
}

function appendShimmers(n) {
  const hClasses = ['card-normal', 'card-tall', 'card-short', 'card-normal', 'card-normal', 'card-tall'];
  return Array.from({ length: n }, (_, i) => {
    const s = document.createElement("div");
    s.className = `shimmer ${hClasses[i % hClasses.length]}`;
    grid.appendChild(s);
    return s;
  });
}

// ── Tab switching ──────────────────────────────────────────────────────────────
let _activeTab = 'all';

function switchTab(tab) {
  _activeTab = tab;
  const allTab = document.getElementById('navTabAll');
  const catTab = document.getElementById('navTabCat');
  const gridEl = document.getElementById('grid');
  const loaderEl = document.getElementById('loader');
  const catPanel = document.getElementById('categoriesPanel');
  const row2 = document.getElementById('headerRow2');

  if (tab === 'all') {
    allTab.classList.add('active');
    catTab.classList.remove('active');
    gridEl.style.display = '';
    loaderEl.style.display = 'none';
    catPanel.style.display = 'none';
    row2.style.display = '';
    if (filteredCards.length === 0) loadInitialGrid();
  } else {
    catTab.classList.add('active');
    allTab.classList.remove('active');
    gridEl.style.display = 'none';
    loaderEl.style.display = 'none';
    catPanel.style.display = 'block';
    row2.style.display = 'none';
    renderCategories();
  }
}

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORY_DEFS = [
  { name: 'Artists',        icon: '👤', query: 'has:illustration',           count: '1,200+ artists' },
  { name: 'Creatures',      icon: '🐉', query: 't:creature has:illustration', count: 'Dragons, Angels...' },
  { name: 'Sets',           icon: '🃏', query: 'has:illustration',           count: '100+ sets' },
  { name: 'Art Style',      icon: '🎨', query: 'has:illustration',           count: 'Classic, Modern...' },
  { name: 'Era',            icon: '📅', query: 'has:illustration',           count: '1993 – today' },
  { name: 'Color',          icon: '🌈', query: 'has:illustration',           count: 'W U B R G Multi' },
];

let _catPreviews = {}; // cache preview images per category

async function renderCategories() {
  const catGrid = document.getElementById('catGrid');
  const searchBar = document.getElementById('catSearchBar');
  if (!catGrid) return;

  // Render folders immediately with placeholders
  catGrid.innerHTML = '';
  CATEGORY_DEFS.forEach((cat, i) => {
    const folder = document.createElement('div');
    folder.className = 'cat-folder';
    folder.dataset.idx = i;
    folder.innerHTML = `
      <div class="cat-previews" id="catPrev${i}">
        <div></div><div></div><div></div>
      </div>
      <div class="cat-folder-name">${cat.icon} ${cat.name}</div>
      <div class="cat-folder-count">${cat.count}</div>
    `;
    folder.addEventListener('click', () => openCategory(cat));
    catGrid.appendChild(folder);

    // Load preview images
    if (_catPreviews[i]) {
      fillCatPreviews(i, _catPreviews[i]);
    } else {
      const page = Math.floor(Math.random() * 20) + 1;
      fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cat.query)}&unique=art&order=released&dir=desc&page=${page}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (!json?.data) return;
          const imgs = json.data.filter(c => c.image_uris?.art_crop).slice(0, 3).map(c => c.image_uris.art_crop);
          _catPreviews[i] = imgs;
          fillCatPreviews(i, imgs);
        });
    }
  });

  // Client-side search filters folder list
  if (searchBar) {
    searchBar.oninput = () => {
      const q = searchBar.value.toLowerCase();
      catGrid.querySelectorAll('.cat-folder').forEach(f => {
        const name = CATEGORY_DEFS[f.dataset.idx].name.toLowerCase();
        f.style.display = name.includes(q) ? '' : 'none';
      });
    };
  }
}

function fillCatPreviews(idx, imgs) {
  const container = document.getElementById(`catPrev${idx}`);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const div = document.createElement('div');
    if (imgs[i]) {
      const img = document.createElement('img');
      img.src = imgs[i];
      img.loading = 'lazy';
      div.appendChild(img);
    }
    container.appendChild(div);
  }
}

function openCategory(cat) {
  // Switch to All Art tab with the category pre-applied
  switchTab('all');
  // Apply the category filter
  if (cat.name === 'Creatures') {
    activeType = ['creature'];
  } else if (cat.name === 'Color') {
    // Show color picker — open filters
    openDrawer();
    return;
  } else if (cat.name === 'Art Style') {
    openDrawer();
    return;
  } else if (cat.name === 'Era') {
    openDrawer();
    return;
  }
  updateChips();
  loadInitialGrid();
}

// Mobile floating Surprise Me
function mobileSurprise() {
  triggerSurprise();
}

// Mobile floating Surprise Me pill — long-press support
(function() {
  const pill = document.getElementById('surprisePillMobile');
  if (!pill) return;
  const btn = pill.querySelector('.surprise-pill-btn');
  if (!btn) return;
  let pressTimer = null;
  btn.addEventListener('touchstart', () => {
    btn.classList.add('pressing');
    pressTimer = setTimeout(() => { btn.classList.remove('pressing'); mobileSurprise(); }, 500);
  }, { passive: true });
  btn.addEventListener('touchend', () => { clearTimeout(pressTimer); btn.classList.remove('pressing'); });
  btn.addEventListener('touchcancel', () => { clearTimeout(pressTimer); btn.classList.remove('pressing'); });
})();

// Global keyboard shortcut: S = Surprise Me
document.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    if (document.activeElement.tagName === 'INPUT') return;
    triggerSurprise();
  }
});

// Scroll to top button
window.addEventListener("scroll", () => {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 800);
});

// Feed random button
const randomFeedBtn = document.getElementById("randomFeedBtn");
if (randomFeedBtn) {
  randomFeedBtn.addEventListener("click", () => triggerSurprise());
}

function restoreFilters() {
  // Staging: lens system owns filter state — skip localStorage restore, go straight to lens init
  if (typeof initLens === 'function') { window._lensSystemReady = true; initLens(); return; }
  loadInitialGrid();
}

// Init
// restoreFilters() is called from filters.js after all functions are defined
