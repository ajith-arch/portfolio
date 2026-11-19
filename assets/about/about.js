/* Know Me page: tabbed intro + scroll-driven chapters.
   Transform/opacity only; work is limited to sections near the viewport;
   prefers-reduced-motion shows everything with no movement. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tabs (roving tabindex, arrow keys) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.kx-tab'));
  function select(i, focus) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i, false); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length, to = null;
      if (k === 'ArrowRight') to = (i + 1) % n;
      else if (k === 'ArrowLeft') to = (i - 1 + n) % n;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = n - 1;
      if (to !== null) { e.preventDefault(); select(to, true); }
    });
  });

  /* ---------- Scroll scenes ---------- */
  var body = document.body;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.kx-ch'));
  var gallery = document.querySelector('.kx-hz');
  var track = gallery && gallery.querySelector('.kx-hz__track');
  var scenes = chapters.concat(gallery ? [gallery] : []);
  var defaultBg = getComputedStyle(body).getPropertyValue('--kx-bg').trim() || '#f4f4f2';

  if (reduce) {
    chapters.forEach(function (c) { c.classList.add('is-done'); });
    document.querySelectorAll('.kx-line, .kx-bubbles li').forEach(function (el) { el.classList.add('is-on'); });
  }

  var vh = window.innerHeight, ticking = false, currentBg = '';
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function update() {
    ticking = false;
    var bg = defaultBg;
    for (var s = 0; s < scenes.length; s++) {
      var sec = scenes[s], r = sec.getBoundingClientRect();
      if (r.top < vh * 0.5 && r.bottom > vh * 0.5) bg = sec.getAttribute('data-bg') || defaultBg;
      if (reduce || r.bottom < -vh || r.top > vh * 2) continue;

      var span = Math.max(1, r.height - vh);
      var p = clamp(-r.top / span);

      if (sec === gallery) {
        if (track) {
          var max = Math.max(0, track.scrollWidth - window.innerWidth);
          track.style.setProperty('--hx', (-p * max).toFixed(1) + 'px');
        }
        continue;
      }

      /* lines light up one by one over the first ~60% of the chapter */
      var lines = sec.querySelectorAll('.kx-line');
      var step = 0.6 / Math.max(1, lines.length);
      for (var i = 0; i < lines.length; i++) lines[i].classList.toggle('is-on', p > 0.02 + i * step || (r.top < vh * 0.4 && i === 0));
      sec.classList.toggle('is-done', p > 0.02 + lines.length * step - step * 0.5);

      /* bubbles pop in */
      var bubbles = sec.querySelectorAll('.kx-bubbles li');
      for (var b = 0; b < bubbles.length; b++) bubbles[b].classList.toggle('is-on', p > 0.08 + b * 0.07);

      /* images drift faster than the page for depth */
      var imgs = sec.querySelectorAll('.kx-fly img');
      for (var m = 0; m < imgs.length; m++) {
        var speed = parseFloat(imgs[m].style.getPropertyValue('--s')) || 1.3;
        imgs[m].style.setProperty('--py', (-(speed - 1) * p * r.height * 0.55).toFixed(1) + 'px');
      }
    }
    if (bg !== currentBg) { currentBg = bg; body.style.setProperty('--kx-bg', bg); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  window.addEventListener('load', onScroll);
  update();
})();
