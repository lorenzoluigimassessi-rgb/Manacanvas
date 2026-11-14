const WELCOME_ART_QUERIES = [
  "t:dragon is:hires year>=2010",
  "t:angel is:hires year>=2010",
  "t:demon is:hires year>=2010",
  "t:horror is:hires year>=2012",
  "t:eldrazi is:hires year>=2010",
  "a:\"Seb McKinnon\" is:hires year>=2010",
  "a:\"Magali Villeneuve\" is:hires year>=2010",
  "a:\"John Avon\" t:land is:hires year>=2005",
];

async function fetchRandomArt() {
  const query = WELCOME_ART_QUERIES[Math.floor(Math.random() * WELCOME_ART_QUERIES.length)];
  try {
    const res = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`);
    const card = await res.json();
    return card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop || null;
  } catch (e) {
    return null;
  }
}

// Pre-fetch first surprise card after DOM is ready
let _welcomeCard = null;
window.addEventListener('load', () => {
  fetchRandomCard().then(c => { _welcomeCard = c; });
});

// Background rotation state for Home panel
let _bgQueue = [];
let _bgInterval = null;

let _bgPrefetch = null; // one prefetch at a time (Home used to start two at once: 8 requests in a burst)
function _prefetchHomeBg(count = 4) {
  if (_bgPrefetch) return _bgPrefetch;
  _bgPrefetch = Promise.all(Array.from({ length: count }, () => fetchRandomArt()))
    .then(results => { _bgQueue = [..._bgQueue, ...results.filter(Boolean)]; })
    .finally(() => { _bgPrefetch = null; });
  return _bgPrefetch;
}

function startHomeBg() {
  const layerA = document.getElementById('homeBgA');
  const layerB = document.getElementById('homeBgB');
  if (!layerA || !layerB) return;
  if (_bgQueue.length === 0) {
    // Nothing yet: try again a few times, slower each time — never an endless burst of requests
    // (that's what got Scryfall to block us, and then no images loaded anywhere)
    const tries = (startHomeBg._tries = (startHomeBg._tries || 0) + 1);
    if (tries > 3) return;
    _prefetchHomeBg(4).then(() => setTimeout(startHomeBg, tries * 1500));
    return;
  }
  startHomeBg._tries = 0;

  // Reset layers
  layerA.style.backgroundImage = `url('${_bgQueue[0]}')`;
  window._homeBgUrl = _bgQueue[0]; // Search borrows the Home artwork's colours
  layerA.style.opacity = '1';
  layerB.style.opacity = '0';

  let front = layerA, back = layerB, imgIdx = 0;

  clearInterval(_bgInterval);
  _bgInterval = setInterval(() => {
    imgIdx = (imgIdx + 1) % _bgQueue.length;
    back.style.backgroundImage = `url('${_bgQueue[imgIdx]}')`;
    window._homeBgUrl = _bgQueue[imgIdx];
    back.style.opacity = '1';
    front.style.opacity = '0';
    [front, back] = [back, front];
    if (_bgQueue.length < 6) fetchRandomArt().then(u => { if (u) _bgQueue.push(u); });
  }, 7000);
}

function stopBgRotation() {
  clearInterval(_bgInterval);
  _bgInterval = null;
}

// ── Navigation ──

function navToHome() {
  if (typeof closeSidePanel === 'function') closeSidePanel();
  setMode('home');
}

function goHome() { navToHome(); }
function showWelcome() { navToHome(); }

function goGallery() {
  _initFirstScrollCollapse();
  if (typeof freshGallery === 'function') freshGallery(); // fresh shuffle from Home
  else sidebarNav('gallery');
}

function goSearch() {
  _initFirstScrollCollapse();
  sidebarNav('search');
}

function goCollections() {
  _initFirstScrollCollapse();
  sidebarNav('collections');
}

function goPull() {
  _initFirstScrollCollapse();
  if (typeof _currentMode === 'undefined' || _currentMode !== 'gallery') setMode('gallery');
  if (typeof triggerDrawRitual === 'function') triggerDrawRitual();
}

function startBrowse() { goGallery(); }

function startSurprise() {
  window._surpriseHistory = [];
  setMode('gallery');
  const lightbox = document.getElementById('lightbox');
  lightbox.style.background = '#0c0c0f';
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" style="background:#0c0c0f;">
      <button class="close-btn" id="lbSkeletonClose" style="color:rgba(240,240,240,0.25);">✕</button>
      <svg class="transition-dice pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  document.getElementById('lbSkeletonClose').addEventListener('click', () => { closeLightbox(); goHome(); });
  loadInitialGrid();
  if (_welcomeCard) {
    openLightbox(_welcomeCard, 'surprise');
    _welcomeCard = null;
    fetchRandomCard().then(c => { _welcomeCard = c; });
  } else {
    fetchRandomCard().then(card => {
      if (card) openLightbox(card, 'surprise');
      else { closeLightbox(); goHome(); }
    });
  }
}

function showTransition(callback) {
  const el = document.getElementById('transition');
  el.classList.add('active');
  setTimeout(() => {
    callback();
    setTimeout(() => el.classList.remove('active'), 400);
  }, 900);
}

function triggerSurprise() {
  const el = document.getElementById('transition');
  const dice = el.querySelector('.transition-dice');
  dice.classList.remove('pulse');
  void dice.offsetWidth;
  el.classList.add('active');
  setTimeout(() => { dice.classList.add('pulse'); }, 900);
  fetchRandomCard().then(card => {
    dice.classList.remove('pulse');
    el.classList.remove('active');
    if (card) openLightbox(card, 'surprise');
  });
}

// Sidebar collapse toggle — persists last state
function toggleSidebar() {
  const expanded = document.body.classList.toggle('sidebar-expanded');
  localStorage.setItem('mg_sidebar_expanded', expanded ? '1' : '0');
  document.querySelector('.sidebar-collapse')?.setAttribute('aria-expanded', expanded);
}

(function restoreSidebar() {
  if (localStorage.getItem('mg_sidebar_seen') === '1') {
    if (localStorage.getItem('mg_sidebar_expanded') === '1') {
      document.body.classList.add('sidebar-expanded');
      document.querySelector('.sidebar-collapse')?.setAttribute('aria-expanded', 'true');
    }
  }
})();

function _initFirstScrollCollapse() {
  if (localStorage.getItem('mg_sidebar_seen') === '1') return;
  localStorage.setItem('mg_sidebar_seen', '1');
}

function sidebarNav(mode) {
  if (mode === 'gallery')          (typeof galleryTab === 'function' ? galleryTab : () => setMode('gallery'))();
  else if (mode === 'collections') setMode('collections');
  else if (mode === 'about')       setMode('about');
  else if (mode === 'search') {
    setMode('gallery');
    setTimeout(() => document.getElementById('searchBar')?.focus(), 50);
  }
  else if (mode === 'settings') openSidePanel('settings');

  // setMode already highlights the page; only override when this entry has its own item
  const map = { gallery: 'sideGallery', collections: 'sideCollections', settings: 'sideSettings', about: 'sideAbout' };
  const item = map[mode] && document.getElementById(map[mode]);
  if (item) {
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
  }
}

// Prefetch art and grid data in background (setMode('home') called after inline scripts load)
_prefetchHomeBg(4);
if (typeof loadInitialGrid === 'function') loadInitialGrid();
