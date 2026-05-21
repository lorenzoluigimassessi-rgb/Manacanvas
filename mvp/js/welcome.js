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
  const artUrl = await fetchRandomArt();
  const bgStyle = artUrl ? `background-image: url('${artUrl}'); background-size: cover; background-position: center;` : "";

  welcomeEl.innerHTML = `
    <div class="welcome-page" style="${bgStyle}">
      <div class="welcome-overlay"></div>
      <div class="welcome-hero">
        <h1 class="welcome-title">MANACANVAS</h1>
        <p class="welcome-subtitle">Discover 30 years of Magic: The Gathering artwork</p>
        <button class="welcome-cta" onclick="startBrowse()">Start Browsing →</button>
      </div>
      <footer class="site-footer welcome-footer">
        <p>ManaCanvas is unofficial Fan Content, not approved/endorsed by Wizards of the Coast. Card images © Wizards of the Coast.</p>
      </footer>
    </div>
  `;
}

function showWelcome() {
  appShell.style.display = "none";
  welcomeEl.style.display = "block";
  renderWelcome();
}

function startBrowse() {
  welcomeEl.style.display = "none";
  appShell.style.display = "block";
  loadInitialGrid();
}

renderWelcome();
