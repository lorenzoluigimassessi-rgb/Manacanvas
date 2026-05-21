// Grid rendering + infinite scroll
const grid = document.getElementById("grid");
const loader = document.getElementById("loader");
const scrollTopBtn = document.getElementById("scrollTop");

let activeArtist = null;
let activeType = null;
let activeSet = null;
let activeYearMin = null;
let activeYearMax = null;
let activeSearch = null;

async function loadInitialGrid() {
  showShimmers();
  resetPagination();
  const query = buildQuery(activeArtist, activeType, activeSet, activeYearMin, activeYearMax, activeSearch);
  const { data, hasMore } = await fetchCards(query);
  grid.innerHTML = "";
  if (!data.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h2>No artwork found</h2><p>Try adjusting your filters or clearing them to browse all art.</p></div>`;
    return;
  }
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
    el.addEventListener("click", () => openLightbox(card));
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
      renderCards(data);
      if (hasMore) observeLastCard();
    }
  }, { rootMargin: "200px" });

  const cards = grid.querySelectorAll(".card");
  if (cards.length) scrollObserver.observe(cards[cards.length - 1]);
}

// Scroll to top button
window.addEventListener("scroll", () => {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 800);
});

// Init
loadInitialGrid();
