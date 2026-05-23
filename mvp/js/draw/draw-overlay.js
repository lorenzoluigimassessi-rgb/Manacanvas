// draw-overlay.js — Draw detail overlay

function openDrawDetail(e) {
  // Don't open if user was dragging
  if (Math.abs(dragCurrentX - dragStartX) > 8) return;

  const card = drawHistory[drawHistoryIndex];
  if (!card) return;

  const setName = card.set_name || '';
  const year = card.released_at ? card.released_at.slice(0, 4) : '';
  const artist = card.artist || '';
  const manaCost = card.mana_cost || '';

  // Render mana symbols
  const manaHtml = manaCost
    ? manaCost.replace(/\{([^}]+)\}/g, (_, sym) => {
        const code = sym.toLowerCase().replace('/', '');
        return `<img class="mana-symbol-btn" src="https://svgs.scryfall.io/card-symbols/${code}.svg" alt="${sym}" onerror="this.style.display='none'">`;
      })
    : '';

  const detail = document.getElementById('drawDetail');
  detail.querySelector('#drawDetailPanel').innerHTML = `
    <div class="draw-detail-name">${card.name || ''}</div>
    <div class="draw-detail-meta">
      ${artist ? `Illustrated by ${artist}` : ''}
      ${setName ? ` · ${setName}` : ''}
      ${year ? ` · ${year}` : ''}
    </div>
    ${manaHtml ? `<div class="draw-detail-mana">${manaHtml}</div>` : ''}
    <div class="draw-detail-actions">
      ${artist ? `<button class="draw-browse-btn" id="drawBrowseArtist">Browse by artist</button>` : ''}
      ${setName ? `<button class="draw-browse-btn" id="drawBrowseSet">Browse by set</button>` : ''}
    </div>
    <button class="draw-detail-back" id="drawDetailBack">← Back to Draw</button>
  `;

  detail.classList.add('active');

  // Backdrop click → close
  document.getElementById('drawDetailBackdrop').addEventListener('click', closeDrawDetail, { once: true });

  // Back button
  document.getElementById('drawDetailBack').addEventListener('click', closeDrawDetail);

  // Browse shortcuts
  if (artist) {
    document.getElementById('drawBrowseArtist').addEventListener('click', () => {
      closeDrawDetail();
      exitDrawMode();
      activeArtist = [card.artist];
      updateChips();
      loadInitialGrid();
    });
  }
  if (setName) {
    document.getElementById('drawBrowseSet').addEventListener('click', () => {
      closeDrawDetail();
      exitDrawMode();
      activeSets = [card.set];
      updateChips();
      loadInitialGrid();
    });
  }

  // Escape key
  window.addEventListener('keydown', onDetailKey);
}

function closeDrawDetail() {
  const detail = document.getElementById('drawDetail');
  detail.classList.remove('active');
  window.removeEventListener('keydown', onDetailKey);
}

function onDetailKey(e) {
  if (e.key === 'Escape') closeDrawDetail();
}
