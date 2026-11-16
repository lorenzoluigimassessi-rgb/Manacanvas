// Browser / phone back does what the app's own back does: close the card, step back in Pull,
// leave a result or Categories page. Only at a tab's top level does it leave the site.
(function () {
  const lbOpen = () => !!document.querySelector('#lightbox .lightbox');
  const pullOpen = () => document.getElementById('drawRitual')?.style.display !== 'none';
  const subHead = () => typeof _activeHead === 'function' ? _activeHead() : null;
  const inside = () => lbOpen() || pullOpen() || !!subHead();

  function appBack() {
    if (lbOpen()) return document.getElementById('lbClose')?.click();
    if (pullOpen()) {
      if (_pull?.sheet) _pullSheet(false); else if (_pull?.res) pullBack(); else closeDrawRitual();
      return;
    }
    subHead()?.querySelector('.l2-back')?.click();
  }

  // One extra history entry stands in for "inside something"; back consumes it and we step back in-app
  let guard = false, skip = null, queued = false, here = location.pathname + location.search;
  function sync() {
    queued = false;
    here = location.pathname + location.search;
    const want = inside();
    if (want && !guard) { history.pushState({ mcBack: 1 }, ''); guard = true; }
    else if (!want && guard) { guard = false; skip = here; history.back(); } // closed in-app: drop the spare entry, keep the address
  }
  window.addEventListener('popstate', () => {
    if (skip !== null) { history.replaceState(null, '', skip); skip = null; return; }
    guard = false;
    history.replaceState(null, '', here); // the address stays on this page; the step back updates it if it moves
    if (inside()) appBack();
    setTimeout(sync, 120); // still inside something (e.g. the result page under a card): arm again
  });
  new MutationObserver(() => { if (!queued) { queued = true; setTimeout(sync, 120); } })
    .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
})();
