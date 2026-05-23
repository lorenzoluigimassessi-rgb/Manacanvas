// draw-pills.js — floating mobile pill + desktop header pill behaviour

(function () {
  let lastScrollY = 0;
  let scrollTimer = null;

  function initDrawPills() {
    const mobilePill = document.getElementById('drawPillMobile');
    const desktopPill = document.getElementById('drawPillDesktop');

    if (mobilePill) {
      mobilePill.classList.add('visible');
      mobilePill.querySelector('button').addEventListener('click', enterDrawMode);

      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y > lastScrollY + 10) {
          mobilePill.classList.add('scroll-hidden');
        } else if (y < lastScrollY - 5) {
          mobilePill.classList.remove('scroll-hidden');
        }
        lastScrollY = y;

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => mobilePill.classList.remove('scroll-hidden'), 400);
      }, { passive: true });
    }

    if (desktopPill) {
      desktopPill.classList.add('visible');
      desktopPill.addEventListener('click', enterDrawMode);
    }
  }

  // Init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrawPills);
  } else {
    initDrawPills();
  }
})();
