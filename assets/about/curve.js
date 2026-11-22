/* Services line: draws as the section scrolls by, eased so it glides rather
   than jumps; a dot rides the tip; each stop lights up when the line reaches it.
   Phones use a straight line (scaleY). Reduced motion: fully drawn at once. */
(function () {
  'use strict';
  var section = document.querySelector('.kx-curve');
  if (!section) return;
  var box = section.querySelector('.kx-curve__box');
  var line = section.querySelector('.kx-curve__line');
  var tip = section.querySelector('.kx-curve__tip');
  var stops = Array.prototype.slice.call(section.querySelectorAll('.kx-stop'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 760px)');

  var total = line.getTotalLength();
  line.style.strokeDasharray = total + ' ' + total;
  line.style.strokeDashoffset = total;

  // Length along the path where each stop sits (first pass close to its point).
  var stopLen = stops.map(function (s) {
    var x = parseFloat(s.style.getPropertyValue('--x')), y = parseFloat(s.style.getPropertyValue('--y'));
    for (var l = 0; l <= total; l += 2) {
      var p = line.getPointAtLength(l);
      if (Math.abs(p.x - x) < 6 && Math.abs(p.y - y) < 6) return l;
    }
    return total;
  });

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function render(p) {
    if (phone.matches) {
      box.style.setProperty('--cv-p', p.toFixed(4));
      var boxTop = box.getBoundingClientRect().top, boxH = box.offsetHeight || 1;
      stops.forEach(function (s) {
        var at = (s.getBoundingClientRect().top - boxTop + 24) / boxH;
        s.classList.toggle('is-on', p >= at);
      });
      return;
    }
    var drawn = total * p;
    line.style.strokeDashoffset = (total - drawn).toFixed(1);
    var pt = line.getPointAtLength(Math.max(0.01, drawn));
    tip.setAttribute('cx', pt.x.toFixed(1));
    tip.setAttribute('cy', pt.y.toFixed(1));
    tip.style.opacity = p > 0.003 && p < 0.997 ? '1' : '0';
    stops.forEach(function (s, i) { s.classList.toggle('is-on', drawn >= stopLen[i] - 6); });
  }

  if (reduce) { render(1); return; }

  // Scroll sets a target; the drawn amount eases toward it every frame.
  var target = 0, current = 0, raf = 0, last = 0;
  function measure() {
    var r = box.getBoundingClientRect(), vh = window.innerHeight;
    // Begins when the box top reaches 75% of the screen, completes as its bottom reaches 75%.
    target = clamp((vh * 0.75 - r.top) / Math.max(1, r.height));
  }
  function frame(now) {
    var dt = Math.min(64, last ? now - last : 16.7); last = now;
    var k = 1 - Math.pow(1 - 0.09, dt / 16.7);       // ~9% per 60fps frame, frame-rate independent
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0004) current = target;
    render(current);
    raf = current === target ? 0 : requestAnimationFrame(frame);
    if (!raf) last = 0;
  }
  function kick() { measure(); if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  if (phone.addEventListener) phone.addEventListener('change', kick);
  measure(); current = target; render(current);
})();

/* Brand carousel: duplicate the cards once so the marquee loops seamlessly,
   and set the speed from the strip's width (~60px per second). */
(function () {
  'use strict';
  var track = document.querySelector('.kx-brand__track');
  if (!track) return;
  var originals = Array.prototype.slice.call(track.children);
  originals.forEach(function (li) {
    var copy = li.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach(function (img) { img.alt = ''; });
    track.appendChild(copy);
  });
  function speed() {
    var half = track.scrollWidth / 2;
    if (half > 0) track.style.setProperty('--kx-brand-dur', Math.round(half / 60) + 's');
  }
  window.addEventListener('load', speed);
  window.addEventListener('resize', speed);
  speed();
})();
