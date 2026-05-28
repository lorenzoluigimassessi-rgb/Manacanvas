// shimmer.js — edge shimmer on card load + parallax on idle

function playShimmer(colors) {
  const el = document.getElementById('drawShimmer');
  if (!el) return;
  const tint = getShimmerTint(colors);
  el.style.background = `linear-gradient(
    135deg,
    transparent 0%,
    transparent 30%,
    ${tint} 50%,
    transparent 70%,
    transparent 100%
  )`;
  el.style.backgroundSize = '200% 200%';
  el.classList.remove('playing');
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add('playing');
  el.addEventListener('animationend', () => el.classList.remove('playing'), { once: true });
}

// Parallax — art shifts toward cursor, gradient shifts away
let parallaxActive = false;
let parallaxRAF = null;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

function startParallax() {
  parallaxActive = true;
  window.addEventListener('mousemove', onParallaxMouse);
  parallaxLoop();
}

function stopParallax() {
  parallaxActive = false;
  window.removeEventListener('mousemove', onParallaxMouse);
  cancelAnimationFrame(parallaxRAF);
  const art = document.getElementById('drawArt');
  const grad = document.getElementById('drawGradient');
  if (art) art.style.transform = '';
  if (grad) grad.style.transform = '';
}

function onParallaxMouse(e) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  // Normalise to -1..1
  targetX = (e.clientX - cx) / cx;
  targetY = (e.clientY - cy) / cy;
}

function parallaxLoop() {
  if (!parallaxActive) return;
  // Lerp toward target
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  const artShift = 5; // px
  const gradShift = 2;

  const art = document.getElementById('drawArt');
  const grad = document.getElementById('drawGradient');
  if (art) art.style.transform = `translate(${currentX * artShift}px, ${currentY * artShift}px)`;
  if (grad) grad.style.transform = `translate(${-currentX * gradShift}px, ${-currentY * gradShift}px)`;

  parallaxRAF = requestAnimationFrame(parallaxLoop);
}

// Gyroscope parallax (mobile) — requested after 3 swipes
let gyroEnabled = false;

function tryEnableGyro() {
  if (gyroEnabled) return;
  if (typeof DeviceOrientationEvent === 'undefined') return;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+
    DeviceOrientationEvent.requestPermission().then(state => {
      if (state === 'granted') attachGyro();
    }).catch(() => {});
  } else {
    attachGyro();
  }
  gyroEnabled = true;
}

function attachGyro() {
  window.addEventListener('deviceorientation', (e) => {
    if (!parallaxActive) return;
    targetX = Math.max(-1, Math.min(1, (e.gamma || 0) / 20));
    targetY = Math.max(-1, Math.min(1, (e.beta  || 0) / 20));
  });
}
