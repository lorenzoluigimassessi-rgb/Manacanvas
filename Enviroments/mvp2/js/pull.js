// Pull a Card — a vertical stack of random cards: swipe (or scroll) up to pull the next one,
// the previous stays peeking above. Tap a card for its details in a bottom sheet.
let _pull = null;

const _pullEsc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function _pullSrc(c, view) {
  const iu = c.image_uris || c.card_faces?.[0]?.image_uris || {};
  return view === 'art' ? (iu.art_crop || iu.normal) : (iu.normal || iu.art_crop);
}

function openPullStack(first, nonce) {
  const ov = document.getElementById('drawRitual');
  ov.removeEventListener('click', closeDrawRitual);
  const view = localStorage.getItem('mc_pull_view') === 'frame' ? 'frame' : 'art'; // Art by default
  const touch = 'ontouchstart' in window;
  ov.classList.add('pull-mode');
  ov.innerHTML = `
    <div class="pull-stack-bg" id="pullBgA"></div><div class="pull-stack-bg" id="pullBgB"></div>
    <div class="draw-ritual-radial"></div>
    <div class="pull-top">
      <button class="pull-close" id="pullClose" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="pull-toggle" role="group" aria-label="View">
        <button data-v="art" class="${view === 'art' ? 'active' : ''}">Art</button>
        <button data-v="frame" class="${view === 'frame' ? 'active' : ''}">Frame</button>
      </div>
    </div>
    <div class="pull-stack view-${view}" id="pullStack"><div class="pull-spacer"></div><div class="pull-spacer pull-spacer-end"></div></div>
    <div class="pull-nav">
      <button id="pullPrev" aria-label="Previous card" disabled><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
      <button id="pullNext" aria-label="Next card"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
    </div>
    <div class="pull-hint" id="pullHint" hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>${touch ? 'Swipe up for the next card' : 'Scroll for the next card'}</div>
    <div class="pull-sheet-bg" id="pullSheetBg"></div>
    <div class="pull-sheet" id="pullSheet" role="dialog" aria-label="Card details">
      <div class="pull-sheet-grab" id="pullGrab"></div>
      <h2 class="lb-title" id="lbTitle"></h2>
      <button class="lb-versions" id="lbVersions" hidden></button>
      <div class="lb-facts" id="lbFacts"></div>
    </div>`;
  _pull = { nonce, cards: [], idx: -1, view, loading: false, bgFront: null, sheet: false };

  document.getElementById('pullClose').addEventListener('click', e => { e.stopPropagation(); closeDrawRitual(); });
  ov.querySelectorAll('.pull-toggle button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); _pullSetView(b.dataset.v); }));
  document.getElementById('pullSheetBg').addEventListener('click', () => _pullSheet(false));
  document.getElementById('pullPrev').addEventListener('click', e => { e.stopPropagation(); _pullGo(_pull.idx - 1); });
  document.getElementById('pullNext').addEventListener('click', e => { e.stopPropagation(); _pullGo(_pull.idx + 1); });
  document.getElementById('lbVersions').addEventListener('click', () => _pullTag(`!"${currentCard.name}"`, currentCard.name, 'Card'));
  _pullSheetDrag();

  const stack = document.getElementById('pullStack');
  let raf = 0;
  stack.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; _pullOnScroll(); }); }, { passive: true });
  document.addEventListener('keydown', _pullKey);

  _pullAdd(first);
  _pullOnScroll();
  _pullMore(2);

  // First few pulls: say how to get the next one
  const seen = +(localStorage.getItem('mc_pull_hint') || 0);
  if (seen < 3) {
    localStorage.setItem('mc_pull_hint', seen + 1);
    const h = document.getElementById('pullHint');
    setTimeout(() => { if (_pull && _pull.idx === 0) h.hidden = false; }, 900);
    setTimeout(() => h.classList.add('fade'), 5000);
  }
}

// Art view only (the frame already prints it): the card's flavour text and type · set · year
function _pullOverview(card) {
  const f = card.card_faces?.[0] || card;
  const flavor = card.flavor_text || f.flavor_text;
  const line = [(f.type_line || card.type_line || '').replace(/\s+—\s+/, ' — '), card.set_name, card.released_at?.slice(0, 4)].filter(Boolean).map(_pullEsc).join(' · ');
  return `<div class="pull-overview">${flavor ? `<p class="pull-flavor">${_pullEsc(flavor)}</p>` : ''}${line ? `<div class="pull-line">${line}</div>` : ''}</div>`;
}

function _pullAdd(card) {
  const p = _pull, i = p.cards.length;
  p.cards.push(card);
  const el = document.createElement('div');
  el.className = 'pull-slide';
  el.innerHTML = `
    <div class="pull-slide-inner">
      <button class="pull-card ${p.view === 'frame' ? 'is-frame' : ''}" aria-label="Details of ${_pullEsc(card.name)}"><img src="${_pullSrc(card, p.view)}" alt="" draggable="false"></button>
      <div class="pull-meta">
        <div class="pull-name">${_pullEsc(card.name)}</div>
        ${card.artist ? `<button class="pull-artist">${_pullEsc(card.artist)}</button>` : ''}
        ${_pullOverview(card)}
      </div>
    </div>`;
  el.querySelector('.pull-card').addEventListener('click', e => {
    e.stopPropagation();
    if (i === _pull.idx) _pullSheet(true); else _pullGo(i);
  });
  el.querySelector('.pull-artist')?.addEventListener('click', e => { e.stopPropagation(); _pullTag(`a:"${card.artist}"`, card.artist, 'Artist', card); });
  const stack = document.getElementById('pullStack');
  stack.insertBefore(el, stack.querySelector('.pull-spacer-end'));
  // Warm the other view's image too, so Art|Frame switches instantly
  new Image().src = _pullSrc(card, p.view === 'art' ? 'frame' : 'art');
}

async function _pullMore(n) {
  const p = _pull;
  if (!p || p.loading) return;
  p.loading = true;
  for (let k = 0; k < n; k++) {
    const c = await fetchRandomCard();
    if (_pull !== p) return;
    if (c) { _pullAdd(c); _pullOnScroll(); }
  }
  p.loading = false;
}

// Scale/dim cards by distance from the centre; track the current one
function _pullOnScroll() {
  const p = _pull; if (!p) return;
  const stack = document.getElementById('pullStack');
  const mid = stack.scrollTop + stack.clientHeight / 2;
  const slides = stack.querySelectorAll('.pull-slide');
  let best = 0, bestD = Infinity;
  slides.forEach((s, i) => {
    const d = (s.offsetTop + s.offsetHeight / 2 - mid) / s.offsetHeight;
    const a = Math.min(Math.abs(d), 1);
    const inner = s.firstElementChild;
    inner.style.transform = `scale(${1 - a * 0.12})`;
    inner.style.opacity = 1 - a * 0.55;
    if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
  });
  if (best !== p.idx) {
    const first = p.idx === -1;
    p.idx = best;
    slides.forEach((s, i) => s.classList.toggle('current', i === best));
    document.getElementById('pullPrev').disabled = best === 0;
    _pullBg(p.cards[best]);
    if (!first) { const h = document.getElementById('pullHint'); if (h) h.classList.add('fade'); }
    if (best >= p.cards.length - 2) _pullMore(2);
  }
}

function _pullBg(card) {
  const p = _pull, iu = card.image_uris || card.card_faces?.[0]?.image_uris || {};
  const next = p.bgFront === 'A' ? 'B' : 'A';
  const el = document.getElementById('pullBg' + next);
  el.style.backgroundImage = `url('${iu.art_crop || iu.normal}')`;
  el.style.opacity = '1';
  if (p.bgFront) document.getElementById('pullBg' + p.bgFront).style.opacity = '0';
  p.bgFront = next;
}

function _pullGo(i) {
  const slides = document.querySelectorAll('#pullStack .pull-slide');
  if (slides[i]) slides[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function _pullSetView(v) {
  const p = _pull; if (!p || p.view === v) return;
  p.view = v;
  localStorage.setItem('mc_pull_view', v);
  document.querySelectorAll('.pull-toggle button').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  const stack = document.getElementById('pullStack');
  stack.classList.toggle('view-art', v === 'art'); stack.classList.toggle('view-frame', v === 'frame');
  requestAnimationFrame(() => document.querySelectorAll('#pullStack .pull-slide')[p.idx]?.scrollIntoView({ block: 'center' })); // stay on this card
  document.querySelectorAll('#pullStack .pull-slide').forEach((s, i) => {
    s.querySelector('img').src = _pullSrc(p.cards[i], v);
    s.querySelector('.pull-card').classList.toggle('is-frame', v === 'frame');
  });
}

// Bottom sheet with the card's details (same rows as the detail page)
function _pullSheet(open) {
  const p = _pull; if (!p) return;
  p.sheet = open;
  if (open) { currentCard = p.cards[p.idx]; renderCardInfo(currentCard); document.getElementById('pullSheet').scrollTop = 0; }
  document.getElementById('drawRitual').classList.toggle('sheet-open', open);
}

function _pullSheetDrag() {
  const sheet = document.getElementById('pullSheet');
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', e => { if (sheet.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 0) { sheet.style.transition = 'none'; sheet.style.setProperty('--drag', dy + 'px'); }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transition = ''; sheet.style.removeProperty('--drag');
    if (dy > 90) _pullSheet(false);
    y0 = null;
  });
}

// A tag from the stack opens its result where you are; back from it reopens that card
function _pullTag(q, label, tag, card) {
  if (card) currentCard = card;
  openTag(q, label, tag);
}

function _pullKey(e) {
  const p = _pull; if (!p) return;
  if (e.key === 'Escape') { e.preventDefault(); if (p.sheet) _pullSheet(false); else closeDrawRitual(); return; }
  if (p.sheet) return;
  if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); _pullGo(p.idx + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); _pullGo(p.idx - 1); }
  else if (e.key === 'Enter') { e.preventDefault(); _pullSheet(true); }
}

function pullCleanup() {
  if (!_pull) return;
  _pull = null;
  document.removeEventListener('keydown', _pullKey);
  const ov = document.getElementById('drawRitual');
  ov.classList.remove('pull-mode', 'sheet-open');
}
