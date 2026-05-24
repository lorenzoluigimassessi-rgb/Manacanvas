// draw-overlay.js — detail overlay

function openDetail() {
  const card = drawHistory[drawIdx];
  if (!card) return;

  const setName  = card.set_name || '';
  const year     = card.released_at ? card.released_at.slice(0, 4) : '';
  const artist   = card.artist || '';
  const manaCost = card.mana_cost || '';

  const manaHtml = manaCost.replace(/\{([^}]+)\}/g, (_, sym) => {
    const code = sym.toLowerCase().replace('/', '');
    return `<img class="mana-symbol-btn" src="https://svgs.scryfall.io/card-symbols/${code}.svg" alt="${sym}" onerror="this.style.display='none'">`;
  });

  const panel = document.getElementById('drawDetailPanel');
  panel.innerHTML = `
    <div class="draw-detail-name">${card.name || ''}</div>
    <div class="draw-detail-meta">
      ${artist ? `Illustrated by ${artist}` : ''}${setName ? ` · ${setName}` : ''}${year ? ` · ${year}` : ''}
    </div>
    ${manaHtml ? `<div class="draw-detail-mana">${manaHtml}</div>` : ''}
    <div class="draw-detail-actions">
      ${artist   ? `<button class="draw-browse-btn" id="detailBrowseArtist">Browse by artist</button>` : ''}
      ${setName  ? `<button class="draw-browse-btn" id="detailBrowseSet">Browse by set</button>`       : ''}
    </div>
    <button class="draw-detail-back" id="detailBack">\u2190 Back to Draw</button>
  `;

  document.getElementById('drawDetail').classList.add('active');

  document.getElementById('detailBack').addEventListener('click', closeDetail);
  document.getElementById('drawDetailBackdrop').addEventListener('click', closeDetail, { once: true });

  if (artist) {
    document.getElementById('detailBrowseArtist').addEventListener('click', () => {
      closeDetail();
      exitDrawMode();
      activeArtist = [card.artist];
      updateChips();
      loadInitialGrid();
    });
  }
  if (setName) {
    document.getElementById('detailBrowseSet').addEventListener('click', () => {
      closeDetail();
      exitDrawMode();
      activeSets = [card.set];
      updateChips();
      loadInitialGrid();
    });
  }
}

function closeDetail() {
  document.getElementById('drawDetail').classList.remove('active');
}
