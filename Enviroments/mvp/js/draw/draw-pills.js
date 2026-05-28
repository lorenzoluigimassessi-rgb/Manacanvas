// draw-pills.js — mobile floating pill + desktop header pill

(function () {
  let lastY = 0;
  let scrollTimer = null;

  function init() {
    const mobile  = document.getElementById('drawPillMobile');
    const desktop = document.getElementById('drawPillDesktop');

    if (mobile) {
      mobile.classList.add('visible');
      mobile.querySelector('button').addEventListener('click', enterDrawMode);

      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y > lastY + 10)      mobile.classList.add('scroll-hidden');
        else if (y < lastY - 5)  mobile.classList.remove('scroll-hidden');
        lastY = y;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => mobile.classList.remove('scroll-hidden'), 400);
      }, { passive: true });
    }

    if (desktop) {
      desktop.addEventListener('click', enterDrawMode);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();
})();
