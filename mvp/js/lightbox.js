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

  // Both modes use blurred art background
  const bgStyle = `style="background:#0c0c0f;"`;
  const blurBgHtml = `<div class="lb-blur-bg" id="lbBlurBg" style="background-image:url('${artCrop || normal}')"></div>`;
  // Prev/next arrows — feed mode only, outside art-container
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

  const swipeHintHtml = !isSurprise
    ? `<div class="lb-swipe-hint" id="lbSwipeHint">↑ swipe up to close · ← → to browse</div>
       <div class="lb-fte" id="lbFte"><div class="lb-fte-arrow">↑</div><div class="lb-fte-text">Swipe up to close</div></div>`
    : '';

  const lightbox = document.getElementById("lightbox");
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" ${bgStyle}>
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
      ${swipeHintHtml || ''}
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
    const currentIndex = filteredCards.findIndex(c => c.id === card.id);

    if (currentIndex <= 0) lbPrev.classList.add('hidden');
    if (currentIndex === -1 || currentIndex >= filteredCards.length - 1) lbNext.classList.add('hidden');

    lbPrev.addEventListener('click', () => {
      if (currentIndex > 0) openLightbox(filteredCards[currentIndex - 1], 'feed');
    });
    lbNext.addEventListener('click', () => {
      if (currentIndex < filteredCards.length - 1) openLightbox(filteredCards[currentIndex + 1], 'feed');
    });

    // Mobile swipe — left/right = prev/next, up = close
    let swipeStartX = 0, swipeStartY = 0, swipeCurX = 0, swipeCurY = 0;
    let swiping = false, swipeDir = null;
    const artContainer = document.getElementById("artContainer");

    // FTE hint — show arrows + 'swipe up to close' on first open
    const isFirstOpen = !sessionStorage.getItem('lb_swipe_hinted');
    if (isFirstOpen) {
      sessionStorage.setItem('lb_swipe_hinted', '1');
      // Nudge up slightly to hint swipe-up
      setTimeout(() => {
        artContainer.style.transition = 'transform 300ms ease-out';
        artContainer.style.transform  = 'translateY(-14px)';
        setTimeout(() => {
          artContainer.style.transition = 'transform 400ms cubic-bezier(0.34,1.56,0.64,1)';
          artContainer.style.transform  = '';
          setTimeout(() => { artContainer.style.transition = ''; }, 400);
        }, 320);
      }, 700);
    }

    artContainer.addEventListener('touchstart', (e) => {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      swipeCurX   = swipeStartX;
      swipeCurY   = swipeStartY;
      swiping     = true;
      swipeDir    = null;
      artContainer.style.transition = 'none';
    }, { passive: true });

    artContainer.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - swipeStartX;
      const dy = e.touches[0].clientY - swipeStartY;
      swipeCurX = e.touches[0].clientX;
      swipeCurY = e.touches[0].clientY;
      if (!swipeDir) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8)
          swipeDir = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h';
        return;
      }
      if (swipeDir === 'v' && dy < 0) {
        // Swipe up — drag card up with opacity fade
        artContainer.style.transform = `translateY(${dy}px)`;
        artContainer.style.opacity   = String(Math.max(0, 1 + dy / (window.innerHeight * 0.4)));
      } else if (swipeDir === 'h') {
        const tilt = (dx / window.innerWidth) * 3;
        artContainer.style.transform = `translateX(${dx}px) rotate(${tilt}deg)`;
        artContainer.style.opacity   = String(1 - Math.abs(dx) / (window.innerWidth * 1.5));
      }
    }, { passive: true });

    artContainer.addEventListener('touchend', () => {
      if (!swiping) return;
      swiping = false;
      const dx = swipeCurX - swipeStartX;
      const dy = swipeCurY - swipeStartY;

      if (swipeDir === 'v' && dy < 0 && Math.abs(dy) > window.innerHeight * 0.18) {
        // Commit swipe up — slide out upward then close
        artContainer.style.transition = 'transform 220ms ease-in, opacity 220ms ease-in';
        artContainer.style.transform  = 'translateY(-110%)';
        artContainer.style.opacity    = '0';
        setTimeout(() => closeLightbox(), 220);
        return;
      }

      if (swipeDir === 'h' && Math.abs(dx) >= window.innerWidth * 0.28) {
        const exitX = dx < 0 ? '-110%' : '110%';
        artContainer.style.transition = 'transform 220ms ease-in, opacity 220ms ease-in';
        artContainer.style.transform  = `translateX(${exitX})`;
        artContainer.style.opacity    = '0';
        setTimeout(() => {
          artContainer.style.transition = 'none';
          artContainer.style.transform  = '';
          artContainer.style.opacity    = '1';
          if (dx < 0 && currentIndex < filteredCards.length - 1)
            openLightbox(filteredCards[currentIndex + 1], 'feed');
          else if (dx > 0 && currentIndex > 0)
            openLightbox(filteredCards[currentIndex - 1], 'feed');
        }, 220);
        return;
      }

      // Snap back
      artContainer.style.transition = 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 280ms ease';
      artContainer.style.transform  = '';
      artContainer.style.opacity    = '1';
      setTimeout(() => { artContainer.style.transition = ''; }, 280);
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

  // Zoom — desktop only
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

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

async function loadRandomCard() {
  const btn = document.getElementById("lbRandom");
  const img = document.getElementById("lbImage");
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:lbSpin 0.8s linear infinite"><circle cx="12" cy="12" r="9" stroke-opacity="0.2"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>`;
  if (img) img.style.opacity = "0.5";
  const card = await fetchRandomCard();
  if (card) {
    openLightbox(card, 'surprise');
  } else {
    if (img) img.style.opacity = "1";
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none"/></svg> Surprise Me`; }
  }
}

function flashArrow(id) {
  const btn = document.getElementById(id);
  if (!btn || btn.classList.contains('hidden')) return;
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 150);
}

function handleLbKey(e) {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "s" || e.key === "S") { const btn = document.getElementById("lbRandom"); if (btn && !btn.disabled) loadRandomCard(); }
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
