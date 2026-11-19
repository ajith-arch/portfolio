/* Contact card: headline fills with scroll, email copies with fill feedback,
   "Ajith" cursor drifts, "You" cursor follows the visitor's pointer. */
(function () {
  'use strict';
  var root = document.querySelector('[data-contact]');
  if (!root) return;
  var card = root.querySelector('.cx-card'), title = root.querySelector('.cx-title');
  var me = root.querySelector('.cx-cur--me'), you = root.querySelector('.cx-cur--you'), meLabel = me.querySelector('b');
  var copyBtn = root.querySelector('.cx-copy');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EMAIL = copyBtn.getAttribute('data-email');

  /* headline fill */
  function fill() {
    var r = title.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.92 - r.top) / (vh * 0.5);
    title.style.setProperty('--fill', Math.max(0, Math.min(1, p)).toFixed(3));
  }
  if (reduce) title.style.setProperty('--fill', 1); else { window.addEventListener('scroll', fill, { passive: true }); window.addEventListener('resize', fill); fill(); }

  /* copy email */
  var timer;
  copyBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var done = function () {
      copyBtn.classList.add('is-done'); me.classList.add('is-say'); meLabel.textContent = 'Talk soon!';
      clearTimeout(timer);
      timer = setTimeout(function () { copyBtn.classList.remove('is-done'); me.classList.remove('is-say'); meLabel.textContent = 'Ajith'; }, 2400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(done, function () { location.href = 'mailto:' + EMAIL; });
    else location.href = 'mailto:' + EMAIL;
  });

  /* cursors */
  var W = 0, H = 0;
  function size() { W = card.clientWidth; H = card.clientHeight; }
  size(); window.addEventListener('resize', size);
  var m = { x: 0, y: 0 }, y = { x: 0, y: 0, tx: 0, ty: 0 }, hover = false, running = false, last = 0, visible = false;
  function homeYou() { return { x: W * (W < 700 ? .62 : .78), y: H * (W < 700 ? .84 : .52) }; }
  function frame(now) {
    if (!running) return;
    var t = now / 1000, dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    var narrow = W < 700;
    m.x = W * (narrow ? .12 : .17) + Math.sin(t * .7) * (narrow ? 14 : 34) + Math.sin(t * 1.9) * 6;
    m.y = H * (narrow ? .06 : .5) + Math.cos(t * .9) * (narrow ? 10 : 22);
    if (!hover) { var h = homeYou(); y.tx = h.x + Math.sin(t * .8 + 2) * (narrow ? 12 : 26); y.ty = h.y + Math.cos(t * 1.1) * 16; }
    var a = 1 - Math.exp(-dt * (hover ? 10 : 3));
    y.x += (y.tx - y.x) * a; y.y += (y.ty - y.y) * a;
    me.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,' + m.y.toFixed(1) + 'px,0)';
    you.style.transform = 'translate3d(' + y.x.toFixed(1) + 'px,' + y.y.toFixed(1) + 'px,0)';
    requestAnimationFrame(frame);
  }
  function play() { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(frame); }
  function pause() { running = false; }
  var h0 = homeYou(); y.x = y.tx = h0.x; y.y = y.ty = h0.y;
  m.x = W * .17; m.y = H * .5;
  me.style.transform = 'translate3d(' + m.x + 'px,' + m.y + 'px,0)';
  you.style.transform = 'translate3d(' + y.x + 'px,' + y.y + 'px,0)';

  if (fine) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(); hover = true;
      y.tx = e.clientX - r.left + 14; y.ty = e.clientY - r.top + 14;
    });
    card.addEventListener('pointerleave', function () { hover = false; });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; visible ? play() : pause(); }); }).observe(card);
  } else play();
})();
