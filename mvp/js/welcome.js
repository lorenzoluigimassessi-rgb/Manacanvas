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

async function renderWelcome() {
  welcomeEl.innerHTML = `
    <div class="welcome-page" id="welcomeBg">
      <div class="welcome-overlay"></div>
      <div class="welcome-hero">
        <h1 class="welcome-title">MANACANVAS</h1>
        <p class="welcome-subtitle">Discover 30 years of Magic: The Gathering artwork</p>
        <button class="welcome-cta" onclick="startBrowse()">Browse the Gallery</button>
        <p class="welcome-draw-separator">or</p>
        <button class="welcome-draw-cta" onclick="startSurprise()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg>Surprise Me</button>
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

function startBrowse() {
  localStorage.setItem("mc_entered", "1");
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  loadInitialGrid();
}

function startSurprise() {
  localStorage.setItem("mc_entered", "1");
  const el = document.getElementById('transition');
  const dice = el.querySelector('.transition-dice');
  el.classList.add('active');
  // After roll completes, switch to pulse while fetching
  setTimeout(() => { dice.classList.add('pulse'); }, 900);
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  loadInitialGrid();
  fetchRandomCard().then(card => {
    dice.classList.remove('pulse');
    el.classList.remove('active');
    if (card) openLightbox(card, 'surprise');
  });
}

// On load: skip welcome if user has been here before
if (localStorage.getItem("mc_entered")) {
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
} else {
  renderWelcome();
}
