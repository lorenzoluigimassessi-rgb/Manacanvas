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

const LB_EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const LB_EYE_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.9 3.9M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>';

// ── Card info: title, "N artworks of this card", and fact rows that each open a result ──
// Each fact is a small coloured label (same hues as the search chips) over a tappable value — quiet, so the art leads.
const _NOT_TYPES = ['Legendary', 'Basic', 'Snow', 'World', 'Ongoing', 'Host', 'Elite', 'Tribal', 'Kindred'];
const _illOf = c => c.illustration_id || c.card_faces?.[0]?.illustration_id || c.id;
const _esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let _artInfo = {};
try { _artInfo = JSON.parse(localStorage.getItem('mc_artinfo') || '{}'); } catch (e) {}

function _lbColour(card) {
  if (typeof COLOR_GROUPS === 'undefined') return null;
  const cols = (card.colors || card.card_faces?.[0]?.colors || []).map(c => c.toLowerCase());
  const want = cols.length ? [...cols].sort().join('') : 'c';
  for (const g of COLOR_GROUPS) for (const it of g.items) if ([...it.key].sort().join('') === want) return it;
  return null;
}

function cardFacts(card, info) {
  const face = card.card_faces?.[0] || card;
  const [main = '', sub = ''] = (face.type_line || card.type_line || '').split('—').map(x => x.trim());
  const rows = [];
  if (card.artist) rows.push({ kind: 'Artist', vals: [{ label: card.artist, q: `a:"${card.artist}"` }] });
  if (/\bCreature\b/.test(main) && sub) rows.push({ kind: 'Creature', vals: sub.split(/\s+/).map(t => ({ label: t, q: `t:"${t.toLowerCase()}"` })) });
  else {
    const types = main.split(/\s+/).filter(t => t && !_NOT_TYPES.includes(t));
    if (types.length) rows.push({ kind: 'Type', vals: types.map(t => ({ label: t, q: `t:${t.toLowerCase()}` })) });
  }
  const col = _lbColour(card);
  if (col) rows.push({ kind: 'Colour', icon: col.icon, vals: [{ label: col.name, q: col.q }] });
  // Where this artwork first appeared (once known), else the printing we're showing
  const set = info?.set || card.set, year = info?.year || card.released_at?.slice(0, 4);
  if (set) rows.push({ kind: 'Set', icon: `<img class="lb-set-icon" src="https://svgs.scryfall.io/sets/${set}.svg" alt="" onerror="this.remove()">`,
    vals: [{ label: info?.set_name || card.set_name || set.toUpperCase(), q: `s:${set}` }] });
  if (year) rows.push({ kind: 'Year', vals: [{ label: year, q: `year:${year}` }] });
  return rows;
}

function renderCardInfo(card) {
  const info = _artInfo[_illOf(card)];
  const title = document.getElementById('lbTitle');
  if (!title) return;
  title.textContent = card.name;
  const v = document.getElementById('lbVersions');
  v.hidden = !(info && info.n > 1);
  if (info && info.n > 1) v.innerHTML = `${info.n}${info.more ? '+' : ''} artworks of this card <span aria-hidden="true">→</span>`;
  const rows = cardFacts(card, info);
  const icon = r => r.icon ? `<span class="lb-fact-icon">${r.icon}</span>` : '';
  const box = document.getElementById('lbFacts');
  box.innerHTML = rows.map((r, i) => `
    <div class="lb-fact">
      <span class="lb-fact-label search-chip--${r.kind.toLowerCase()}">${r.kind}</span>
      <span class="lb-fact-vals">${r.vals.map((x, j) =>
        `<button class="lb-fact-link" data-r="${i}" data-v="${j}">${j ? '' : icon(r)}${_esc(x.label)}</button>`).join('')}</span>
    </div>`).join('');
  box.querySelectorAll('[data-r]').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const r = rows[el.dataset.r], x = r.vals[el.dataset.v];
    openTag(x.q, x.label, r.kind);
  }));
  if (!info) _loadArtInfo(card);
}

// One request per artwork (cached): every paper printing of the card, oldest first →
// how many distinct artworks it has, and the set + year this artwork first appeared in
let _artInfoTimer = null;
function _loadArtInfo(card) {
  clearTimeout(_artInfoTimer);
  _artInfoTimer = setTimeout(async () => {
    const key = _illOf(card);
    try {
      const q = `!"${card.name.replace(/"/g, '')}" game:paper`;
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=released&dir=asc`);
      if (!res.ok) return;
      const json = await res.json();
      const prints = json.data || [];
      const first = prints.find(p => _illOf(p) === key);
      _artInfo[key] = { n: new Set(prints.map(_illOf)).size, more: !!json.has_more,
        set: first?.set, set_name: first?.set_name, year: first?.released_at?.slice(0, 4) };
      const keys = Object.keys(_artInfo);
      if (keys.length > 500) keys.slice(0, keys.length - 500).forEach(k => delete _artInfo[k]);
      try { localStorage.setItem('mc_artinfo', JSON.stringify(_artInfo)); } catch (e) {}
      if (currentCard && _illOf(currentCard) === key) renderCardInfo(currentCard);
    } catch (e) {}
  }, 250); // swiping fast through cards only asks for the one you stop on
}

function openLightbox(card, mode = 'feed') {
  currentCard = card;
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
  currentMode = isSurprise ? 'frame' : 'art';
  const initialSrc = isSurprise ? (normal || artCrop) : (artCrop || normal);

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
       <span>Swipe to browse · tap the art to hide details</span>`;

  localStorage.setItem('mc_lightbox', JSON.stringify({ id: card.id, mode }));

  const lightbox = document.getElementById('lightbox');
  lightbox.style.background = '#0c0c0f';
  lightbox.innerHTML = `
    <div class="lightbox lb2 ${isSurprise ? 'lb-surprise' : ''}" id="lightboxOverlay" style="background:#0c0c0f;">
      <div class="lb-blur-bg" id="lbBlurBg" style="background-image:url('${artCrop || normal}')"></div>
      <div class="lb-top">
        <button class="close-btn" id="lbClose" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <div class="lb-actions">
          <button class="lb-info-btn" id="lbInfoBtn" aria-label="Hide details" title="Hide details" aria-pressed="false">${LB_EYE}</button>
          <div class="toggle">
            <button id="toggleArt" ${isSurprise ? '' : 'class="active"'} ${disabledAttr} ${disabledTitle}>Art</button>
            <button id="toggleFrame" ${isSurprise ? 'class="active"' : ''}>Frame</button>
          </div>
        </div>
      </div>

      <div class="lb-body" id="lbBody">
       <div class="lb-col">
        <div class="lb-stage">
          <div class="art-container ${isSurprise ? 'frame-active' : ''}" id="artContainer" style="overflow:hidden;">
            <img id="lbImage" src="${initialSrc}" alt="${card.name}" ${isSurprise ? 'class="frame-mode"' : ''}>
            ${!isSurprise ? `
            <div class="lb-ghost-arrows" id="lbGhostArrows">
              <button class="lb-ghost-arrow lb-ghost-prev ${noHistory ? 'hidden' : disabledPrev ? 'lb-arrow-disabled' : ''}" id="lbGhostPrev" aria-label="Previous">‹</button>
              <button class="lb-ghost-arrow lb-ghost-next ${disabledNext ? 'lb-arrow-disabled' : ''}" id="lbGhostNext" aria-label="Next">›</button>
            </div>` : ''}
          </div>
        </div>
        <div class="lb-head">
          <h2 class="lb-title" id="lbTitle"></h2>
          <button class="lb-versions" id="lbVersions" hidden></button>
        </div>
        <div class="lb-facts" id="lbFacts"></div>
       </div>
      </div>

      <div class="zoom-hint" id="zoomHint">Click the art to hide details · Scroll to zoom · ← → to browse</div>
    </div>
  `;

  renderCardInfo(card);
  document.body.classList.remove('lb-focus');
  // Keep the art sized so the name + facts below always fit on desktop (they change height card to card)
  const _ov = document.getElementById('lightboxOverlay');
  const _measure = () => _ov.style.setProperty('--lb-info-h', (_ov.querySelector('.lb-head').offsetHeight + _ov.querySelector('.lb-facts').offsetHeight) + 'px');
  if (window.ResizeObserver) { const ro = new ResizeObserver(_measure); ro.observe(_ov.querySelector('.lb-head')); ro.observe(_ov.querySelector('.lb-facts')); }
  _measure();
  document.getElementById('lbVersions').addEventListener('click', () => openTag(`!"${currentCard.name}"`, currentCard.name, 'Card'));

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
    mBtn.innerHTML = `Draw a Card`;
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
    if (_lbMode === 'surprise') setMode('gallery');
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
        setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 1500);
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
        setMode('gallery');
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

      currentCard = nextCard;
      _lbMode = nextMode;
      renderCardInfo(nextCard);
      const body = document.getElementById('lbBody'); if (body) body.scrollTop = 0;
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
        setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 1500);
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
      setTimeout(() => fetchRandomCard().then(c => { if (c) window._surpriseQueue.push(c); }), 1500);
    }
  }

  // ── Ghost arrows (desktop fade) ────────────────────────────────────────────
  let ghostTimer = null;
  function showGhostArrows() {
    const g = document.getElementById('lbGhostArrows');
    if (!g) return;
    g.classList.remove('lb-ghost-hidden');
    clearTimeout(ghostTimer);
    ghostTimer = setTimeout(() => g.classList.add('lb-ghost-hidden'), 2000); // fade after 2s; any touch brings them back
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
    if (e.touches.length > 1) { swiping = false; return; }
    if (e.target.closest('button, a, .toggle')) return;
    swX = e.touches[0].clientX; swY = e.touches[0].clientY;
    scX = swX; swiping = true; swDir = null;
  }, { passive: true });

  document.getElementById('lightboxOverlay').addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) { e.preventDefault(); swiping = false; return; }
    if (!swiping) return;
    const dx = e.touches[0].clientX - swX;
    const dy = e.touches[0].clientY - swY;
    scX = e.touches[0].clientX;
    if (!swDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
      swDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    if (swDir === 'h') e.preventDefault();
  }, { passive: false });

  document.getElementById('lightboxOverlay').addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const dx = scX - swX;
    if (swDir !== 'h' || Math.abs(dx) < window.innerWidth * 0.2) return;
    if (dx < 0) goNext();
    else goPrev();
  });

  // ── Frame toggle ───────────────────────────────────────────────────────────────────────────
  const img = document.getElementById('lbImage');
  document.getElementById('toggleArt').addEventListener('click', () => {
    const ac = currentCard.image_uris?.art_crop || currentCard.card_faces?.[0]?.image_uris?.art_crop;
    if (!ac) return;
    currentMode = 'art'; img.src = ac;
    img.classList.remove('frame-mode');
    document.getElementById('artContainer')?.classList.remove('frame-active');
    document.getElementById('toggleArt').classList.add('active');
    document.getElementById('toggleFrame').classList.remove('active');
    resetZoom();
  });
  document.getElementById('toggleFrame').addEventListener('click', () => {
    const n  = currentCard.image_uris?.normal  || currentCard.card_faces?.[0]?.image_uris?.normal;
    const ac = currentCard.image_uris?.art_crop || currentCard.card_faces?.[0]?.image_uris?.art_crop;
    currentMode = 'frame'; img.src = n || ac;
    img.classList.add('frame-mode');
    document.getElementById('artContainer')?.classList.add('frame-active');
    document.getElementById('toggleFrame').classList.add('active');
    document.getElementById('toggleArt').classList.remove('active');
    resetZoom();
  });

  // ── Art only: the eye button (or a tap on the art) hides everything else; tap again to bring it back ──
  const lbBody = document.getElementById('lbBody');
  const infoBtn = document.getElementById('lbInfoBtn');
  const setFocus = on => {
    document.body.classList.toggle('lb-focus', on);
    infoBtn.setAttribute('aria-pressed', on);
    infoBtn.title = on ? 'Show details' : 'Hide details'; infoBtn.setAttribute('aria-label', infoBtn.title);
    infoBtn.innerHTML = on ? LB_EYE_OFF : LB_EYE;
  };
  infoBtn.addEventListener('click', (e) => { e.stopPropagation(); setFocus(!document.body.classList.contains('lb-focus')); });
  lbBody.addEventListener('click', (e) => {
    if (document.body.classList.contains('lb-focus')) { setFocus(false); return; }
    if (e.target.closest('#artContainer') && !e.target.closest('button') && scale <= 1) { setFocus(true); return; }
    // Desktop: a click on the empty backdrop closes, as before
    if (!('ontouchstart' in window) && (e.target === lbBody || e.target.classList.contains('lb-col') || e.target.classList.contains('lb-stage'))) handleClose();
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
  if (e.key === 'Escape') { closeLightbox(); if (_lbMode === 'surprise') setMode('gallery'); }
  if (e.key === 'ArrowRight') { flashArrow('lbNext'); document.getElementById('lbNext')?.click(); }
  if (e.key === 'ArrowLeft')  { flashArrow('lbPrev'); document.getElementById('lbPrev')?.click(); }
}

function closeLightbox() {
  _transitioning = false;
  document.body.classList.remove('lb-focus');
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
