// Masonry in reading order. CSS columns fill top → bottom, one column at a time, so a sorted result read
// down the first column and a card's "next" was the one below it. Here every card added to a grid goes into
// the shortest column instead: cards read left → right, top → bottom, and ‹ › moves to the card beside.
// Grids keep being filled with plain appendChild; a MutationObserver moves each card into place before paint.
(function () {
  const GRIDS = '#grid, .l3-grid';
  // Card heights as a share of their width (aspect ratios fixed in CSS), so columns balance before images load
  const H = { 'card-short': 9 / 16, 'card-tall': 4 / 3 };
  const heightOf = el => { for (const k in H) if (el.classList.contains(k)) return H[k]; return 3 / 4; };
  const isCard = el => el.nodeType === 1 && (el.classList.contains('card') || el.classList.contains('shimmer'));
  let seq = 0;

  const colsOf = grid => parseInt(getComputedStyle(grid).getPropertyValue('--mcols')) || 2;
  const gapOf = grid => getComputedStyle(grid).columnGap;

  function newRow(grid) {
    const n = colsOf(grid), gap = gapOf(grid), row = document.createElement('div');
    row.className = 'mrow';
    row.style.gap = gap;
    row._h = Array(n).fill(0);
    for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'mcol'; c.style.gap = gap; row.appendChild(c); }
    return row;
  }
  function place(row, el) {
    const h = row._h, i = h.indexOf(Math.min(...h));
    h[i] += heightOf(el) + 0.04;
    el._mseq = el._mseq ?? seq++;
    row.children[i].appendChild(el);
  }
  function rowFor(grid, before) {
    const prev = before ? before.previousElementSibling : grid.lastElementChild;
    if (prev && prev.classList.contains('mrow')) return prev;
    const row = newRow(grid);
    grid.insertBefore(row, before || null);
    return row;
  }

  const mo = new MutationObserver(records => {
    for (const r of records) {
      const grid = r.target;
      if (!grid.matches || !grid.matches(GRIDS)) continue;
      grid.classList.add('masonry');
      r.addedNodes.forEach(n => {
        if (!isCard(n) || n.parentNode !== grid) return;
        const row = rowFor(grid, n);
        place(row, n);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Rebuild rows when the number of columns (or the gap) changes, keeping the reading order
  function reflow(grid) {
    grid.querySelectorAll(':scope > .mrow').forEach(row => {
      const cards = [...row.querySelectorAll(':scope > .mcol > *')].sort((a, b) => a._mseq - b._mseq);
      const fresh = newRow(grid);
      cards.forEach(c => place(fresh, c));
      row.replaceWith(fresh);
    });
  }
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => document.querySelectorAll('.masonry').forEach(g => {
      const row = g.querySelector(':scope > .mrow');
      if (row && (row.children.length !== colsOf(g) || row.style.gap !== gapOf(g))) reflow(g);
    }), 150);
  });

  // A full-width element (e.g. the "Looking for something specific?" band) after the n-th card:
  // the rows split there, so it spans the grid instead of landing inside a column
  window.masonryBreakAfter = function (grid, n, el) {
    const row = grid.querySelector(':scope > .mrow');
    if (!row) { grid.appendChild(el); return; }
    const cards = [...row.querySelectorAll(':scope > .mcol > *')].sort((a, b) => a._mseq - b._mseq);
    const a = newRow(grid), b = newRow(grid);
    cards.forEach((c, i) => place(i < n ? a : b, c));
    row.replaceWith(a);
    a.after(el);
    if (b.querySelector('.mcol > *')) el.after(b);
  };
  // Cards of a grid in reading order (for ‹ › on a card's detail page)
  window.masonryCards = grid => [...grid.querySelectorAll('.card')].sort((a, b) => (a._mseq ?? 0) - (b._mseq ?? 0));
})();
