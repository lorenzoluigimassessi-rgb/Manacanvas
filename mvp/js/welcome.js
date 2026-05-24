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
        <button class="welcome-cta" onclick="startSurprise()">
          <!-- Option 1: Simple card outline -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:0.4rem"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M8 6h.01M16 18h.01"/></svg>
          Draw a Card
        </button>
        <button class="welcome-cta" onclick="startSurprise()" style="margin-top:0.5rem;">
          <!-- Option 2: Card with diamond -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:0.4rem"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M12 7l2.5 4L12 15l-2.5-4L12 7z" fill="currentColor" stroke="none"/></svg>
          Draw a Card
        </button>
        <button class="welcome-cta" onclick="startSurprise()" style="margin-top:0.5rem;">
          <!-- Option 3: Stacked cards -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:0.4rem"><rect x="2" y="5" width="15" height="18" rx="2"/><path d="M7 2h13a2 2 0 0 1 2 2v15"/></svg>
          Draw a Card
        </button>
        <button class="welcome-cta" onclick="startSurprise()" style="margin-top:0.5rem;">
          <!-- Option 4: Card being drawn -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:0.4rem"><rect x="3" y="4" width="14" height="18" rx="2"/><path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"/><path d="M10 9l3 3-3 3"/></svg>
          Draw a Card
        </button>
        <button class="welcome-cta" onclick="startSurprise()" style="margin-top:0.5rem;">
          <!-- Option 5: Sparkle -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:0.4rem"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
          Draw a Card
        </button>
        <p class="welcome-draw-separator">or</p>
        <button class="welcome-draw-cta" onclick="startBrowse()"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>Browse the Gallery</button>
      </div>
      <footer class="site-footer welcome-footer">
        <p>ManaCanvas is unofficial Fan Content, not approved/endorsed by Wizards of the Coast. Card images © Wizards of the Coast.</p>
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
  const bar = document.getElementById("mobileActionBar");
  if (bar) bar.style.display = "none";
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
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  const bar = document.getElementById("mobileActionBar");
  if (bar) bar.style.removeProperty("display");
  loadInitialGrid();
}

function startSurprise() {
  localStorage.setItem('mc_entered', '1');
  window._surpriseHistory = [];
  // Show dice spinner while card loads
  welcomeEl.style.display = 'none';
  appShell.style.display = 'block';
  const bar = document.getElementById('mobileActionBar');
  if (bar) bar.style.removeProperty('display');
  const lightbox = document.getElementById('lightbox');
  lightbox.style.background = '#0c0c0f';
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" style="background:#0c0c0f;">
      <button class="close-btn" id="lbSkeletonClose" style="color:rgba(240,240,240,0.25);">✕</button>
      <svg class="transition-dice pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="4" ry="4"/>
        <circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/>
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
    fetchRandomCard().then(card => { if (card) openLightbox(card, 'surprise'); });
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
