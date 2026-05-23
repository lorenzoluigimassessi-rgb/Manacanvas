// draw.js — Draw mode core

const BATCH_SIZE = 10;
const PREFETCH_AT = 3;
const SWIPE_THRESHOLD = 0.28;
const HISTORY_MAX = 20;

let drawQueue    = [];
let drawHistory  = [];
let drawIdx      = -1;
let drawToggle   = 'art';   // 'art' | 'frame'
let drawOpen     = false;
let savedScroll  = 0;
let fetching     = false;
let swipeCount   = 0;

// drag
let dragStartX = 0, dragStartY = 0, dragCurX = 0;
let dragging = false, dragDir = null;
let arrowTimer = null;

// ─── Open / Close ─────────────────────────────────────────────────────────────

function enterDrawMode() {
  console.log('[Draw] enterDrawMode called, drawOpen=', drawOpen);
  if (drawOpen) return;
  drawOpen    = true;
  savedScroll = window.scrollY;

  // Reset session
  drawQueue   = [];
  drawHistory = [];
  drawIdx     = -1;
  drawToggle  = 'art';
  swipeCount  = 0;

  // Show overlay
  const mode = document.getElementById('drawMode');
  mode.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Show loading, hide ritual
  show('drawLoading');
  hide('drawRitual');
  setArtSrc('');

  // Fetch first batch then start
  fetchBatch().then(() => {
    hide('drawLoading');
    startRitual();
  });

  bindEvents();
}

function exitDrawMode() {
  if (!drawOpen) return;
  drawOpen = false;

  stopParallax();
  unbindEvents();
  closeDetail();

  document.getElementById('drawMode').classList.remove('active');
  document.body.style.overflow = '';
  window.scrollTo(0, savedScroll);
}

// ─── Loading helpers ──────────────────────────────────────────────────────────

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function setArtSrc(url) {
  const img = document.querySelector('#drawArt img');
  if (img) img.src = url;
}

// ─── Entry ritual ─────────────────────────────────────────────────────────────

function startRitual() {
  const ritual = document.getElementById('drawRitual');
  const card   = document.getElementById('ritualCard');
  if (!ritual || !card) { showCard(); return; }

  show('drawRitual');
  card.className = ''; // reset classes

  // Set gradient from first card
  const first = drawQueue[0];
  if (first) applyGradient(first.colors);

  // Skip on tap
  ritual.addEventListener('click', skipRitual, { once: true });

  // Flip after short delay
  setTimeout(() => {
    card.classList.add('flip');
    card.addEventListener('animationend', onFlipEnd, { once: true });
  }, 200);
}

function onFlipEnd() {
  const card = document.getElementById('ritualCard');
  if (!card) return;
  card.classList.remove('flip');
  card.classList.add('expand');
  card.addEventListener('animationend', () => {
    hide('drawRitual');
    showCard();
  }, { once: true });
}

function skipRitual() {
  hide('drawRitual');
  showCard();
}

// ─── Card display ─────────────────────────────────────────────────────────────

function showCard() {
  const card = drawQueue.shift();
  if (!card) return;
  drawHistory.push(card);
  drawIdx = drawHistory.length - 1;
  renderCard(card);
  startParallax();
  checkPrefetch();
}

function renderCard(card) {
  const url = imageUrl(card);
  applyGradient(card.colors);
  setArtSrc(url);
  playShimmer(card.colors);
  syncToggleUI();
}

function imageUrl(card) {
  const u = card.image_uris || card.card_faces?.[0]?.image_uris || {};
  return drawToggle === 'frame'
    ? (u.normal || u.art_crop || '')
    : (u.art_crop || u.normal || '');
}

function applyGradient(colors) {
  const el = document.getElementById('drawGradient');
  if (el) el.style.background = getGradient(colors);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function goNext() {
  // Move forward in history if possible
  if (drawIdx < drawHistory.length - 1) {
    drawIdx++;
    transitionTo(drawHistory[drawIdx], 'next');
    return;
  }
  // Pull from queue
  if (!drawQueue.length) return;
  const card = drawQueue.shift();
  if (drawHistory.length >= HISTORY_MAX) drawHistory.shift();
  drawHistory.push(card);
  drawIdx = drawHistory.length - 1;
  transitionTo(card, 'next');
  swipeCount++;
  if (swipeCount === 3) tryEnableGyro();
  checkPrefetch();
}

function goPrev() {
  if (drawIdx <= 0) return;
  drawIdx--;
  transitionTo(drawHistory[drawIdx], 'prev');
}

// ─── Transition ───────────────────────────────────────────────────────────────

function transitionTo(card, dir) {
  const art      = document.getElementById('drawArt');
  const incoming = document.getElementById('drawArtIncoming');
  if (!art || !incoming) return;

  const url      = imageUrl(card);
  const inImg    = incoming.querySelector('img');
  inImg.src      = url;

  const startX   = dir === 'next' ? '100%' : '-100%';
  const exitX    = dir === 'next' ? '-100%' : '100%';

  // Position incoming off-screen, make visible
  incoming.style.transition = 'none';
  incoming.style.transform  = `translateX(${startX})`;
  incoming.style.opacity    = '1';

  // Apply gradient immediately
  applyGradient(card.colors);

  // Animate on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      art.style.transition      = 'transform 280ms ease-in-out, opacity 280ms ease-in-out';
      incoming.style.transition = 'transform 280ms ease-in-out';
      art.style.transform       = `translateX(${exitX})`;
      art.style.opacity         = '0';
      incoming.style.transform  = 'translateX(0)';
    });
  });

  setTimeout(() => {
    // Swap layers
    setArtSrc(url);
    art.style.transition = 'none';
    art.style.transform  = '';
    art.style.opacity    = '1';
    incoming.style.transition = 'none';
    incoming.style.transform  = `translateX(${startX})`;
    incoming.style.opacity    = '0';
    playShimmer(card.colors);
  }, 300);
}

// ─── Drag / swipe ─────────────────────────────────────────────────────────────

function onDragStart(x, y) {
  dragStartX = x;
  dragStartY = y;
  dragCurX   = x;
  dragging   = true;
  dragDir    = null;
}

function onDragMove(x, y) {
  if (!dragging) return;
  dragCurX = x;
  const dx = x - dragStartX;
  const dy = y - dragStartY;

  if (!dragDir) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8)
      dragDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    return;
  }

  if (dragDir === 'v') return;

  const art  = document.getElementById('drawArt');
  const tilt = (dx / window.innerWidth) * 4;
  art.style.transition = 'none';
  art.style.transform  = `translateX(${dx}px) rotate(${tilt}deg)`;

  // Peek
  const incoming  = document.getElementById('drawArtIncoming');
  const peekCard  = dx < 0
    ? (drawIdx < drawHistory.length - 1 ? drawHistory[drawIdx + 1] : drawQueue[0])
    : (drawIdx > 0 ? drawHistory[drawIdx - 1] : null);

  if (peekCard && incoming) {
    const peekImg = incoming.querySelector('img');
    const peekUrl = imageUrl(peekCard);
    if (peekImg.src !== peekUrl) peekImg.src = peekUrl;
    const fromX    = dx < 0 ? '100%' : '-100%';
    const progress = Math.min(Math.abs(dx) / (window.innerWidth * SWIPE_THRESHOLD), 1);
    incoming.style.transition = 'none';
    incoming.style.transform  = `translateX(calc(${fromX} + ${dx < 0 ? -1 : 1} * ${Math.abs(dx) * 0.25}px))`;
    incoming.style.opacity    = String(progress * 0.7);
  }
}

function onDragEnd(x, y) {
  if (!dragging) return;
  dragging = false;

  const dx  = x - dragStartX;
  const dy  = y - dragStartY;
  const art = document.getElementById('drawArt');
  const inc = document.getElementById('drawArtIncoming');

  // Swipe down → exit
  if (dragDir === 'v' && dy > 80) {
    art.style.transition = '';
    art.style.transform  = '';
    if (inc) { inc.style.opacity = '0'; }
    exitDrawMode();
    return;
  }

  if (dragDir !== 'h') { snapBack(art, inc); return; }

  if (Math.abs(dx) >= window.innerWidth * SWIPE_THRESHOLD) {
    art.style.transition = '';
    art.style.transform  = '';
    if (inc) inc.style.opacity = '0';
    if (dx < 0) goNext(); else goPrev();
  } else {
    snapBack(art, inc);
  }
}

function snapBack(art, inc) {
  if (art) {
    art.style.transition = 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease';
    art.style.transform  = '';
    art.style.opacity    = '1';
  }
  if (inc) {
    inc.style.transition = 'opacity 220ms ease';
    inc.style.opacity    = '0';
  }
  setTimeout(() => {
    if (art) art.style.transition = '';
    if (inc) inc.style.transition = '';
  }, 220);
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function setToggle(mode) {
  drawToggle = mode;
  syncToggleUI();
  const card = drawHistory[drawIdx];
  if (card) renderCard(card);
}

function syncToggleUI() {
  const artBtn   = document.getElementById('drawToggleArt');
  const frameBtn = document.getElementById('drawToggleFrame');
  if (artBtn)   artBtn.classList.toggle('active',   drawToggle === 'art');
  if (frameBtn) frameBtn.classList.toggle('active', drawToggle === 'frame');
}

// ─── Hover arrows ─────────────────────────────────────────────────────────────

function showArrows() {
  const prev = document.getElementById('drawArrowPrev');
  const next = document.getElementById('drawArrowNext');
  if (prev) prev.style.opacity = drawIdx > 0 ? '1' : '0';
  if (next) next.style.opacity = '1';
  clearTimeout(arrowTimer);
  arrowTimer = setTimeout(() => {
    if (prev) prev.style.opacity = '0';
    if (next) next.style.opacity = '0';
  }, 2000);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchBatch() {
  if (fetching) return;
  fetching = true;
  const calls = Array.from({ length: BATCH_SIZE }, () =>
    fetch('https://api.scryfall.com/cards/random?q=has:illustration')
      .then(r => r.json())
      .catch(() => null)
  );
  const results = await Promise.all(calls);
  drawQueue.push(...results.filter(Boolean));
  fetching = false;
}

function checkPrefetch() {
  if (drawQueue.length <= PREFETCH_AT && !fetching) fetchBatch();
}

// ─── Event binding ────────────────────────────────────────────────────────────

function bindEvents() {
  const mode = document.getElementById('drawMode');

  mode.addEventListener('touchstart',  onTS, { passive: true });
  mode.addEventListener('touchmove',   onTM, { passive: true });
  mode.addEventListener('touchend',    onTE);
  mode.addEventListener('mousedown',   onMD);
  mode.addEventListener('mousemove',   showArrows);
  mode.addEventListener('wheel',       onWheel, { passive: true });
  window.addEventListener('mousemove', onWMM);
  window.addEventListener('mouseup',   onWMU);
  window.addEventListener('keydown',   onKey);

  document.getElementById('drawExit').addEventListener('click', exitDrawMode);
  document.getElementById('drawArrowPrev').addEventListener('click', goPrev);
  document.getElementById('drawArrowNext').addEventListener('click', goNext);
  document.getElementById('drawToggleArt').addEventListener('click', () => setToggle('art'));
  document.getElementById('drawToggleFrame').addEventListener('click', () => setToggle('frame'));
  document.getElementById('drawArt').addEventListener('click', onArtClick);
}

function unbindEvents() {
  const mode = document.getElementById('drawMode');
  mode.removeEventListener('touchstart',  onTS);
  mode.removeEventListener('touchmove',   onTM);
  mode.removeEventListener('touchend',    onTE);
  mode.removeEventListener('mousedown',   onMD);
  mode.removeEventListener('mousemove',   showArrows);
  mode.removeEventListener('wheel',       onWheel);
  window.removeEventListener('mousemove', onWMM);
  window.removeEventListener('mouseup',   onWMU);
  window.removeEventListener('keydown',   onKey);
}

function onTS(e) { onDragStart(e.touches[0].clientX, e.touches[0].clientY); }
function onTM(e) { onDragMove(e.touches[0].clientX, e.touches[0].clientY); }
function onTE(e) { onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }
function onMD(e) { onDragStart(e.clientX, e.clientY); }
function onWMM(e) { if (dragging) onDragMove(e.clientX, e.clientY); }
function onWMU(e) { if (dragging) onDragEnd(e.clientX, e.clientY); }
function onWheel(e) { if (e.deltaY > 0) goNext(); }
function onKey(e) {
  if (!drawOpen) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  goNext();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    goPrev();
  if (e.key === 'Escape') {
    if (document.getElementById('drawDetail').classList.contains('active')) closeDetail();
    else exitDrawMode();
  }
}

function onArtClick() {
  // Don't open detail if user was dragging
  if (Math.abs(dragCurX - dragStartX) > 8) return;
  openDetail();
}
