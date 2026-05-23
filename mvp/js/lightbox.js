// Lightbox — two modes: 'surprise' | 'feed'
let currentCard = null;
let currentMode = "art";
let scale = 1, translateX = 0, translateY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0, lastTx = 0, lastTy = 0;
let _lbMode = 'feed'; // track mode for close behaviour

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

function openLightbox(card, mode = 'feed') {
  currentCard = card;
  currentMode = "art";
  _lbMode = mode;
  scale = 1; translateX = 0; translateY = 0;

  const artCrop  = card.image_uris?.art_crop  || card.card_faces?.[0]?.image_uris?.art_crop;
  const normal   = card.image_uris?.normal    || card.card_faces?.[0]?.image_uris?.normal;
  const hasArtCrop = !!artCrop;
  const setName  = card.set_name || "";
  const year     = card.released_at ? card.released_at.slice(0, 4) : "";
  const disabledAttr  = !hasArtCrop ? 'style="opacity:0.4;cursor:not-allowed;"' : '';
  const disabledTitle = !hasArtCrop ? 'title="Art-only view unavailable for this card"' : '';
  const isSurprise = mode === 'surprise';

  const blurBgHtml = `<div class="lb-blur-bg" id="lbBlurBg" style="background-image:url('${artCrop || normal}')"></div>`;

  // Desktop arrows — feed mode only
  const arrowsHtml = !isSurprise ? `
    <button class="lb-nav-arrow" id="lbPrev">‹</button>
    <button class="lb-nav-arrow" id="lbNext">›</button>
  ` : '';

  const actionsHtml = `
    <div class="lightbox-actions">
      <div class="toggle">
        <button id="toggleArt" class="active" ${disabledAttr} ${disabledTitle}>Art Only</button>
        <button id="toggleFrame">With Frame</button>
      </div>
    </div>
  `;

  // FTE — first open only, plain icon+text at bottom corners
  const showFte = !sessionStorage.getItem('lb_fte_shown');
  const fteHtml = showFte ? `
    <div class="lb-fte-overlay" id="lbFteOverlay">
      <div class="fte-half fte-left">
        <span class="lb-fte-icon">‹</span>
        <span class="lb-fte-label">Previous</span>
      </div>
      <div class="fte-half fte-right">
        <span class="lb-fte-label">Next</span>
        <span class="lb-fte-icon">›</span>
      </div>
    </div>
  ` : '';

  const lightbox = document.getElementById("lightbox");
  lightbox.style.background = '#0c0c0f';
  lightbox.style.pointerEvents = 'auto';
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" style="background:#0c0c0f;">
      ${blurBgHtml}
      <button class="close-btn" id="lbClose">✕</button>
      ${arrowsHtml}
      <div class="art-container" id="artContainer">
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
      ${fteHtml}
      <div class="zoom-hint" id="zoomHint">Scroll to zoom · Drag to pan · ← → to browse</div>
    </div>
  `;

  document.body.style.overflow = "hidden";

  // FTE fade
  if (showFte) {
    sessionStorage.setItem('lb_fte_shown', '1');
    setTimeout(() => {
      const fte = document.getElementById("lbFteOverlay");
      if (fte) { fte.style.opacity = '0'; fte.style.transition = 'opacity 400ms ease'; }
    }, 2500);
  }

  setTimeout(() => { const h = document.getElementById("zoomHint"); if (h) h.style.opacity = "0"; }, 3000);

  // Close — surprise mode returns to welcome, feed mode stays on feed
  function handleClose() {
    closeLightbox();
    if (isSurprise) showWelcome();
  }

  document.getElementById("lbClose").addEventListener("click", handleClose);
  document.getElementById("lightboxOverlay").addEventListener("click", (e) => {
    if (e.target.id === "lightboxOverlay") handleClose();
  });
  document.addEventListener("keydown", handleLbKey);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goNext() {
    if (isSurprise) {
      if (!window._surpriseQueue) window._surpriseQueue = [];
      const next = window._surpriseQueue.shift();
      if (next) transitionTo(next, 'next', 'surprise');
      else fetchRandomCard().then(c => { if (c) transitionTo(c, 'next', 'surprise'); });
    } else {
      const idx = filteredCards.findIndex(c => c.id === card.id);
      if (idx < filteredCards.length - 1) transitionTo(filteredCards[idx + 1], 'next', 'feed');
    }
  }

  function goPrev() {
    if (isSurprise) {
      closeLightbox();
      showWelcome();
    } else {
      const idx = filteredCards.findIndex(c => c.id === card.id);
      if (idx > 0) transitionTo(filteredCards[idx - 1], 'prev', 'feed');
    }
  }

  // ── Whole-lightbox slide transition ────────────────────────────────────────
  function transitionTo(nextCard, dir, nextMode) {
    const overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;
    const exitX = dir === 'next' ? '-110%' : '110%';
    const enterX = dir === 'next' ? '110%' : '-110%';
    overlay.style.transition = 'transform 240ms ease-in';
    overlay.style.transform  = `translateX(${exitX})`;
    setTimeout(() => {
      openLightbox(nextCard, nextMode);
      const newOverlay = document.getElementById("lightboxOverlay");
      if (!newOverlay) return;
      newOverlay.style.transition = 'none';
      newOverlay.style.transform  = `translateX(${enterX})`;
      // force reflow then slide in
      newOverlay.getBoundingClientRect();
      newOverlay.style.transition = 'transform 240ms ease-out';
      newOverlay.style.transform  = '';
    }, 240);
  }

  // ── Desktop arrows ──────────────────────────────────────────────────────────
  if (!isSurprise) {
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");
    const currentIndex = filteredCards.findIndex(c => c.id === card.id);
    if (currentIndex <= 0) lbPrev.classList.add('hidden');
    if (currentIndex === -1 || currentIndex >= filteredCards.length - 1) lbNext.classList.add('hidden');
    lbPrev.addEventListener('click', goPrev);
    lbNext.addEventListener('click', goNext);
  }

  // Pre-warm surprise queue
  if (isSurprise) {
    if (!window._surpriseQueue) window._surpriseQueue = [];
    if (window._surpriseQueue.length < 2) {
      Promise.all([fetchRandomCard(), fetchRandomCard()])
        .then(cards => { window._surpriseQueue.push(...cards.filter(Boolean)); });
    }
  }

  // ── Mobile swipe — clean slide, dark background ────────────────────────────
  const swipeTarget = document.getElementById('lightboxOverlay');
  let swX = 0, swY = 0, scX = 0, swiping = false, swDir = null;

  function getNextCard(goingNext) {
    if (goingNext) {
      if (isSurprise) return (window._surpriseQueue || [])[0] || null;
      const idx = filteredCards.findIndex(c => c.id === card.id);
      return idx < filteredCards.length - 1 ? filteredCards[idx + 1] : null;
    } else {
      if (isSurprise) return null;
      const idx = filteredCards.findIndex(c => c.id === card.id);
      return idx > 0 ? filteredCards[idx - 1] : null;
    }
  }

  swipeTarget.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, a, .toggle, .meta-link')) return;
    swX = e.touches[0].clientX; swY = e.touches[0].clientY;
    scX = swX; swiping = true; swDir = null;
    swipeTarget.style.transition = 'none';
  }, { passive: true });

  swipeTarget.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - swX;
    const dy = e.touches[0].clientY - swY;
    scX = e.touches[0].clientX;
    if (!swDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
      swDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    if (swDir !== 'h') return;
    swipeTarget.style.transform = 'translateX(' + dx + 'px)';
  }, { passive: true });

  swipeTarget.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const dx = scX - swX;
    const threshold = window.innerWidth * 0.25;

    if (swDir === 'h' && Math.abs(dx) >= threshold) {
      const goingNext = dx < 0;
      const exitX = goingNext ? '-110%' : '110%';
      const enterX = goingNext ? '110%' : '-110%';

      // Surprise swipe-right = back to welcome
      if (!goingNext && isSurprise) {
        swipeTarget.style.transition = 'transform 220ms ease-in';
        swipeTarget.style.transform  = 'translateX(110%)';
        setTimeout(() => { closeLightbox(); showWelcome(); }, 220);
        return;
      }

      const targetCard = getNextCard(goingNext);
      if (!targetCard) {
        // edge — snap back
        swipeTarget.style.transition = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';
        swipeTarget.style.transform  = '';
        return;
      }

      swipeTarget.style.transition = 'transform 220ms ease-in';
      swipeTarget.style.transform  = 'translateX(' + exitX + ')';

      setTimeout(() => {
        if (isSurprise && goingNext && window._surpriseQueue) window._surpriseQueue.shift();
        openLightbox(targetCard, isSurprise ? 'surprise' : 'feed');
        const newOverlay = document.getElementById('lightboxOverlay');
        if (!newOverlay) return;
        newOverlay.style.transition = 'none';
        newOverlay.style.transform  = 'translateX(' + enterX + ')';
        newOverlay.getBoundingClientRect();
        newOverlay.style.transition = 'transform 220ms ease-out';
        newOverlay.style.transform  = '';
      }, 220);
      return;
    }

    // Snap back
    swipeTarget.style.transition = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';
    swipeTarget.style.transform  = '';
    setTimeout(() => { swipeTarget.style.transition = ''; }, 300);
  });

  // ── Frame toggle ────────────────────────────────────────────────────────────
  const img = document.getElementById("lbImage");
  document.getElementById("toggleArt").addEventListener("click", () => {
    if (!hasArtCrop) return;
    currentMode = "art"; img.src = artCrop;
    img.classList.remove("frame-mode");
    document.getElementById("toggleArt").classList.add("active");
    document.getElementById("toggleFrame").classList.remove("active");
    resetZoom();
  });
  document.getElementById("toggleFrame").addEventListener("click", () => {
    currentMode = "frame"; img.src = normal;
    img.classList.add("frame-mode");
    document.getElementById("toggleFrame").classList.add("active");
    document.getElementById("toggleArt").classList.remove("active");
    resetZoom();
  });

  // ── Meta links ──────────────────────────────────────────────────────────────
  document.getElementById("lbArtist").addEventListener("click", () => {
    closeLightbox(); activeArtist = [card.artist];
    if (!isMobile()) { const btn = document.getElementById("artistBtn"); if (btn) { btn.textContent = card.artist + " ▾"; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });
  if (setName) document.getElementById("lbSet").addEventListener("click", () => {
    closeLightbox(); activeSets = [card.set];
    if (!isMobile()) { const s = setList.find(s => s.code === card.set); const btn = document.getElementById("setBtn"); if (btn) { btn.textContent = (s ? s.name : setName) + " ▾"; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });
  if (year) document.getElementById("lbYear").addEventListener("click", () => {
    closeLightbox(); activeYearMin = parseInt(year); activeYearMax = parseInt(year);
    if (!isMobile()) { const btn = document.getElementById("yearBtn"); if (btn) { btn.textContent = `${year}–${year}`; btn.classList.add("active"); } }
    updateChips(); loadInitialGrid();
  });

  // ── Zoom — desktop only ─────────────────────────────────────────────────────
  const isTouchDevice = 'ontouchstart' in window;
  const container = document.getElementById("artContainer");
  if (!isTouchDevice) {
    container.addEventListener("wheel", (e) => { e.preventDefault(); applyZoom(e.deltaY > 0 ? -0.15 : 0.15); }, { passive: false });
    container.addEventListener("dblclick", () => { if (scale > 1) resetZoom(); else { scale = 2.5; applyTransform(); } });
    container.addEventListener("mousedown", (e) => {
      if (scale <= 1) return;
      isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY;
      lastTx = translateX; lastTy = translateY;
      container.classList.add("grabbing"); e.preventDefault();
    });
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  }
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
  const container = document.getElementById("artContainer");
  if (container) container.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
}

function resetZoom() {
  scale = 1; translateX = 0; translateY = 0;
  const container = document.getElementById("artContainer");
  if (container) container.style.transform = '';
}

function flashArrow(id) {
  const btn = document.getElementById(id);
  if (!btn || btn.classList.contains('hidden')) return;
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 150);
}

function handleLbKey(e) {
  if (e.key === "Escape") {
    closeLightbox();
    if (_lbMode === 'surprise') showWelcome();
  }
  if (e.key === "ArrowRight") { flashArrow('lbNext'); document.getElementById("lbNext")?.click(); }
  if (e.key === "ArrowLeft")  { flashArrow('lbPrev'); document.getElementById("lbPrev")?.click(); }
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  lb.innerHTML = "";
  lb.style.pointerEvents = 'none';
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleLbKey);
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  isDragging = false;
}
