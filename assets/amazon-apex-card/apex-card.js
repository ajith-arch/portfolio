/* Amazon APEX showcase card: replays the EX-2048 incident on a loop and adds depth on hover.
   Scenario values come from the APEX case study dataset. */
(function () {
  'use strict';
  var root = document.querySelector('.ax[data-apex]');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var q = function (s) { return root.querySelector(s); };
  var elNow = q('[data-now]'), elMins = q('[data-mins]'), elRing = q('.ax-ring .prog'), elLive = q('[data-live]');
  var elPill = q('.ax-pill'), elOrders = q('[data-orders]'), elOrdersLbl = q('[data-orders-label]'), elFoot = q('.ax-w-foot span');

  var LOOP = 13000;
  var STATES = [
    { at: 0,     pill: 'Critical · Open',  foot: '112 orders at risk · staging 540/hr below pace' },
    { at: 2800,  pill: 'Critical · Open',  foot: 'Comparing 3 strategies, each out of 112 orders' },
    { at: 5800,  pill: 'In progress',      foot: 'Reallocate staging labor · approved 14:36' },
    { at: 10300, pill: 'Outcome recorded', foot: '96 protected · 16 missed · forecast was 98' }
  ];
  /* minutes elapsed since 14:33 at a given loop time (piecewise, eased) */
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function seg(t, a, b, v0, v1) { return v0 + (v1 - v0) * ease(Math.min(1, Math.max(0, (t - a) / (b - a)))); }
  function elapsed(t) {
    if (t < 2800) return seg(t, 0, 2800, 0, 1);
    if (t < 5800) return seg(t, 2800, 5800, 1, 3);
    if (t < 8800) return 3;
    if (t < 10300) return seg(t, 8800, 10300, 3, 42);
    return 42;
  }
  function fmt(m) { var h = 14, mm = 33 + Math.floor(m); h += Math.floor(mm / 60); mm %= 60; return h + ':' + (mm < 10 ? '0' : '') + mm; }

  var state = -1;
  function setState(i) {
    if (i === state) return; state = i;
    var s = STATES[i];
    root.setAttribute('data-s', String(i));
    elPill.textContent = s.pill;
    elFoot.classList.add('swap');
    setTimeout(function () { elFoot.textContent = s.foot; elFoot.classList.remove('swap'); }, 200);
    var done = i === 3;
    elOrders.textContent = done ? '96' : '112';
    elOrdersLbl.textContent = done ? 'Protected' : 'At risk';
  }
  function paint(t) {
    var m = elapsed(t), left = Math.max(0, 42 - Math.round(m));
    elNow.textContent = fmt(m); elLive.textContent = fmt(m);
    elMins.textContent = left;
    elRing.style.strokeDashoffset = (176 * (1 - left / 42)).toFixed(1);
    var i = 0; for (var k = 0; k < STATES.length; k++) if (t >= STATES[k].at) i = k;
    setState(i);
    root.classList.toggle('is-toast', t >= 6300 && t < 8700);
  }

  /* ---------- loop + tilt ---------- */
  var running = false, t0 = 0, pausedAt = 0, visible = false;
  var stageEl = q('.ax-stage'), hot = { x: .6, y: .5, tx: .6, ty: .5 }, drift = !fine, last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    paint((now - t0) % LOOP);
    if (drift) { var s = now / 1000; hot.tx = .5 + Math.sin(s * .45) * .38; hot.ty = .5 + Math.sin(s * .7 + 1) * .32; }
    var a = 1 - Math.exp(-dt * 9);
    hot.x += (hot.tx - hot.x) * a; hot.y += (hot.ty - hot.y) * a;
    stageEl.style.setProperty('--hx', (hot.x * 100).toFixed(2) + '%');
    stageEl.style.setProperty('--hy', (hot.y * 100).toFixed(2) + '%');
    requestAnimationFrame(frame);
  }
  function play() { if (running || reduce) return; running = true; t0 = performance.now() - pausedAt; last = 0; requestAnimationFrame(frame); }
  function pause() { if (!running) return; running = false; pausedAt = (performance.now() - t0) % LOOP; }

  if (!fine) root.classList.add('is-hot');
  if (reduce) { paint(10300); return; }
  paint(0);

  if (fine) {
    root.addEventListener('pointermove', function (e) {
      var r = stageEl.getBoundingClientRect();
      hot.tx = (e.clientX - r.left) / r.width; hot.ty = (e.clientY - r.top) / r.height;
      root.classList.add('is-hot');
    });
    root.addEventListener('pointerleave', function () { root.classList.remove('is-hot'); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; visible ? play() : pause(); }); }, { threshold: 0.2 }).observe(root);
  } else play();
  document.addEventListener('visibilitychange', function () { document.hidden ? pause() : (visible && play()); });
})();
