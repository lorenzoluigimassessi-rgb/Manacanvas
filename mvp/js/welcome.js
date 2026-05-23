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
        <p class="welcome-subtitle">Discover the art of Magic:&#174; The Gathering</p>
        <button class="welcome-cta" onclick="startSurprise()">Surprise Me</button>
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
  localStorage.setItem("mc_entered", "1");
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  const bar = document.getElementById("mobileActionBar");
  if (bar) bar.style.removeProperty("display");
  loadInitialGrid();
  // Use pre-fetched card for instant open, fallback to fetch if not ready
  if (_welcomeCard) {
    openLightbox(_welcomeCard, 'surprise');
    _welcomeCard = null;
    fetchRandomCard().then(c => { _welcomeCard = c; }); // pre-warm next
  } else {
    fetchRandomCard().then(card => { if (card) openLightbox(card, 'surprise'); });
  }
}

// On load: skip welcome if user has been here before
if (localStorage.getItem("mc_entered")) {
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
} else {
  const bar = document.getElementById("mobileActionBar");
  if (bar) bar.style.display = "none";
  renderWelcome();
}
