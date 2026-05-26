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

async function loadInitialGrid() {
  // Reset all fetch state immediately to prevent stale data from previous queries
  isLoading = false;
  nextPageUrl = null;
  window._randomPool = [];
  window._randomPoolQuery = null;
  // Save current filter state to localStorage
  localStorage.setItem("mc_filters", JSON.stringify({
    activeArtist, activeType, activeCardType, activeColour,
    activeSets, activeStyles, activeYearMin, activeYearMax, activeSearch,
    sortOrder, sortDir
  }));
  showShimmers();
  resetPagination();
  const query = buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, (typeof ART_STYLES !== 'undefined' ? activeStyles.map(i => ART_STYLES[i]) : []), activeYearMin, activeYearMax, activeSearch);
  const { data, hasMore, rateLimited } = await fetchCards(query);
  grid.innerHTML = "";
  if (!data.length) {
    grid.innerHTML = rateLimited
      ? `<div class="empty-state"><h2>Too many requests</h2><p>Scryfall is rate limiting us. Wait a moment and try again.</p></div>`
      : `<div class="empty-state"><h2>No artwork found</h2><p>Try adjusting your filters or clearing them to browse all art.</p></div>`;
    return;
  }
  filteredCards = data;
  renderCards(data);
  if (hasMore) observeLastCard();
  // Write to lens cache
  if (typeof _lensCache !== 'undefined' && typeof _activeLens !== 'undefined') {
    const key = _activeLens + ':' + (typeof _activeSubPill !== 'undefined' ? (_activeSubPill || '') : '');
    _lensCache[key] = { cards: data, hasMore };
  }
}

function renderCards(cards) {
  cards.forEach(card => {
    const artCrop = card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop;
    if (!artCrop) return;

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <img src="${artCrop}" alt="${card.name}" loading="lazy" onerror="this.outerHTML='<div class=card-error>${card.name}<br><small>Image unavailable</small></div>'">
      <div class="overlay">
        <div class="name">${card.name}</div>
        <div class="artist">${card.artist || "Unknown"}</div>
      </div>
    `;
    el.addEventListener("click", () => openLightbox(card, 'feed'));
    grid.appendChild(el);
  });
}

function showShimmers() {
  grid.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("div");
    s.className = "shimmer";
    s.style.minHeight = `${180 + Math.random() * 80}px`;
    grid.appendChild(s);
  }
}

// Infinite scroll
let scrollObserver = null;

function observeLastCard() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && !isLoading && nextPageUrl) {
      loader.style.display = "block";
      const { data, hasMore } = await fetchCards();
      loader.style.display = "none";
      filteredCards = filteredCards.concat(data);
      renderCards(data);
      if (hasMore) observeLastCard();
    }
  }, { rootMargin: "200px" });

  const cards = grid.querySelectorAll(".card");
  if (cards.length) scrollObserver.observe(cards[cards.length - 1]);
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
  const saved = localStorage.getItem("mc_filters");
  if (!saved) { loadInitialGrid(); return; }
  try {
    const f = JSON.parse(saved);
    activeArtist    = Array.isArray(f.activeArtist)   ? f.activeArtist   : (f.activeArtist   ? [f.activeArtist]   : []);
    activeType      = Array.isArray(f.activeType)     ? f.activeType     : (f.activeType     ? [f.activeType]     : []);
    activeCardType  = Array.isArray(f.activeCardType) ? f.activeCardType : (f.activeCardType ? [f.activeCardType] : []);
    activeColour    = Array.isArray(f.activeColour)   ? f.activeColour   : (f.activeColour   ? [f.activeColour]   : []);
    activeSets      = Array.isArray(f.activeSets)     ? f.activeSets     : [];
    activeStyles    = Array.isArray(f.activeStyles)   ? f.activeStyles   : [];
    activeYearMin   = f.activeYearMin   || null;
    activeYearMax   = f.activeYearMax   || null;
    activeSearch    = f.activeSearch    || null;
    if (f.sortOrder && f.sortOrder !== 'random') sortOrder = f.sortOrder;
    if (f.sortDir   && f.sortDir   !== 'auto')   sortDir   = f.sortDir;
  } catch(e) {
    localStorage.removeItem("mc_filters");
  }
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
