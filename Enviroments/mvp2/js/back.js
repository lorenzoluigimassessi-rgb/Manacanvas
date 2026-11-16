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

  // Where you are, as far as back is concerned: the card, the result / Categories page, Pull's layer
  function key() {
    if (!inside()) return 'root';
    try {
      return [lbOpen(), pullOpen() && ['pull', _pull?.sheet, _pull?.res?.q, _pull?.trail?.length].join(),
        _currentMode, activeSearch, _l3Open() && _l3It?.q, document.getElementById('collectionsLevel2')?.style.display === 'block' && _level2Category,
        _msOpen() && _ms.q].join('|');
    } catch (e) { return 'inside'; }
  }

  // One history entry per step in: each back takes one step out, however deep you went
  // (card → tag → card → …). Browsers skip entries added without a tap or key press, so a step is
  // only added right after one; changes that happen on their own just update the current step.
  let rootTimer = null, tapped = 0, stack = [key()], skip = 0, here = location.pathname + location.search;
  function reconcile() {
    const gesture = Date.now() - tapped < 1000; // a step in made within a second of a tap or key press
    here = location.pathname + location.search;
    const k = key(), n = stack.length;
    if (k === stack[n - 1]) return;
    if (n > 1 && k === stack[n - 2]) { stack.pop(); skip++; history.back(); return; } // stepped back in the app
    if (k === 'root') { // all the way out, once it holds (a tag tapped on a card passes through "nothing open" on its way)
      clearTimeout(rootTimer);
      rootTimer = setTimeout(() => { if (key() === 'root' && stack.length > 1) { const m = stack.length - 1; stack = ['root']; skip++; history.go(-m); } }, 500);
      return;
    }
    if (gesture) { history.pushState({ mcBack: stack.length }, ''); stack.push(k); }
    else stack[n - 1] = k;
  }
  const onGesture = () => { tapped = Date.now(); reconcile(); setTimeout(reconcile, 300); }; // now, and once the page it opened is up
  window.addEventListener('click', onGesture);
  window.addEventListener('keydown', onGesture);
  window.addEventListener('popstate', () => {
    history.replaceState(null, '', here); // the address stays on this page; the step back updates it if it moves
    if (skip) { skip--; return; }
    if (stack.length > 1) stack.pop();
    if (inside()) appBack();
    setTimeout(() => { // settle: line the steps up with where the step back landed
      const k = key();
      if (k === 'root' && stack.length > 1) { const n = stack.length - 1; stack = ['root']; skip++; history.go(-n); }
      else stack[stack.length - 1] = k;
    }, 250);
  });
  let queued = false;
  new MutationObserver(() => { if (!queued) { queued = true; setTimeout(() => { queued = false; reconcile(); }, 120); } })
    .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
})();
