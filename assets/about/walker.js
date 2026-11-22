/* Know Me walker: flips the look every ~1.1s (like the two26 hero video),
   pauses when off screen or in a background tab, and stays still in one
   look for reduced motion. */
(function () {
  'use strict';
  var wk = document.getElementById('kxWalker');
  if (!wk) return;
  var looks = ['line', 'orange', 'real', 'pixel', 'paper'];
  var dots = wk.querySelectorAll('.wk__looks i');
  var i = 0, timer = 0, visible = true;

  function show(n) {
    i = n % looks.length;
    wk.setAttribute('data-look', looks[i]);
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { show(2); return; }

  function tick() { show(i + 1); }
  function start() { if (!timer && visible && !document.hidden) timer = setInterval(tick, 1100); wk.classList.remove('is-paused'); }
  function stop() { clearInterval(timer); timer = 0; wk.classList.add('is-paused'); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.05 }).observe(wk);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  show(0);
  start();
})();
