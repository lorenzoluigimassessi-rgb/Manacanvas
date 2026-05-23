// Lightbox — detail view with frame toggle + zoom/pan
let currentCard = null;
let currentMode = "art"; // "art" or "frame"
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTx = 0;
let lastTy = 0;

function openLightbox(card) {
  currentCard = card;
  currentMode = "art";
  scale = 1;
  translateX = 0;
  translateY = 0;

  const artCrop = card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop;
  const normal = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
  const hasArtCrop = !!artCrop;
  const setName = card.set_name || "";
  const year = card.released_at ? card.released_at.slice(0, 4) : "";
  const disabledAttr = !hasArtCrop ? 'style="opacity:0.4;cursor:not-allowed;"' : '';
  const disabledTitle = !hasArtCrop ? 'title="Art-only view unavailable for this card"' : '';

  const lightbox = document.getElementById("lightbox");
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay">
      <button class="close-btn" id="lbClose">✕</button>
      <button class="lb-nav-arrow" id="lbPrev">‹</button>
      <button class="lb-nav-arrow" id="lbNext">›</button>
      <div class="art-container" id="artContainer">
        <img id="lbImage" src="${artCrop || normal}" alt="${card.name}">
      </div>
      <div class="meta">
        <div class="name">${card.name}</div>
        <div class="details">
          <span class="meta-link" id="lbArtist">${card.artist || "Unknown"}</span>
          ${setName ? ` · <span class="meta-link" id="lbSet">${setName}</span>` : ""}
          ${year ? ` · <span class="meta-link" id="lbYear">${year}</span>` : ""}
        </div>
      </div>
      <div class="lightbox-actions">
        <div class="toggle">
          <button id="toggleArt" class="active" ${disabledAttr} ${disabledTitle}>Art Only</button>
          <button id="toggleFrame">With Frame</button>
        </div>
        <button class="random-btn" id="lbRandom" title="Discover a random artwork"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me</button>
      </div>
      <div class="zoom-hint" id="zoomHint">Scroll to zoom · Drag to pan · Double-click to reset · R for random</div>
    </div>
  `;

  // Lock body scroll
  document.body.style.overflow = "hidden";

  // Fade out zoom hint
  setTimeout(() => { const h = document.getElementById("zoomHint"); if (h) h.style.opacity = "0"; }, 3000);

  // Close handlers
  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay").addEventListener("click", (e) => {
    if (e.target.id === "lightboxOverlay") closeLightbox();
  });
  document.addEventListener("keydown", handleLbKey);

  // Prev/next nav
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const currentIndex = typeof filteredCards !== 'undefined' ? filteredCards.indexOf(card) : -1;
  if (currentIndex <= 0) lbPrev.classList.add('hidden');
  if (currentIndex === -1 || (typeof filteredCards !== 'undefined' && currentIndex >= filteredCards.length - 1)) lbNext.classList.add('hidden');

  lbPrev.addEventListener('click', () => {
    if (currentIndex > 0) openLightbox(filteredCards[currentIndex - 1]);
  });
  lbNext.addEventListener('click', () => {
    if (typeof filteredCards !== 'undefined' && currentIndex < filteredCards.length - 1) openLightbox(filteredCards[currentIndex + 1]);
  });

  // Mobile swipe on art for prev/next
  let lbSwipeStartX = 0;
  const artContainer = document.getElementById("artContainer");
  artContainer.addEventListener('touchstart', (e) => { lbSwipeStartX = e.touches[0].clientX; }, { passive: true });
  artContainer.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - lbSwipeStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && currentIndex < filteredCards.length - 1) openLightbox(filteredCards[currentIndex + 1]);
    if (dx > 0 && currentIndex > 0) openLightbox(filteredCards[currentIndex - 1]);
  });

  // Frame toggle
  const img = document.getElementById("lbImage");
  document.getElementById("toggleArt").addEventListener("click", () => {
    if (!hasArtCrop) return;
    currentMode = "art";
    img.src = artCrop;
    document.getElementById("toggleArt").classList.add("active");
    document.getElementById("toggleFrame").classList.remove("active");
    resetZoom();
  });
  document.getElementById("toggleFrame").addEventListener("click", () => {
    currentMode = "frame";
    img.src = normal;
    document.getElementById("toggleFrame").classList.add("active");
    document.getElementById("toggleArt").classList.remove("active");
    resetZoom();
  });

  // Meta link handlers
  document.getElementById("lbArtist").addEventListener("click", () => {
    closeLightbox();
    activeArtist = [card.artist];
    if (!isMobile()) {
      const btn = document.getElementById("artistBtn");
      if (btn) { btn.textContent = card.artist + " ▾"; btn.classList.add("active"); }
    }
    updateChips();
    loadInitialGrid();
  });
  if (setName) document.getElementById("lbSet").addEventListener("click", () => {
    closeLightbox();
    activeSets = [card.set];
    if (!isMobile()) {
      const s = setList.find(s => s.code === card.set);
      const btn = document.getElementById("setBtn");
      if (btn) { btn.textContent = (s ? s.name : setName) + " ▾"; btn.classList.add("active"); }
    }
    updateChips();
    loadInitialGrid();
  });
  if (year) document.getElementById("lbYear").addEventListener("click", () => {
    closeLightbox();
    activeYearMin = parseInt(year);
    activeYearMax = parseInt(year);
    if (!isMobile()) {
      const btn = document.getElementById("yearBtn");
      if (btn) { btn.textContent = `${year}–${year}`; btn.classList.add("active"); }
    }
    updateChips();
    loadInitialGrid();
  });

  // Random button
  document.getElementById("lbRandom").addEventListener("click", () => loadRandomCard());
  const container = document.getElementById("artContainer");
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    applyZoom(delta);
  }, { passive: false });

  // Double-click to toggle zoom
  container.addEventListener("dblclick", () => {
    if (scale > 1) { resetZoom(); } else { scale = 2.5; applyTransform(); }
  });

  // Pan (mouse drag)
  container.addEventListener("mousedown", (e) => {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastTx = translateX;
    lastTy = translateY;
    container.classList.add("grabbing");
    e.preventDefault();
  });

  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);

  // Touch: pinch zoom + pan
  let lastTouchDist = 0;
  let lastTouchCenter = null;

  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e.touches);
      lastTouchCenter = getTouchCenter(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      lastTx = translateX;
      lastTy = translateY;
    }
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const delta = (dist - lastTouchDist) * 0.005;
      lastTouchDist = dist;
      applyZoom(delta);
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      translateX = lastTx + (e.touches[0].clientX - dragStartX);
      translateY = lastTy + (e.touches[0].clientY - dragStartY);
      applyTransform();
    }
  }, { passive: false });

  container.addEventListener("touchend", () => { isDragging = false; });
}

function handleDrag(e) {
  if (!isDragging) return;
  translateX = lastTx + (e.clientX - dragStartX);
  translateY = lastTy + (e.clientY - dragStartY);
  applyTransform();
}

function stopDrag() {
  isDragging = false;
  const container = document.getElementById("artContainer");
  if (container) container.classList.remove("grabbing");
}

function applyZoom(delta) {
  scale = Math.min(5, Math.max(1, scale + delta));
  if (scale === 1) { translateX = 0; translateY = 0; }
  applyTransform();
}

function applyTransform() {
  const img = document.getElementById("lbImage");
  if (img) img.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches) {
  return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
}

async function loadRandomCard() {
  const btn = document.getElementById("lbRandom");
  const img = document.getElementById("lbImage");
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.textContent = "↻";
  if (img) img.style.opacity = "0.5";
  const card = await fetchRandomCard();
  if (card) {
    openLightbox(card);
  } else {
    if (img) img.style.opacity = "1";
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me`; }
  }
}

function handleLbKey(e) {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "r" || e.key === "R") loadRandomCard();
  if (e.key === "ArrowRight") document.getElementById("lbNext")?.click();
  if (e.key === "ArrowLeft")  document.getElementById("lbPrev")?.click();
}

function closeLightbox() {
  document.getElementById("lightbox").innerHTML = "";
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleLbKey);
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  isDragging = false;
}