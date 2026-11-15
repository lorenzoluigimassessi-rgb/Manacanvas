// The address bar follows the page you're on, so a copied link (or a reload) opens the same page:
//   ?p=gallery[&lens=moods&sub=dark | &q=…&t=…&k=…]   Gallery tab, or a search shown in the Gallery
//   ?p=categories[&cat=sets][&q=…&t=…&k=…&sort=…]      Categories, a section, a page inside it
//   ?p=discover[&q=…&t=…&k=…&sort=…]                   Discover and its results (phones)
//   ?p=pull · ?p=about                                 + &card=<id> while a card's detail page is open
// The URL is replaced, never pushed: in-app back arrows keep their own trails.
(function () {
  const $ = id => document.getElementById(id);
  const pullOpen = () => $('drawRitual') && $('drawRitual').style.display !== 'none';
  const lbOpen = () => !!document.querySelector('#lightbox .lightbox');

  function routeNow() {
    const p = new URLSearchParams();
    const put = (q, t, k, sort) => { p.set('q', q); if (t) p.set('t', t); if (k) p.set('k', k); if (sort && sort !== 'random') p.set('sort', sort); };
    const m = _currentMode;
    if (pullOpen()) p.set('p', 'pull');
    else if (m === 'gallery') {
      p.set('p', 'gallery');
      if (activeSearch && _searchMeta) put(activeSearch, _searchMeta.label, _searchMeta.tag);
      else {
        let l = {}; try { l = JSON.parse(localStorage.getItem('mc_lens')) || {}; } catch (e) {}
        const sub = l.sub && typeof l.sub === 'object' ? l.sub.code : l.sub;
        if (l.lens && l.lens !== 'picks') { p.set('lens', l.lens); if (sub) p.set('sub', sub); }
      }
    } else if (m === 'collections') {
      p.set('p', 'categories');
      if (_l3Open() && _l3It) { if (_l3It.cat) p.set('cat', _l3It.cat); put(_l3It.q, _l3It.name, _l3It.kind, _l3Sort); }
      else if (_level2Category) p.set('cat', _level2Category);
    } else if (m === 'search') {
      p.set('p', 'discover');
      if (_msOpen() && _ms.meta) put(_ms.q, _ms.meta.label, _ms.meta.tag, _ms.sort);
    } else if (m === 'about') p.set('p', 'about');
    if (lbOpen() && currentCard) p.set('card', currentCard.id);
    const url = location.pathname + (p.toString() ? '?' + p : '');
    if (url !== location.pathname + location.search) history.replaceState(null, '', url);
  }
  let queued = false;
  const sync = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; routeNow(); }, 0); };

  // Every navigation goes through one of these: after each, the address bar catches up
  ['setMode', 'applyLensQuery', 'runSearch', 'clearSearchPill', 'openCollectionsLevel2', 'closeCollectionsLevel2',
   'openDetailPage', 'closeDetailPage', 'loadDetailFeed', 'openSearchResults', 'closeSearchResults', 'setSearchResultsSort',
   'openLightbox', 'closeLightbox', 'renderCardInfo', 'triggerDrawRitual', 'closeDrawRitual'].forEach(n => {
    const f = window[n];
    if (typeof f !== 'function') return;
    window[n] = function () { const r = f.apply(this, arguments); sync(); return r; };
  });

  // ── Boot: open the page the link names (no link → the section you were last in, as before) ──
  const u = new URLSearchParams(location.search);
  const page = u.get('p'), q = u.get('q'), t = u.get('t') || q, k = u.get('k') || '', sort = u.get('sort') || 'random';
  const cat = u.get('cat'), card = u.get('card');
  const saved = localStorage.getItem('mc_mode');
  if (page && page !== 'categories') _bootCatNav = null; // a link elsewhere: Categories opens fresh later
  try {
    if (page === 'gallery') {
      const lens = u.get('lens');
      if (lens && !q) { const sub = u.get('sub'); localStorage.setItem('mc_lens', JSON.stringify({ lens, sub: lens === 'new' && sub ? { code: sub } : sub })); }
      else if (!q) localStorage.setItem('mc_lens', JSON.stringify({ lens: 'picks', sub: null }));
      localStorage.setItem('mc_mode', 'gallery');
      setMode('gallery');
      if (q) runSearch(q, t, k);
    } else if (page === 'categories') {
      localStorage.setItem('mc_mode', 'collections');
      const nav = {};
      if (cat) nav.l2 = { cat };
      if (q) nav.l3 = { it: { name: t, q, cat: cat || undefined, kind: k || undefined }, from: cat ? 'l2' : 'l1', sort };
      _bootCatNav = nav;
      setMode('collections');
    } else if (page === 'discover' && isMobile()) {
      setMode('search');
      if (q) openSearchResults(q, t, k, undefined, sort);
    } else if (page === 'discover' && q) { // Discover is a phone page: on a computer the search shows in the Gallery
      setMode('gallery'); runSearch(q, t, k);
    } else if (page === 'about') setMode('about');
    else if (page === 'pull') { setMode(saved === 'collections' ? 'collections' : 'gallery'); triggerDrawRitual(); }
    else setMode(saved === 'gallery' || saved === 'collections' ? saved : 'home');
  } catch (e) { setMode('home'); }

  // A card in the link opens over its page (on its own: no ‹ ›); a bare ?card= link closes to the Gallery
  if (card && /^[0-9a-f-]{36}$/i.test(card) && page !== 'pull') {
    fetch(`https://api.scryfall.com/cards/${card}`).then(r => r.ok ? r.json() : null)
      .then(c => { if (c && c.object === 'card') openLightbox(c, 'shared'); }).catch(() => {});
  }
  sync();
})();
