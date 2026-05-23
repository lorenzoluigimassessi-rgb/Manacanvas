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

  const showFte = false; const fteHtml = '';

  // Ghost arrows — overlaid on art-container, mobile only
  const ghostPrevHidden = (!isSurprise && filteredCards.findIndex(c => c.id === card.id) <= 0) ? 'hidden' : '';
  const ghostNextHidden = (!isSurprise && filteredCards.findIndex(c => c.id === card.id) >= filteredCards.length - 1) ? 'hidden' : '';
  const ghostArrowsHtml = `
    <div class="lb-ghost-arrows" id="lbGhostArrows">
      <button class="lb-ghost-arrow lb-ghost-prev ${isSurprise ? 'hidden' : ghostPrevHidden}" id="lbGhostPrev">‹</button>
      <button class="lb-ghost-arrow lb-ghost-next ${ghostNextHidden}" id="lbGhostNext">›</button>
    </div>
  `;

  const lightbox = document.getElementById("lightbox");
  lightbox.style.background = '#0c0c0f';
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" style="background:#0c0c0f;">
      ${blurBgHtml}
      <button class="close-btn" id="lbClose">✕</button>
      ${arrowsHtml}
      <div class="art-container" id="artContainer">
        <img id="lbImage" src="${artCrop || normal}" alt="${card.name}">
        ${ghostArrowsHtml}
      </div>
      ${actionsHtml}
      <div class="meta">
        <div class="name">${card.name}</div>
        <div class="details">
          <span class="meta-link" id="lbArtist">${card.artist || "Unknown"}</span>
          ${setName ? ` · <span class="meta-link" id="lbSet">${setName}</span>` : ""}
          ${year    ? ` · <span class="meta-link" id="lbYear">${year}</span>`    : ""}
        </div>
      </div>
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
    if (_lbMode === 'surprise') {
      if (!window._surpriseQueue) window._surpriseQueue = [];
      const next = window._surpriseQueue.shift();
      if (next) transitionTo(next, 'next', 'surprise');
      else fetchRandomCard().then(c => { if (c) transitionTo(c, 'next', 'surprise'); });
    } else {
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      if (idx < filteredCards.length - 1) transitionTo(filteredCards[idx + 1], 'next', 'feed');
    }
  }

  function goPrev() {
    if (_lbMode === 'surprise') {
      closeLightbox();
      showWelcome();
    } else {
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      if (idx > 0) transitionTo(filteredCards[idx - 1], 'prev', 'feed');
    }
  }

  // ── Crossfade transition — only art + blur bg change, chrome stays put ─────
  function transitionTo(nextCard, dir, nextMode) {
    const img   = document.getElementById('lbImage');
    const bg    = document.getElementById('lbBlurBg');
    const meta  = document.getElementById('lbMobileMeta');
    if (!img || !bg) { openLightbox(nextCard, nextMode); return; }

    const nextArt = nextCard.image_uris?.art_crop || nextCard.card_faces?.[0]?.image_uris?.art_crop
                 || nextCard.image_uris?.normal   || nextCard.card_faces?.[0]?.image_uris?.normal;

    // Fade out
    img.style.transition = bg.style.transition = 'opacity 180ms ease';
    img.style.opacity = bg.style.opacity = '0';

    setTimeout(() => {
      // Swap content
      img.src = nextArt;
      bg.style.backgroundImage = `url('${nextArt}')`;
      if (meta) meta.textContent = `${nextCard.name} · ${nextCard.artist || 'Unknown'}`;
      currentCard = nextCard;
      _lbMode = nextMode;

      // Update arrow visibility
      const mPrev = document.getElementById('lbMobilePrev');
      const mNext = document.getElementById('lbMobileNext');
      if (mPrev && mNext) {
        if (nextMode === 'surprise') {
          mPrev.style.opacity = '0.25'; mPrev.style.pointerEvents = 'none';
          mNext.style.opacity = '1';    mNext.style.pointerEvents = 'auto';
        } else {
          const idx = filteredCards.findIndex(c => c.id === nextCard.id);
          mPrev.style.opacity = idx <= 0 ? '0.25' : '1';
          mPrev.style.pointerEvents = idx <= 0 ? 'none' : 'auto';
          mNext.style.opacity = idx >= filteredCards.length - 1 ? '0.25' : '1';
          mNext.style.pointerEvents = idx >= filteredCards.length - 1 ? 'none' : 'auto';
        }
      }

      // Fade in
      img.style.transition = bg.style.transition = 'opacity 220ms ease';
      img.style.opacity = bg.style.opacity = '1';

      // Update ghost arrow visibility
      const gP = document.getElementById('lbGhostPrev');
      const gN = document.getElementById('lbGhostNext');
      if (gP && gN) {
        if (nextMode === 'surprise') {
          gP.classList.add('hidden');
          gN.classList.remove('hidden');
        } else {
          const idx = filteredCards.findIndex(c => c.id === nextCard.id);
          idx <= 0 ? gP.classList.add('hidden') : gP.classList.remove('hidden');
          idx >= filteredCards.length - 1 ? gN.classList.add('hidden') : gN.classList.remove('hidden');
        }
      }
      showGhostArrows();

      // Re-warm surprise queue
      if (nextMode === 'surprise') {
        if (!window._surpriseQueue) window._surpriseQueue = [];
        if (window._surpriseQueue.length < 2)
          Promise.all([fetchRandomCard(), fetchRandomCard()])
            .then(cards => window._surpriseQueue.push(...cards.filter(Boolean)));
      }
    }, 180);
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

  // Ghost arrows — fade out after 2s, tap anywhere to bring back
  let ghostTimer = null;
  function showGhostArrows() {
    const g = document.getElementById('lbGhostArrows');
    if (!g) return;
    g.style.opacity = '1';
    clearTimeout(ghostTimer);
    ghostTimer = setTimeout(() => { if (g) g.style.opacity = '0'; }, 1500);
  }
  showGhostArrows();
  document.getElementById('lightboxOverlay').addEventListener('touchstart', showGhostArrows, { passive: true });

  const gPrev = document.getElementById('lbGhostPrev');
  const gNext = document.getElementById('lbGhostNext');
  if (gPrev) gPrev.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
  if (gNext) gNext.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });

  // ── Swipe on art zone ───────────────────────────────────────────────────
  const swipeZone = document.getElementById('lightboxOverlay');
  let swX = 0, swY = 0, scX = 0, swiping = false, swDir = null;

  function getSwipeCard(goingNext) {
    if (goingNext) {
      if (_lbMode === 'surprise') return (window._surpriseQueue || [])[0] || null;
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      return idx < filteredCards.length - 1 ? filteredCards[idx + 1] : null;
    } else {
      if (_lbMode === 'surprise') return null;
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      return idx > 0 ? filteredCards[idx - 1] : null;
    }
  }

  swipeZone.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, a, .toggle, .meta-link, .lb-mobile-nav')) return;
    swX = e.touches[0].clientX; swY = e.touches[0].clientY;
    scX = swX; swiping = true; swDir = null;
  }, { passive: true });

  swipeZone.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - swX;
    const dy = e.touches[0].clientY - swY;
    scX = e.touches[0].clientX;
    if (!swDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
      swDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
  }, { passive: true });

  swipeZone.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const dx = scX - swX;
    if (swDir !== 'h' || Math.abs(dx) < window.innerWidth * 0.2) return;
    const goingNext = dx < 0;
    if (!goingNext && _lbMode === 'surprise') { closeLightbox(); showWelcome(); return; }
    const target = getSwipeCard(goingNext);
    if (!target) return;
    if (goingNext && _lbMode === 'surprise' && window._surpriseQueue) window._surpriseQueue.shift();
    transitionTo(target, goingNext ? 'next' : 'prev', _lbMode === 'surprise' ? 'surprise' : 'feed');
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
  document.getElementById("lightbox").innerHTML = "";
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleLbKey);
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  isDragging = false;
}
