// Welcome — Option 1: Hero + CTA with random MTG art background
const welcomeEl = document.getElementById("welcome");
const appShell = document.getElementById("appShell");

const WELCOME_ART_QUERIES = [
  "t:dragon is:hires",
  "t:angel is:hires",
  "t:demon is:hires",
  "t:horror is:hires",
  "t:eldrazi is:hires",
  "a:\"Seb McKinnon\" is:hires",
  "a:\"Magali Villeneuve\" is:hires",
  "a:\"John Avon\" t:land is:hires",
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

async function renderWelcome() {
  welcomeEl.innerHTML = `
    <div class="welcome-page" id="welcomeBg">
      <div class="welcome-overlay"></div>
      <div class="welcome-hero">
        <h1 class="welcome-title">MANACANVAS</h1>
        <p class="welcome-subtitle">Discover the art of Magic: The Gathering&#174;</p>
        <button class="welcome-cta" onclick="startSurprise()">Draw a Card</button>
        <p class="welcome-draw-separator">or</p>
        <button class="welcome-draw-cta" onclick="startBrowse()">Browse the Gallery</button>
      </div>
      <footer class="site-footer welcome-footer">
        <p>ManaCanvas is unofficial Fan Content, not approved/endorsed by Wizards of the Coast. Card images &copy; Wizards of the Coast.</p>
      </footer>
    </div>
  `;
  fetchRandomArt().then(artUrl => {
    if (!artUrl) return;
    const bg = document.getElementById("welcomeBg");
    if (bg) bg.style.cssText = `background-image:url('${artUrl}');background-size:cover;background-position:center;`;
  });
}

function showWelcome() {
  localStorage.removeItem("mc_entered");
  localStorage.removeItem("mc_filters");
  resetAllState();
  appShell.style.display = "none";
  welcomeEl.style.display = "block";
  renderWelcome();
}

function showTransition(callback) {
  const el = document.getElementById('transition');
  el.classList.add('active');
  setTimeout(() => {
    callback();
    setTimeout(() => el.classList.remove('active'), 400);
  }, 900);
}

// Shared Surprise Me ritual — used by welcome, header button, mobile pill
function triggerSurprise() {
  const el = document.getElementById('transition');
  const dice = el.querySelector('.transition-dice');
  // Reset dice animation
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

function startBrowse() {
  localStorage.setItem("mc_entered", "1");
  sortOrder = "released";
  sortDir = "asc";
  const sortBtn = document.getElementById("sortBtn");
  if (sortBtn) sortBtn.textContent = "Oldest First ⇅";
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  setMode('gallery');
}

function startSurprise() {
  localStorage.setItem('mc_entered', '1');
  window._surpriseHistory = [];
  // Show dice spinner while card loads
  welcomeEl.style.display = 'none';
  appShell.style.display = 'block';
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
  document.getElementById('lbSkeletonClose').addEventListener('click', () => { closeLightbox(); showWelcome(); });
  loadInitialGrid();
  if (_welcomeCard) {
    openLightbox(_welcomeCard, 'surprise');
    _welcomeCard = null;
    fetchRandomCard().then(c => { _welcomeCard = c; });
  } else {
    fetchRandomCard().then(card => {
      if (card) openLightbox(card, 'surprise');
      else { closeLightbox(); showWelcome(); }
    });
  }
}

// On load: skip welcome if user has been here before
if (localStorage.getItem("mc_entered")) {
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  // Restore lightbox if it was open before reload
  const savedLb = localStorage.getItem('mc_lightbox');
  if (savedLb) {
    try {
      const { id, mode } = JSON.parse(savedLb);
      // Wait for grid to load, then restore
      const restoreLightbox = () => {
        if (mode === 'feed') {
          // Try from filteredCards first, fallback to Scryfall
          const card = filteredCards.find(c => c.id === id);
          if (card) { openLightbox(card, 'feed'); return; }
        }
        // For surprise or card not in feed — fetch by id
        fetch(`https://api.scryfall.com/cards/${id}`)
          .then(r => r.ok ? r.json() : null)
          .then(card => { if (card && card.id) openLightbox(card, mode); });
      };
      // Give grid a moment to populate filteredCards
      setTimeout(restoreLightbox, 600);
    } catch(e) { localStorage.removeItem('mc_lightbox'); }
  }
} else {
  const bar = document.getElementById("mobileActionBar");
  if (bar) bar.style.display = "none";
  renderWelcome();
}
