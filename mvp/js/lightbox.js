// Lightbox — two modes: 'surprise' and 'feed'
let currentCard = null;
let currentMode = "art";
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTx = 0;
let lastTy = 0;

// Mana colour → gradient (for surprise mode)
const LB_GRADIENTS = {
  W: 'linear-gradient(160deg,#2a2318,#3d3420,#1a1610)',
  U: 'linear-gradient(160deg,#0a1628,#0d2240,#061018)',
  B: 'linear-gradient(160deg,#0e0a18,#1a1030,#080610)',
  R: 'linear-gradient(160deg,#1e0c08,#2e1408,#180a06)',
  G: 'linear-gradient(160deg,#081a0c,#0e2810,#061208)',
  M: 'linear-gradient(160deg,#1e1808,#2e2410,#181206)',
  C: 'linear-gradient(160deg,#141420,#1e1e2e,#0e0e18)',
};

function getManaGradient(colors) {
  if (!colors || !colors.length) return LB_GRADIENTS.C;
  if (colors.length > 1) return LB_GRADIENTS.M;
  return LB_GRADIENTS[colors[0]] || LB_GRADIENTS.C;
}

// mode: 'surprise' | 'feed'
function openLightbox(card, mode = 'feed') {
  currentCard = card;
  currentMode = "art";
  scale = 1; translateX = 0; translateY = 0;

  const artCrop   = card.image_uris?.art_crop  || card.card_faces?.[0]?.image_uris?.art_crop;
  const normal    = card.image_uris?.normal    || card.card_faces?.[0]?.image_uris?.normal;
  const hasArtCrop = !!artCrop;
  const setName   = card.set_name || "";
  const year      = card.released_at ? card.released_at.slice(0, 4) : "";
  const disabledAttr  = !hasArtCrop ? 'style="opacity:0.4;cursor:not-allowed;"' : '';
  const disabledTitle = !hasArtCrop ? 'title="Art-only view unavailable for this card"' : '';

  const isSurprise = mode === 'surprise';

  // Surprise mode: blurred art fills background
  const bgStyle = isSurprise
    ? `style="background:#0c0c0f;"`
    : `style="background:rgba(0,0,0,0.95);"`;

  const blurBgHtml = isSurprise
    ? `<div class="lb-blur-bg" id="lbBlurBg" style="background-image:url('${artCrop || normal}')"></div>`
    : '';
  // Prev/next arrows — feed mode only, inside art-container
  const arrowsHtml = !isSurprise ? `
    <button class="lb-nav-arrow" id="lbPrev">‹</button>
    <button class="lb-nav-arrow" id="lbNext">›</button>
  ` : '';

  // Actions row
  const actionsHtml = isSurprise ? `
    <div class="lightbox-actions">
      <div class="toggle">
        <button id="toggleArt" class="active" ${disabledAttr} ${disabledTitle}>Art Only</button>
        <button id="toggleFrame">With Frame</button>
      </div>
      <button class="random-btn-primary" id="lbRandom">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg>
        Surprise Me
      </button>
    </div>
  ` : `
    <div class="lightbox-actions">
      <div class="toggle">
        <button id="toggleArt" class="active" ${disabledAttr} ${disabledTitle}>Art Only</button>
        <button id="toggleFrame">With Frame</button>
      </div>
    </div>
  `;

  const hintText = isSurprise
    ? 'Scroll to zoom · Drag to pan · R for random'
    : 'Scroll to zoom · Drag to pan · ← → to browse';

  const lightbox = document.getElementById("lightbox");
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" ${bgStyle}>
      ${blurBgHtml}
      <button class="close-btn" id="lbClose">✕</button>
      <div class="art-container" id="artContainer">
        ${arrowsHtml}
        <img id="lbImage" src="${artCrop || normal}" alt="${card.name}">
      </div>
      <div class="meta">
        <div class="name">${card.name}</div>
        <div class="details">
          <span class="meta-link" id="lbArtist">${card.artist || "Unknown"}</span>
          ${setName ? ` · <span class="meta-link" id="lbSet">${setName}</span>` : ""}
          ${year    ? ` · <span class="meta-link" id="lbYear">${year}</span>`    : ""}
        </div>
      </div>
      ${actionsHtml}
      <div class="zoom-hint" id="zoomHint">${hintText}</div>
    </div>
  `;

  document.body.style.overflow = "hidden";
  setTimeout(() => { const h = document.getElementById("zoomHint"); if (h) h.style.opacity = "0"; }, 3000);

  // Close
  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay").addEventListener("click", (e) => {
    if (e.target.id === "lightboxOverlay") closeLightbox();
  });
  document.addEventListener("keydown", handleLbKey);

  // Prev/next — feed mode
  if (!isSurprise) {
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");
    const currentIndex = typeof filteredCards !== 'undefined' ? filteredCards.indexOf(card) : -1;
    if (currentIndex <= 0) lbPrev.classList.add('hidden');
    if (currentIndex === -1 || currentIndex >= (filteredCards?.length ?? 0) - 1) lbNext.classList.add('hidden');

    lbPrev.addEventListener('click', () => {
      if (currentIndex > 0) openLightbox(filteredCards[currentIndex - 1], 'feed');
    });
    lbNext.addEventListener('click', () => {
      if (currentIndex < filteredCards.length - 1) openLightbox(filteredCards[currentIndex + 1], 'feed');
    });

    // Mobile swipe for feed mode
    let swipeStartX = 0;
    const artContainer = document.getElementById("artContainer");
    artContainer.addEventListener('touchstart', (e) => { swipeStartX = e.touches[0].clientX; }, { passive: true });
    artContainer.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - swipeStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && currentIndex < filteredCards.length - 1) openLightbox(filteredCards[currentIndex + 1], 'feed');
      if (dx > 0 && currentIndex > 0) openLightbox(filteredCards[currentIndex - 1], 'feed');
    });
  }

  // Surprise Me button — surprise mode
  if (isSurprise) {
    document.getElementById("lbRandom").addEventListener("click", () => loadRandomCard());
  }

  // Frame toggle
  const img = document.getElementById("lbImage");
  document.getElementById("toggleArt").addEventListener("click", () => {
    if (!hasArtCrop) return;
    currentMode = "art"; img.src = artCrop;
    document.getElementById("toggleArt").classList.add("active");
    document.getElementById("toggleFrame").classList.remove("active");
    resetZoom();
  });
  document.getElementById("toggleFrame").addEventListener("click", () => {
    currentMode = "frame"; img.src = normal;
    document.getElementById("toggleFrame").classList.add("active");
    document.getElementById("toggleArt").classList.remove("active");
    resetZoom();
  });

  // Meta links
  document.getElementById("lbArtist").addEventListener("click", () => {
    closeLightbox();
    activeArtist = [card.artist];
    if (!isMobile()) { const btn = document.getElementById("artistBtn"); if (btn) { btn.textContent = card.artist + " ▾"; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });
  if (setName) document.getElementById("lbSet").addEventListener("click", () => {
    closeLightbox();
    activeSets = [card.set];
    if (!isMobile()) { const s = setList.find(s => s.code === card.set); const btn = document.getElementById("setBtn"); if (btn) { btn.textContent = (s ? s.name : setName) + " ▾"; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });
  if (year) document.getElementById("lbYear").addEventListener("click", () => {
    closeLightbox();
    activeYearMin = parseInt(year); activeYearMax = parseInt(year);
    if (!isMobile()) { const btn = document.getElementById("yearBtn"); if (btn) { btn.textContent = `${year}–${year}`; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });

  // Zoom
  const container = document.getElementById("artContainer");
  container.addEventListener("wheel", (e) => { e.preventDefault(); applyZoom(e.deltaY > 0 ? -0.15 : 0.15); }, { passive: false });
  container.addEventListener("dblclick", () => { if (scale > 1) resetZoom(); else { scale = 2.5; applyTransform(); } });

  // Pan
  container.addEventListener("mousedown", (e) => {
    if (scale <= 1) return;
    isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY;
    lastTx = translateX; lastTy = translateY;
    container.classList.add("grabbing"); e.preventDefault();
  });
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);

  // Touch zoom/pan
  let lastTouchDist = 0;
  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) { lastTouchDist = getTouchDist(e.touches); }
    else if (e.touches.length === 1 && scale > 1) {
      isDragging = true; dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      lastTx = translateX; lastTy = translateY;
    }
  }, { passive: true });
  container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) { e.preventDefault(); const dist = getTouchDist(e.touches); applyZoom((dist - lastTouchDist) * 0.005); lastTouchDist = dist; }
    else if (e.touches.length === 1 && isDragging) { e.preventDefault(); translateX = lastTx + (e.touches[0].clientX - dragStartX); translateY = lastTy + (e.touches[0].clientY - dragStartY); applyTransform(); }
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
  const c = document.getElementById("artContainer");
  if (c) c.classList.remove("grabbing");
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
  scale = 1; translateX = 0; translateY = 0; applyTransform();
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

async function loadRandomCard() {
  const btn = document.getElementById("lbRandom");
  const img = document.getElementById("lbImage");
  if (!btn || btn.disabled) return;
  btn.disabled = true; btn.textContent = "↻";
  if (img) img.style.opacity = "0.5";
  const card = await fetchRandomCard();
  if (card) {
    openLightbox(card, 'surprise');
  } else {
    if (img) img.style.opacity = "1";
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me`; }
  }
}

function handleLbKey(e) {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "r" || e.key === "R") { const btn = document.getElementById("lbRandom"); if (btn) loadRandomCard(); }
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
