// draw.js — Draw mode: entry ritual, swipe, transitions, history, API

// ─── State ───────────────────────────────────────────────────────────────────
const DRAW_HISTORY_MAX = 20;
const DRAW_PREFETCH_BATCH = 10;
const DRAW_PREFETCH_THRESHOLD = 3;
const SWIPE_THRESHOLD = 0.30; // 30% of screen width

let drawQueue = [];       // pre-fetched cards not yet shown
let drawHistory = [];     // cards shown this session (capped at 20)
let drawHistoryIndex = -1; // current position in history
let drawToggleMode = 'art'; // 'art' | 'frame'
let drawSwipeCount = 0;   // for gyro permission trigger
let drawActive = false;

let isFetching = false;
let savedScrollY = 0;

// Drag state
let dragStartX = 0;
let dragStartY = 0;
let dragCurrentX = 0;
let isDragging = false;
let dragDirection = null; // 'h' | 'v'

// Arrow hide timer
let arrowTimer = null;

// ─── Entry ───────────────────────────────────────────────────────────────────
async function enterDrawMode() {
  savedScrollY = window.scrollY;
  drawQueue = [];
  drawHistory = [];
  drawHistoryIndex = -1;
  drawToggleMode = 'art';
  drawSwipeCount = 0;
  drawActive = true;

  const el = document.getElementById('drawMode');
  el.classList.add('active');
  document.body.style.overflow = 'hidden';

  showDrawLoading();
  prefetchBatch().then(() => {
    hideDrawLoading();
    playEntryRitual();
  });

  bindDrawEvents();
}

function exitDrawMode() {
  drawActive = false;
  stopParallax();
  const el = document.getElementById('drawMode');
  el.classList.remove('active');
  document.body.style.overflow = '';
  window.scrollTo(0, savedScrollY);
  unbindDrawEvents();
}

// ─── Loading state ────────────────────────────────────────────────────────────
function showDrawLoading() {
  document.getElementById('drawLoading').classList.remove('hidden');
  document.getElementById('drawRitual').classList.add('hidden');
}

function hideDrawLoading() {
  document.getElementById('drawLoading').classList.add('hidden');
}

// ─── Entry ritual ─────────────────────────────────────────────────────────────
function playEntryRitual() {
  const ritual = document.getElementById('drawRitual');
  const card = document.getElementById('ritualCard');
  ritual.classList.remove('hidden');

  // Skip on tap
  ritual.addEventListener('click', skipRitual, { once: true });

  // Step 1: card appears (already visible via CSS)
  setTimeout(() => {
    card.classList.add('flip');
  }, 150);

  // Step 2: gradient bleeds in behind
  const firstCard = peekNextCard();
  if (firstCard) {
    document.getElementById('drawGradient').style.background = getGradient(firstCard.colors);
  }

  // Step 3: expand to full screen
  card.addEventListener('animationend', () => {
    if (!card.classList.contains('flip')) return;
    card.classList.remove('flip');
    card.classList.add('expand');
    card.addEventListener('animationend', () => {
      ritual.classList.add('hidden');
      ritual.removeEventListener('click', skipRitual);
      showFirstCard();
    }, { once: true });
  }, { once: true });
}

function skipRitual() {
  const ritual = document.getElementById('drawRitual');
  ritual.classList.add('hidden');
  showFirstCard();
}

// ─── Card display ─────────────────────────────────────────────────────────────
function peekNextCard() {
  return drawQueue[0] || null;
}

function showFirstCard() {
  const card = drawQueue.shift();
  if (!card) return;
  drawHistory.push(card);
  drawHistoryIndex = drawHistory.length - 1;
  renderCard(card);
  startParallax();
  checkPrefetch();
}

function renderCard(card) {
  const imgUrl = getCardImageUrl(card);
  const gradient = getGradient(card.colors);

  document.getElementById('drawGradient').style.background = gradient;

  const art = document.getElementById('drawArt');
  const img = art.querySelector('img');
  img.src = imgUrl;
  img.alt = card.name || '';

  playShimmer(card.colors);
}

function getCardImageUrl(card) {
  const uris = card.image_uris || card.card_faces?.[0]?.image_uris || {};
  if (drawToggleMode === 'frame') return uris.normal || uris.art_crop || '';
  return uris.art_crop || uris.normal || '';
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function drawNext() {
  // If we're not at the end of history, move forward in history
  if (drawHistoryIndex < drawHistory.length - 1) {
    drawHistoryIndex++;
    transitionTo(drawHistory[drawHistoryIndex], 'next');
    return;
  }
  // Otherwise pull from queue
  if (drawQueue.length === 0) return; // still fetching
  const card = drawQueue.shift();
  if (drawHistory.length >= DRAW_HISTORY_MAX) drawHistory.shift();
  drawHistory.push(card);
  drawHistoryIndex = drawHistory.length - 1;
  transitionTo(card, 'next');
  drawSwipeCount++;
  if (drawSwipeCount === 3) tryEnableGyro();
  checkPrefetch();
}

function drawPrev() {
  if (drawHistoryIndex <= 0) return;
  drawHistoryIndex--;
  transitionTo(drawHistory[drawHistoryIndex], 'prev');
}

// ─── Transition ───────────────────────────────────────────────────────────────
function transitionTo(card, direction) {
  const art = document.getElementById('drawArt');
  const incoming = document.getElementById('drawArtIncoming');
  const gradient = document.getElementById('drawGradient');

  const imgUrl = getCardImageUrl(card);
  const incomingImg = incoming.querySelector('img');
  incomingImg.src = imgUrl;

  // Position incoming off-screen
  const fromX = direction === 'next' ? '100%' : '-100%';
  const toX = direction === 'next' ? '-100%' : '100%';

  incoming.style.transform = `translateX(${fromX})`;
  incoming.style.opacity = '1';

  // Animate
  requestAnimationFrame(() => {
    art.style.transition = 'transform 280ms ease-in-out, opacity 280ms ease-in-out';
    incoming.style.transition = 'transform 280ms ease-in-out';

    art.style.transform = `translateX(${toX})`;
    art.style.opacity = '0.3';
    incoming.style.transform = 'translateX(0)';
    gradient.style.background = getGradient(card.colors);
  });

  setTimeout(() => {
    // Swap: incoming becomes current
    const currentImg = art.querySelector('img');
    currentImg.src = imgUrl;
    art.style.transition = '';
    art.style.transform = '';
    art.style.opacity = '1';
    incoming.style.transition = '';
    incoming.style.transform = `translateX(${fromX})`;
    incoming.style.opacity = '0';
    playShimmer(card.colors);
  }, 280);
}

// ─── Drag / swipe ─────────────────────────────────────────────────────────────
function onDragStart(x, y) {
  dragStartX = x;
  dragStartY = y;
  dragCurrentX = x;
  isDragging = true;
  dragDirection = null;
}

function onDragMove(x, y) {
  if (!isDragging) return;
  dragCurrentX = x;
  const dx = x - dragStartX;
  const dy = y - dragStartY;

  if (!dragDirection) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      dragDirection = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    return;
  }

  if (dragDirection === 'v') return; // let scroll/exit handle it

  const art = document.getElementById('drawArt');
  const tilt = (dx / window.innerWidth) * 5; // max 5deg
  art.style.transition = 'none';
  art.style.transform = `translateX(${dx}px) rotate(${tilt}deg)`;

  // Peek incoming card
  const incoming = document.getElementById('drawArtIncoming');
  const peekCard = dx < 0
    ? (drawHistoryIndex < drawHistory.length - 1 ? drawHistory[drawHistoryIndex + 1] : drawQueue[0])
    : (drawHistoryIndex > 0 ? drawHistory[drawHistoryIndex - 1] : null);

  if (peekCard) {
    const peekImg = incoming.querySelector('img');
    const peekUrl = getCardImageUrl(peekCard);
    if (peekImg.src !== peekUrl) peekImg.src = peekUrl;
    const peekFrom = dx < 0 ? '100%' : '-100%';
    const peekProgress = Math.min(Math.abs(dx) / (window.innerWidth * SWIPE_THRESHOLD), 1);
    incoming.style.transition = 'none';
    incoming.style.transform = `translateX(calc(${peekFrom} + ${dx < 0 ? -1 : 1} * ${Math.abs(dx) * 0.3}px))`;
    incoming.style.opacity = String(peekProgress * 0.8);
  }
}

function onDragEnd(x, y) {
  if (!isDragging) return;
  isDragging = false;

  const dx = x - dragStartX;
  const dy = y - dragStartY;
  const art = document.getElementById('drawArt');
  const incoming = document.getElementById('drawArtIncoming');

  if (dragDirection === 'v' && dy > 60) {
    // Swipe down → exit
    art.style.transition = '';
    art.style.transform = '';
    incoming.style.opacity = '0';
    exitDrawMode();
    return;
  }

  if (dragDirection !== 'h') {
    snapBack(art, incoming);
    return;
  }

  const threshold = window.innerWidth * SWIPE_THRESHOLD;
  if (Math.abs(dx) >= threshold) {
    art.style.transition = '';
    art.style.transform = '';
    incoming.style.opacity = '0';
    if (dx < 0) drawNext();
    else drawPrev();
  } else {
    snapBack(art, incoming);
  }
}

function snapBack(art, incoming) {
  art.style.transition = 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease';
  art.style.transform = '';
  art.style.opacity = '1';
  incoming.style.transition = 'opacity 200ms ease';
  incoming.style.opacity = '0';
  setTimeout(() => {
    art.style.transition = '';
    incoming.style.transition = '';
  }, 200);
}

// ─── API pre-fetch ────────────────────────────────────────────────────────────
async function prefetchBatch() {
  if (isFetching) return;
  isFetching = true;
  const fetches = Array.from({ length: DRAW_PREFETCH_BATCH }, () =>
    fetch('https://api.scryfall.com/cards/random?q=is:hires')
      .then(r => r.json())
      .catch(() => null)
  );
  const results = await Promise.all(fetches);
  drawQueue.push(...results.filter(Boolean));
  isFetching = false;
}

function checkPrefetch() {
  if (drawQueue.length <= DRAW_PREFETCH_THRESHOLD && !isFetching) {
    prefetchBatch();
  }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function setDrawToggle(mode) {
  drawToggleMode = mode;
  document.getElementById('drawToggleArt').classList.toggle('active', mode === 'art');
  document.getElementById('drawToggleFrame').classList.toggle('active', mode === 'frame');
  const current = drawHistory[drawHistoryIndex];
  if (current) renderCard(current);
}

// ─── Hover arrows (desktop) ───────────────────────────────────────────────────
function showArrows() {
  document.getElementById('drawArrowPrev').style.opacity = drawHistoryIndex > 0 ? '1' : '0';
  document.getElementById('drawArrowNext').style.opacity = '1';
  clearTimeout(arrowTimer);
  arrowTimer = setTimeout(hideArrows, 2000);
}

function hideArrows() {
  document.getElementById('drawArrowPrev').style.opacity = '0';
  document.getElementById('drawArrowNext').style.opacity = '0';
}

// ─── Event binding ────────────────────────────────────────────────────────────
function bindDrawEvents() {
  const el = document.getElementById('drawMode');

  // Touch
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: true });
  el.addEventListener('touchend', onTouchEnd);

  // Mouse drag
  el.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Mouse move → show arrows
  el.addEventListener('mousemove', showArrows);

  // Keyboard
  window.addEventListener('keydown', onDrawKey);

  // Scroll wheel → next
  el.addEventListener('wheel', onDrawWheel, { passive: true });

  // Controls
  document.getElementById('drawExit').addEventListener('click', exitDrawMode);
  document.getElementById('drawArrowPrev').addEventListener('click', drawPrev);
  document.getElementById('drawArrowNext').addEventListener('click', drawNext);
  document.getElementById('drawToggleArt').addEventListener('click', () => setDrawToggle('art'));
  document.getElementById('drawToggleFrame').addEventListener('click', () => setDrawToggle('frame'));

  // Art tap → detail overlay
  document.getElementById('drawArt').addEventListener('click', openDrawDetail);
}

function unbindDrawEvents() {
  const el = document.getElementById('drawMode');
  el.removeEventListener('touchstart', onTouchStart);
  el.removeEventListener('touchmove', onTouchMove);
  el.removeEventListener('touchend', onTouchEnd);
  el.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  el.removeEventListener('mousemove', showArrows);
  window.removeEventListener('keydown', onDrawKey);
  el.removeEventListener('wheel', onDrawWheel);
}

// Touch handlers
function onTouchStart(e) { onDragStart(e.touches[0].clientX, e.touches[0].clientY); }
function onTouchMove(e)  { onDragMove(e.touches[0].clientX, e.touches[0].clientY); }
function onTouchEnd(e)   { onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }

// Mouse handlers
function onMouseDown(e) { onDragStart(e.clientX, e.clientY); }
function onMouseMove(e) { if (isDragging) onDragMove(e.clientX, e.clientY); }
function onMouseUp(e)   { if (isDragging) onDragEnd(e.clientX, e.clientY); }

function onDrawKey(e) {
  if (!drawActive) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') drawNext();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   drawPrev();
  if (e.key === 'Escape') exitDrawMode();
}

function onDrawWheel(e) {
  if (e.deltaY > 0) drawNext();
}
