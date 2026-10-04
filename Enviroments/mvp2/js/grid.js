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
  updateFeedBar();
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
  updateFeedBar();
  if (hasMore) observeLastCard();
}

// "Browse by category" band after the first rows of the All feed
function insertFeedBridge() {
  if (typeof _activeLens === 'undefined' || _activeLens !== 'picks' || activeSearch) return;
  const after = grid.querySelectorAll('.card')[19];
  if (!after) return;
  const band = document.createElement('div');
  band.className = 'feed-bridge';
  band.innerHTML = `<span>Looking for something specific?</span>
    <button onclick="setMode('collections')">Browse by artist, set or colour <span aria-hidden="true">→</span></button>`;
  after.after(band);
}

// Order caption + sort control above the grid
function updateFeedBar() {
  const bar = document.getElementById('feedBar');
  if (!bar) return;
  const opt = SORT_OPTIONS.find(o => o.order === sortOrder && o.dir === sortDir) || SORT_OPTIONS[0];
  document.getElementById('feedCaption').textContent = opt.caption;
  document.getElementById('feedShuffle').style.display = opt.order === 'random' ? '' : 'none';
  document.getElementById('feedSort').innerHTML = SORT_OPTIONS.map((o, i) =>
    `<button class="l2-sort-btn ${o === opt ? 'active' : ''}" onclick="setFeedSort(${i})">${o.label}</button>`).join('');
}

function setFeedSort(i) {
  const opt = SORT_OPTIONS[i];
  sortOrder = opt.order; sortDir = opt.dir;
  localStorage.setItem("mc_sort", JSON.stringify({ order: opt.order, dir: opt.dir }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadInitialGrid(currentQuery);
}

// New random cards for the same lens/filters (↻ button, pull-to-refresh)
function reshuffleFeed() {
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

// Pull-to-refresh — mobile only, triggers new shuffle on All lens
(function initPullToRefresh() {
  if (!('ontouchstart' in window)) return;
  let startY = 0, pulling = false;
  const indicator = document.createElement('div');
  indicator.id = 'pullIndicator';
  indicator.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-100%);background:var(--surface);border:1px solid var(--border);border-radius:0 0 20px 20px;padding:0.4rem 1.2rem;font-size:0.75rem;color:var(--text-secondary);z-index:99;transition:transform 200ms ease;pointer-events:none;';
  indicator.textContent = '↓ Pull to shuffle';
  document.body.appendChild(indicator);

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const delta = e.touches[0].clientY - startY;
    if (delta > 10) indicator.style.transform = `translateX(-50%) translateY(${Math.min(delta - 10, 48)}px)`;
    if (delta > 60) indicator.textContent = '↑ Release to shuffle';
    else indicator.textContent = '↓ Pull to shuffle';
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!pulling) return;
    pulling = false;
    const delta = e.changedTouches[0].clientY - startY;
    indicator.style.transform = 'translateX(-50%) translateY(-100%)';
    indicator.textContent = '↓ Pull to shuffle';
    if (delta > 60 && window.scrollY === 0) {
      // Clear All lens cache so reshuffle fetches fresh cards
      if (typeof _lensCache !== 'undefined') delete _lensCache['picks:'];
      window.scrollTo({ top: 0 });
      loadInitialGrid();
    }
  });
})();
