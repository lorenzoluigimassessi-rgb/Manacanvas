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

  // One extra history entry stands in for "inside something"; back consumes it and we step back in-app.
  // Browsers skip (on back) entries added without a tap or key press, so the entry is only ever added
  // right after one: added later, the back button would jump straight out of the site.
  let guard = false, skip = null, queued = false, here = location.pathname + location.search;
  function sync(gesture) {
    queued = false;
    here = location.pathname + location.search;
    const want = inside();
    if (want && !guard && gesture) { history.pushState({ mcBack: 1 }, ''); guard = true; }
    else if (!want && guard) { guard = false; skip = here; history.back(); } // closed in-app: drop the spare entry, keep the address
  }
  const onGesture = () => { sync(true); setTimeout(() => sync(true), 300); }; // now, and once the page it opened is up
  window.addEventListener('click', onGesture);
  window.addEventListener('keydown', onGesture);
  window.addEventListener('popstate', () => {
    if (skip !== null) { history.replaceState(null, '', skip); skip = null; return; }
    guard = false;
    history.replaceState(null, '', here); // the address stays on this page; the step back updates it if it moves
    if (inside()) appBack();
    // Still inside something (the result page under a card): armed again by the next tap
  });
  new MutationObserver(() => { if (!queued) { queued = true; setTimeout(() => sync(false), 120); } })
    .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
})();
