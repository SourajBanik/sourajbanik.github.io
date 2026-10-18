/* Visual motion calibration: identical approximate pixel velocity for
   skill-card border highlights, connector packets, and center-ring outlines.
   Runs locally; no libraries, tracking, external calls, or personal data. */
(() => {
  'use strict';
  const matrix = document.querySelector('.skills-matrix');
  if (!matrix) return;
  const tiles = [...matrix.querySelectorAll('.skill-tile')];
  const paths = [...matrix.querySelectorAll('.skills-network .skills-flow')];
  const rings = [matrix.querySelector('.core-ring.ring-one'), matrix.querySelector('.core-ring.ring-two')];
  const CYCLE_SECONDS = 12;
  const TRAIL_PX = 11;
  let queued = false;

  function roundedRectPerimeter(element) {
    const w = element.offsetWidth, h = element.offsetHeight;
    const r = Math.max(0, parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0);
    // Rounded rectangle: 2(w+h)-8r+2pi*r.
    return 2 * (w + h) - 8 * r + 2 * Math.PI * r;
  }
  function ellipsePerimeter(element) {
    const a = element.offsetWidth / 2, b = element.offsetHeight / 2;
    return Math.PI * (3 * (a + b) - Math.sqrt((3*a + b)*(a + 3*b)));
  }
  function pathVisualLength(element) {
    const total = element.getTotalLength();
    const ctm = element.getScreenCTM();
    if (!total || !ctm) return 0;
    const segments = 48;
    let prev = element.getPointAtLength(0);
    let distance = 0;
    for (let i = 1; i <= segments; i++) {
      const next = element.getPointAtLength(total * i / segments);
      const dx = next.x - prev.x, dy = next.y - prev.y;
      distance += Math.hypot(ctm.a * dx + ctm.c * dy, ctm.b * dx + ctm.d * dy);
      prev = next;
    }
    return distance;
  }
  function calibrate() {
    queued = false;
    if (!tiles.length) return;
    const p = tiles.reduce((sum, tile) => {
      const outline = tile.querySelector('.skill-perimeter-line');
      return sum + (outline ? outline.getTotalLength() : roundedRectPerimeter(tile));
    }, 0) / tiles.length;
    if (p <= 0) return;
    const speed = p / CYCLE_SECONDS;
    const borderTrail = Math.min(10, 100 * TRAIL_PX / p);
    tiles.forEach(tile => tile.querySelectorAll('.skill-perimeter rect').forEach(rect => {
      rect.style.strokeDasharray = `${borderTrail.toFixed(3)} ${(100-borderTrail).toFixed(3)}`;
    }));
    paths.forEach((path, i) => {
      const length = pathVisualLength(path);
      if (length <= 0) return;
      const duration = length / speed;
      const dash = Math.min(33, 100 * TRAIL_PX / length);
      path.style.strokeDasharray = `${dash.toFixed(3)} ${(100-dash).toFixed(3)}`;
      path.style.setProperty('--skills-connector-cycle', `${duration.toFixed(3)}s`);
      // Four packets stay offset from each other, all with the same travel speed.
      path.style.animationDelay = `${(-duration * i / 4).toFixed(3)}s`;
    });
    rings.forEach((ring, i) => {
      if (!ring) return;
      const length = ellipsePerimeter(ring);
      ring.style.setProperty(`--skills-ring-${i===0?'one':'two'}-cycle`, `${(length / speed).toFixed(3)}s`);
    });
    const nexus = matrix.querySelector('.skills-nexus');
    if (nexus) matrix.style.setProperty('--skills-mobile-cycle', `${(75 / speed).toFixed(3)}s`);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(calibrate);
  }
  schedule();
  window.addEventListener('load', schedule, {once:true});
  window.addEventListener('resize', schedule, {passive:true});
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(schedule);
    tiles.forEach(tile => resizeObserver.observe(tile));
    const network = matrix.querySelector('.skills-network');
    if (network) resizeObserver.observe(network);
  }
})();
