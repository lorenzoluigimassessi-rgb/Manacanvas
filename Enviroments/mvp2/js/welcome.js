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

async function _prefetchHomeBg(count = 4) {
  const results = await Promise.all(Array.from({ length: count }, () => fetchRandomArt()));
  _bgQueue = [..._bgQueue, ...results.filter(Boolean)];
}

function startHomeBg() {
  const layerA = document.getElementById('homeBgA');
  const layerB = document.getElementById('homeBgB');
  if (!layerA || !layerB) return;
  if (_bgQueue.length === 0) {
    _prefetchHomeBg(4).then(() => startHomeBg());
    return;
  }

  // Reset layers
  layerA.style.backgroundImage = `url('${_bgQueue[0]}')`;
  layerA.style.opacity = '1';
  layerB.style.opacity = '0';

  let front = layerA, back = layerB, imgIdx = 0;

  clearInterval(_bgInterval);
  _bgInterval = setInterval(() => {
    imgIdx = (imgIdx + 1) % _bgQueue.length;
    back.style.backgroundImage = `url('${_bgQueue[imgIdx]}')`;
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
  sidebarNav('gallery');
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
  setMode('gallery');
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
}

(function restoreSidebar() {
  if (localStorage.getItem('mg_sidebar_seen') === '1') {
    if (localStorage.getItem('mg_sidebar_expanded') === '1') {
      document.body.classList.add('sidebar-expanded');
    }
  }
})();

function _initFirstScrollCollapse() {
  if (localStorage.getItem('mg_sidebar_seen') === '1') return;
  localStorage.setItem('mg_sidebar_seen', '1');
}

function sidebarNav(mode) {
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(el => el.classList.remove('active'));
  const map = { gallery: 'sideGallery', search: 'sideSearch', collections: 'sideCollections', settings: 'sideSettings', about: 'sideAbout' };
  if (map[mode]) document.getElementById(map[mode])?.classList.add('active');

  if (mode === 'gallery')          setMode('gallery');
  else if (mode === 'collections') setMode('collections');
  else if (mode === 'about')       setMode('about');
  else if (mode === 'search') {
    setMode('gallery');
    setTimeout(() => document.getElementById('searchBar')?.focus(), 50);
  }
  else if (mode === 'settings') openSidePanel('settings');
}

// Prefetch art and grid data in background (setMode('home') called after inline scripts load)
_prefetchHomeBg(4);
if (typeof loadInitialGrid === 'function') loadInitialGrid();
