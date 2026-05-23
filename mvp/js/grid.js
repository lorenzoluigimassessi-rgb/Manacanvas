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
  // Save current filter state to localStorage
  localStorage.setItem("mc_filters", JSON.stringify({
    activeArtist, activeType, activeCardType, activeColour,
    activeSets, activeStyles, activeYearMin, activeYearMax, activeSearch,
    sortOrder, sortDir
  }));
  showShimmers();
  resetPagination();
  const query = buildQuery(activeArtist, activeType, activeCardType, activeColour, activeSets, (typeof ART_STYLES !== 'undefined' ? activeStyles.map(i => ART_STYLES[i]) : []), activeYearMin, activeYearMax, activeSearch);
  const { data, hasMore } = await fetchCards(query);
  grid.innerHTML = "";
  if (!data.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h2>No artwork found</h2><p>Try adjusting your filters or clearing them to browse all art.</p></div>`;
    return;
  }
  filteredCards = data;
  renderCards(data);
  if (hasMore) observeLastCard();
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

// Mobile floating Surprise Me
function mobileSurprise() {
  const btn = document.querySelector('.surprise-pill-btn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:lbSpin 0.8s linear infinite"><circle cx="12" cy="12" r="9" stroke-opacity="0.2"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>`;
  fetchRandomCard().then(card => {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me`;
    if (card) openLightbox(card, 'surprise');
  });
}

// Mobile floating Surprise Me pill — long-press support
(function() {
  const pill = document.getElementById('surprisePillMobile');
  if (!pill) return;
  const btn = pill.querySelector('.surprise-pill-btn');
  let pressTimer = null;

  // Long-press (500ms) also triggers
  btn.addEventListener('touchstart', () => {
    btn.classList.add('pressing');
    pressTimer = setTimeout(() => { btn.classList.remove('pressing'); mobileSurprise(); }, 500);
  }, { passive: true });
  btn.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
    btn.classList.remove('pressing');
  });
  btn.addEventListener('touchcancel', () => {
    clearTimeout(pressTimer);
    btn.classList.remove('pressing');
  });

  // Dim slightly on scroll, restore on stop
  let lastY = 0, pillTimer = null;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY + 10) pill.classList.add('scroll-hidden');
    else if (y < lastY - 5) pill.classList.remove('scroll-hidden');
    lastY = y;
    clearTimeout(pillTimer);
    pillTimer = setTimeout(() => pill.classList.remove('scroll-hidden'), 600);
  }, { passive: true });
})();

// Global keyboard shortcut: S = Surprise Me
document.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    // Only fire if no input is focused
    if (document.activeElement.tagName === 'INPUT') return;
    const btn = document.getElementById('randomFeedBtn');
    if (btn && !btn.disabled) btn.click();
  }
});

// Scroll to top button
window.addEventListener("scroll", () => {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 800);
});

// Feed random button
const randomFeedBtn = document.getElementById("randomFeedBtn");
if (randomFeedBtn) {
  randomFeedBtn.addEventListener("click", async () => {
    randomFeedBtn.disabled = true;
    randomFeedBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:lbSpin 0.8s linear infinite"><circle cx="12" cy="12" r="9" stroke-opacity="0.2"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>`;
    const card = await fetchRandomCard();
    randomFeedBtn.disabled = false;
    randomFeedBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me`;
    if (card) openLightbox(card, 'surprise');
  });
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
    if (f.sortOrder) sortOrder = f.sortOrder;
    if (f.sortDir)   sortDir   = f.sortDir;
  } catch(e) {
    localStorage.removeItem("mc_filters");
  }
  loadInitialGrid();
}

// Init
// restoreFilters() is called from filters.js after all functions are defined
