// Lightbox — two modes: 'surprise' | 'feed'
let currentCard = null;
let currentMode = "art";
let scale = 1, translateX = 0, translateY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0, lastTx = 0, lastTy = 0;
let _lbMode = 'feed';
let _transitioning = false; // lock navigation during crossfade
window._surpriseHistory = window._surpriseHistory || [];

function getManaGradient(colors) {
  const G = { W:'linear-gradient(160deg,#2a2318,#3d3420,#1a1610)', U:'linear-gradient(160deg,#0a1628,#0d2240,#061018)', B:'linear-gradient(160deg,#0e0a18,#1a1030,#080610)', R:'linear-gradient(160deg,#1e0c08,#2e1408,#180a06)', G:'linear-gradient(160deg,#081a0c,#0e2810,#061208)', M:'linear-gradient(160deg,#1e1808,#2e2410,#181206)', C:'linear-gradient(160deg,#141420,#1e1e2e,#0e0e18)' };
  if (!colors || !colors.length) return G.C;
  if (colors.length > 1) return G.M;
  return G[colors[0]] || G.C;
}

function openLightbox(card, mode = 'feed') {
  currentCard = card;
  currentMode = 'art';
  _lbMode = mode;
  scale = 1; translateX = 0; translateY = 0;

  const artCrop = card.image_uris?.art_crop  || card.card_faces?.[0]?.image_uris?.art_crop;
  const normal  = card.image_uris?.normal    || card.card_faces?.[0]?.image_uris?.normal;
  const hasArtCrop = !!artCrop;
  const setName = card.set_name || '';
  const year    = card.released_at ? card.released_at.slice(0, 4) : '';
  const disabledAttr  = !hasArtCrop ? 'style="opacity:0.4;cursor:not-allowed;"' : '';
  const disabledTitle = !hasArtCrop ? 'title="Art-only view unavailable for this card"' : '';
  const isSurprise = mode === 'surprise';

  // Arrow visibility state
  const noHistory  = isSurprise && window._surpriseHistory.length === 0;
  // For feed: only hide prev if genuinely at index 0; -1 (not found) means don't hide
  const feedIdx    = !isSurprise ? filteredCards.findIndex(c => c.id === card.id) : -1;
  const hidePrev   = noHistory || (!isSurprise && feedIdx === 0);
  const hideNext   = !isSurprise && feedIdx !== -1 && feedIdx >= filteredCards.length - 1;
  // disabled = at edge but still visible; hidden = surprise prev with no history
  const disabledPrev = !isSurprise && feedIdx === 0;
  const disabledNext = !isSurprise && feedIdx !== -1 && feedIdx >= filteredCards.length - 1;

  const IMG_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;

  // Swipe hint — mobile only, once per session per mode
  const hintKey = isSurprise ? 'lb_swipe_hint_shown' : 'lb_feed_hint_shown';
  const showSwipeHint = !sessionStorage.getItem(hintKey);
  const swipeHintCopy = isSurprise
    ? `<svg width="28" height="14" viewBox="0 0 28 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5h26M5 1L1 5l4 4M23 1l4 4-4 4"/></svg>
       <span>Swipe to discover</span>`
    : `<svg width="28" height="14" viewBox="0 0 28 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5h26M5 1L1 5l4 4M23 1l4 4-4 4"/></svg>
       <span>Swipe left or right to browse</span>`;

  localStorage.setItem('mc_lightbox', JSON.stringify({ id: card.id, mode }));

  const lightbox = document.getElementById('lightbox');
  lightbox.style.background = '#0c0c0f';
  lightbox.innerHTML = `
    <div class="lightbox" id="lightboxOverlay" style="background:#0c0c0f;">
      <div class="lb-blur-bg" id="lbBlurBg" style="background-image:url('${artCrop || normal}')"></div>
      <button class="close-btn" id="lbClose">✕</button>

      <!-- Art -->
      <div class="art-container" id="artContainer" style="overflow:hidden;">
        <img id="lbImage" src="${artCrop || normal}" alt="${card.name}">
        <!-- Desktop ghost arrows — feed only -->
        ${!isSurprise ? `
        <div class="lb-ghost-arrows" id="lbGhostArrows">
          <button class="lb-ghost-arrow lb-ghost-prev ${noHistory ? 'hidden' : disabledPrev ? 'lb-arrow-disabled' : ''}" id="lbGhostPrev">‹</button>
          <button class="lb-ghost-arrow lb-ghost-next ${disabledNext ? 'lb-arrow-disabled' : ''}" id="lbGhostNext">›</button>
        </div>` : ''}
      </div>
      <!-- Swipe hint pill — outside art-container so overflow:hidden doesn't clip it -->
      ${showSwipeHint ? '' : ''}

      <!-- Toggle -->
      <div class="lightbox-actions">
        <div class="toggle">
          <button id="toggleArt" class="active" ${disabledAttr} ${disabledTitle}>Art Only</button>
          <button id="toggleFrame">With Frame</button>
        </div>
      </div>

      <!-- Meta -->
      <div class="meta">
        <div class="name meta-link" id="lbName" title="See all versions">${card.name}</div>
        <div class="details">
          <span class="meta-link" id="lbArtist">${card.artist || 'Unknown'}</span>
          ${setName ? ` · <span class="meta-link" id="lbSet">${setName}</span>` : ''}
          ${year    ? ` · <span class="meta-link" id="lbYear">${year}</span>`    : ''}
        </div>
      </div>

      <div class="zoom-hint" id="zoomHint">Scroll to zoom · Drag to pan · ← → to browse</div>
    </div>
  `;

  // Mobile bottom nav — feed mode only (surprise uses the button below)
  let mobileNav = document.getElementById('lbMobileNav');
  if (mobileNav) mobileNav.remove();
  const existingBtn = document.getElementById('lbSurpriseMobileBtn');
  if (existingBtn) existingBtn.remove();

  if (!isSurprise) {
    mobileNav = document.createElement('div');
    mobileNav.id = 'lbMobileNav';
    mobileNav.className = 'lb-mobile-nav';
    mobileNav.innerHTML = `
      <button class="lb-mobile-nav-arrow ${noHistory ? 'invisible' : disabledPrev ? 'lb-arrow-disabled' : ''}" id="lbMobileNavPrev">‹</button>
      <button class="lb-mobile-nav-arrow ${disabledNext ? 'lb-arrow-disabled' : ''}" id="lbMobileNavNext">›</button>
    `;
    document.body.appendChild(mobileNav);
  } else {
    // Surprise mode — append button to body so fixed positioning works on all screens
    const mBtn = document.createElement('button');
    mBtn.id = 'lbSurpriseMobileBtn';
    mBtn.className = 'lb-surprise-next-btn';
    mBtn.innerHTML = `${IMG_SVG} Random art`;
    document.body.appendChild(mBtn);
    mBtn.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
  }

  // Swipe hint overlay — appended to body so lightbox overflow:hidden doesn't clip it
  const existingHint = document.getElementById('lbSwipeHint');
  if (existingHint) existingHint.remove();
  if (showSwipeHint) {
    const hintEl = document.createElement('div');
    hintEl.id = 'lbSwipeHint';
    hintEl.className = 'lb-swipe-hint-overlay';
    hintEl.innerHTML = swipeHintCopy;
    document.body.appendChild(hintEl);
  }

  // Desktop side arrows — feed only, appended to body so overflow:hidden doesn't clip them
  ['lbPrev','lbNext'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  if (!isSurprise) {
    const prev = document.createElement('button');
    prev.id = 'lbPrev';
    prev.className = `lb-nav-arrow${noHistory ? ' hidden' : disabledPrev ? ' lb-arrow-disabled' : ''}`;
    prev.textContent = '‹';
    document.body.appendChild(prev);
    const next = document.createElement('button');
    next.id = 'lbNext';
    next.className = `lb-nav-arrow${disabledNext ? ' lb-arrow-disabled' : ''}`;
    next.textContent = '›';
    document.body.appendChild(next);
  }

  document.body.style.overflow = 'hidden';
  setTimeout(() => { const h = document.getElementById('zoomHint'); if (h) h.style.opacity = '0'; }, 3000);

  // ── Close ──────────────────────────────────────────────────────────────────
  function handleClose() {
    closeLightbox();
    if (_lbMode === 'surprise') showWelcome();
  }
  document.getElementById('lbClose').addEventListener('click', handleClose);
  // Click-outside only on desktop — on mobile too easy to misfire near arrows
  if (!('ontouchstart' in window)) {
    document.getElementById('lightboxOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'lightboxOverlay') handleClose();
    });
  }
  document.addEventListener('keydown', handleLbKey);

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goNext() {
    if (_transitioning) return;
    if (_lbMode === 'surprise') {
      if (!window._surpriseQueue) window._surpriseQueue = [];
      const next = window._surpriseQueue.shift();
      // Staggered re-warm — avoid hammering API
      if (window._surpriseQueue.length < 2) {
        fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); });
        setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 800);
      }
      window._surpriseHistory.push(currentCard);
      if (next) {
        transitionTo(next, 'next', 'surprise');
      } else {
        fetchRandomCard().then(c => { if (c) transitionTo(c, 'next', 'surprise'); });
      }
    } else {
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      if (idx < filteredCards.length - 1) transitionTo(filteredCards[idx + 1], 'next', 'feed');
    }
  }

  function goPrev() {
    if (_transitioning) return;
    if (_lbMode === 'surprise') {
      const prev = window._surpriseHistory.pop();
      if (prev) {
        window._surpriseQueue.unshift(currentCard);
        transitionTo(prev, 'prev', 'surprise');
      } else {
        closeLightbox();
        showWelcome();
      }
    } else {
      const idx = filteredCards.findIndex(c => c.id === currentCard.id);
      if (idx > 0) transitionTo(filteredCards[idx - 1], 'prev', 'feed');
    }
  }

  // ── Crossfade ──────────────────────────────────────────────────────────────
  function transitionTo(nextCard, dir, nextMode) {
    const img = document.getElementById('lbImage');
    const bg  = document.getElementById('lbBlurBg');
    if (!img || !bg) { openLightbox(nextCard, nextMode); return; }
    _transitioning = true;

    const nArtCrop = nextCard.image_uris?.art_crop || nextCard.card_faces?.[0]?.image_uris?.art_crop;
    const nNormal  = nextCard.image_uris?.normal   || nextCard.card_faces?.[0]?.image_uris?.normal;
    const nSrc = currentMode === 'frame' ? (nNormal || nArtCrop) : (nArtCrop || nNormal);

    img.style.transition = bg.style.transition = 'opacity 180ms ease';
    img.style.opacity = bg.style.opacity = '0';

    setTimeout(() => {
      img.src = nSrc;
      if (currentMode === 'frame') img.classList.add('frame-mode');
      else img.classList.remove('frame-mode');
      bg.style.backgroundImage = `url('${nArtCrop || nNormal}')`;

      const nameEl   = document.getElementById('lbName');
      const artistEl = document.getElementById('lbArtist');
      const setEl    = document.getElementById('lbSet');
      const yearEl   = document.getElementById('lbYear');
      if (nameEl)   nameEl.textContent   = nextCard.name;
      if (artistEl) artistEl.textContent = nextCard.artist || 'Unknown';
      if (setEl)    setEl.textContent    = nextCard.set_name || '';
      if (yearEl)   yearEl.textContent   = nextCard.released_at ? nextCard.released_at.slice(0,4) : '';

      currentCard = nextCard;
      _lbMode = nextMode;
      localStorage.setItem('mc_lightbox', JSON.stringify({ id: nextCard.id, mode: nextMode }));

      img.style.transition = bg.style.transition = 'opacity 220ms ease';
      img.style.opacity = bg.style.opacity = '1';
      _transitioning = false;

      // Sync all arrow visibility
      const hasHistory = window._surpriseHistory.length > 0;
      const nFeedIdx   = nextMode !== 'surprise' ? filteredCards.findIndex(c => c.id === nextCard.id) : -1;
      const nHidePrev  = nextMode === 'surprise' && !hasHistory;
      const nDisPrev   = nextMode !== 'surprise' && nFeedIdx === 0;
      const nDisNext   = nextMode !== 'surprise' && nFeedIdx !== -1 && nFeedIdx >= filteredCards.length - 1;

      ['lbPrev','lbGhostPrev','lbMobileNavPrev'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('hidden', nHidePrev);
        el.classList.toggle('invisible', id === 'lbMobileNavPrev' && nHidePrev);
        el.classList.toggle('lb-arrow-disabled', nDisPrev);
      });
      ['lbNext','lbGhostNext','lbMobileNavNext'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('lb-arrow-disabled', nDisNext);
      });

      showGhostArrows();

      if (nextMode === 'surprise' && window._surpriseQueue.length < 2) {
        fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); });
        setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 800);
      }
    }, 180);
  }

  // ── Wire arrows ────────────────────────────────────────────────────────────
  document.getElementById('lbPrev')?.addEventListener('click', goPrev);
  document.getElementById('lbNext')?.addEventListener('click', goNext);
  document.getElementById('lbGhostPrev')?.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
  document.getElementById('lbGhostNext')?.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
  document.getElementById('lbMobileNavPrev')?.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
  document.getElementById('lbMobileNavNext')?.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });

  // ── Pre-warm surprise queue ────────────────────────────────────────────────
  if (isSurprise) {
    if (!window._surpriseQueue) window._surpriseQueue = [];
    if (window._surpriseQueue.length < 2) {
      fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); });
      setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 800);
    }
  }

  // ── Ghost arrows (desktop fade) ────────────────────────────────────────────
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

  // ── Swipe hint ─────────────────────────────────────────────────────────────
  if (showSwipeHint) {
    sessionStorage.setItem(hintKey, '1');
    let hintDone = false;
    function dismissHint() {
      if (hintDone) return;
      hintDone = true;
      const h = document.getElementById('lbSwipeHint');
      if (h) { h.style.transition = 'opacity 300ms ease'; h.style.opacity = '0'; }
    }
    const hintTimer = setTimeout(dismissHint, 2500);
    document.getElementById('lightboxOverlay').addEventListener('touchmove', function onHintMove(e) {
      const dx = e.touches[0].clientX - swX;
      const dy = e.touches[0].clientY - swY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        clearTimeout(hintTimer);
        dismissHint();
        document.getElementById('lightboxOverlay').removeEventListener('touchmove', onHintMove);
      }
    }, { passive: true });
  }

  // ── Swipe ──────────────────────────────────────────────────────────────────
  let swX = 0, swY = 0, scX = 0, swiping = false, swDir = null;

  document.getElementById('lightboxOverlay').addEventListener('touchstart', (e) => {
    if (e.target.closest('button, a, .toggle, .meta-link')) return;
    swX = e.touches[0].clientX; swY = e.touches[0].clientY;
    scX = swX; swiping = true; swDir = null;
  }, { passive: true });

  document.getElementById('lightboxOverlay').addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - swX;
    const dy = e.touches[0].clientY - swY;
    scX = e.touches[0].clientX;
    if (!swDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
      swDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
  }, { passive: true });

  document.getElementById('lightboxOverlay').addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const dx = scX - swX;
    if (swDir !== 'h' || Math.abs(dx) < window.innerWidth * 0.2) return;
    if (dx < 0) goNext();
    else goPrev();
  });

  // ── Frame toggle ───────────────────────────────────────────────────────────
  const img = document.getElementById('lbImage');
  document.getElementById('toggleArt').addEventListener('click', () => {
    if (!hasArtCrop) return;
    currentMode = 'art'; img.src = artCrop;
    img.classList.remove('frame-mode');
    document.getElementById('toggleArt').classList.add('active');
    document.getElementById('toggleFrame').classList.remove('active');
    resetZoom();
  });
  document.getElementById('toggleFrame').addEventListener('click', () => {
    currentMode = 'frame'; img.src = normal;
    img.classList.add('frame-mode');
    document.getElementById('toggleFrame').classList.add('active');
    document.getElementById('toggleArt').classList.remove('active');
    resetZoom();
  });

  // ── Meta links ─────────────────────────────────────────────────────────────
  document.getElementById('lbName').addEventListener('click', () => {
    closeLightbox(); activeSearch = currentCard.name;
    const sb = document.getElementById('searchBar'); if (sb) sb.value = currentCard.name;
    const sc = document.getElementById('searchClear'); if (sc) sc.style.display = 'block';
    updateChips(); loadInitialGrid();
  });
  document.getElementById('lbArtist').addEventListener('click', () => {
    closeLightbox(); activeArtist = [currentCard.artist];
    if (!isMobile()) { const btn = document.getElementById('artistBtn'); if (btn) { btn.textContent = currentCard.artist + ' ▾'; btn.classList.add('active'); } }
    updateChips(); loadInitialGrid();
  });
  document.getElementById('lbSet')?.addEventListener('click', () => {
    closeLightbox(); activeSets = [currentCard.set];
    if (!isMobile()) { const s = setList.find(s => s.code === currentCard.set); const btn = document.getElementById('setBtn'); if (btn) { btn.textContent = (s ? s.name : currentCard.set_name) + ' ▾'; btn.classList.add('active'); } }
    updateChips(); loadInitialGrid();
  });
  document.getElementById('lbYear')?.addEventListener('click', () => {
    const y = currentCard.released_at?.slice(0,4); if (!y) return;
    closeLightbox(); activeYearMin = parseInt(y); activeYearMax = parseInt(y);
    if (!isMobile()) { const btn = document.getElementById('yearBtn'); if (btn) { btn.textContent = `${y}–${y}`; btn.classList.add('active'); } }
    updateChips(); loadInitialGrid();
  });

  // ── Zoom (desktop only) ────────────────────────────────────────────────────
  const isTouchDevice = 'ontouchstart' in window;
  const container = document.getElementById('artContainer');
  if (!isTouchDevice) {
    container.addEventListener('wheel', (e) => { e.preventDefault(); applyZoom(e.deltaY > 0 ? -0.15 : 0.15); }, { passive: false });
    container.addEventListener('dblclick', () => { if (scale > 1) resetZoom(); else { scale = 2.5; applyTransform(); } });
    container.addEventListener('mousedown', (e) => {
      if (scale <= 1) return;
      isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY;
      lastTx = translateX; lastTy = translateY;
      container.classList.add('grabbing'); e.preventDefault();
    });
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
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
  const c = document.getElementById('artContainer');
  if (c) c.classList.remove('grabbing');
}

function applyZoom(delta) {
  scale = Math.min(5, Math.max(1, scale + delta));
  if (scale === 1) { translateX = 0; translateY = 0; }
  applyTransform();
}

function applyTransform() {
  const c = document.getElementById('artContainer');
  if (c) c.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
}

function resetZoom() {
  scale = 1; translateX = 0; translateY = 0;
  const c = document.getElementById('artContainer');
  if (c) c.style.transform = '';
}

function flashArrow(id) {
  const btn = document.getElementById(id);
  if (!btn || btn.classList.contains('hidden')) return;
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 150);
}

function handleLbKey(e) {
  if (e.key === 'Escape') { closeLightbox(); if (_lbMode === 'surprise') showWelcome(); }
  if (e.key === 'ArrowRight') { flashArrow('lbNext'); document.getElementById('lbNext')?.click(); }
  if (e.key === 'ArrowLeft')  { flashArrow('lbPrev'); document.getElementById('lbPrev')?.click(); }
}

function closeLightbox() {
  localStorage.removeItem('mc_lightbox');
  document.getElementById('lightbox').innerHTML = '';
  const nav = document.getElementById('lbMobileNav');
  if (nav) nav.remove();
  const mBtn = document.getElementById('lbSurpriseMobileBtn');
  if (mBtn) mBtn.remove();
  const hint = document.getElementById('lbSwipeHint');
  if (hint) hint.remove();
  ['lbPrev','lbNext'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleLbKey);
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  isDragging = false;
}
