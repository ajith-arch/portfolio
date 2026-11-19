/* Adobe Campaign Readiness showcase card.
   A cursor walks the real case-study prototype (screenshots captured from it, with click targets
   measured from its own guided-tour selectors). Coordinates are in the prototype's 1600 x 1000 space.
   Motion model: one rAF loop; the cursor follows scripted eased paths, the camera follows the cursor
   with a critically damped lag at one steady zoom (no zoom in/out per step). Transforms only. */
(function () {
  'use strict';
  var root = document.querySelector('.sc[data-showcase]');
  if (!root) return;

  var BASE = root.getAttribute('data-frames');
  var W = 1600, H = 1000;
  var STEPS = [
    { f: 's0', x: 1199, y: 460, tip: 'Open full view',       cap: '3 days to launch · 78% ready. Where is the risk?' },
    { f: 's1', x: 1378, y: 946, tip: 'Open blocker queue',   cap: 'France · TikTok is the one blocked path' },
    { f: 's2', x: 1502, y: 906, tip: 'Investigate',          cap: 'Ranked first by launch risk, due today' },
    { f: 's3', x: 1481, y: 968, tip: 'Review change impact', cap: 'Root cause: the “Save $100” claim needs legal review' },
    { f: 's4', x: 1484, y: 893, tip: 'Submit for review',    cap: 'One claim change, every experience classified' },
    { f: 's5', x: 1500, y: 906, tip: 'Send for review',      cap: 'Route the review with campaign context attached' },
    { f: 's6', x:  957, y: 720, tip: 'Send to Adobe Review', cap: 'Add a note for Regional Legal and send' }
  ];
  var END = { f: 'end', x: 800, y: 930, cap: 'Sent. The blocker is now with its owner' };
  var N = STEPS.length + 1;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var stage = root.querySelector('.sc-stage');
  var cam = root.querySelector('.sc-cam');
  var cursor = root.querySelector('.sc-cursor');
  var tip = root.querySelector('.sc-tip');
  var ripple = root.querySelector('.sc-ripple');
  var capNum = root.querySelector('.sc-step b');
  var capTxt = root.querySelector('.sc-step span');
  var bar = root.querySelector('.sc-bar i');

  /* ---------- frames: load + decode ahead of time ---------- */
  var imgs = {}, ready = {};
  [].forEach.call(cam.querySelectorAll('img'), function (im) { imgs[im.getAttribute('data-f')] = im; });
  ready.s0 = Promise.resolve();
  function ensure(name) {
    if (!ready[name]) {
      var im = imgs[name];
      if (!im.getAttribute('src')) im.src = BASE + name + '.webp';
      ready[name] = (im.decode ? im.decode() : Promise.resolve()).catch(function () {});
    }
    return ready[name];
  }
  function preloadAll() { Object.keys(imgs).forEach(ensure); }
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 400); };
  if (document.readyState === 'complete') idle(preloadAll); else window.addEventListener('load', function () { idle(preloadAll); });

  var zi = 1, current = 's0';
  function show(name, quick) {
    var im = imgs[name]; if (!im || name === current) return;
    var prev = imgs[current]; current = name;
    im.style.zIndex = ++zi;
    im.classList.toggle('is-quick', !!quick);
    im.classList.add('is-on');
    setTimeout(function () { if (imgs[current] !== prev) prev.classList.remove('is-on'); }, quick ? 160 : 340);
  }

  /* ---------- geometry (cached; no layout reads per frame) ---------- */
  var sw = stage.clientWidth, sh = stage.clientHeight;
  if ('ResizeObserver' in window) new ResizeObserver(function () { sw = stage.clientWidth; sh = stage.clientHeight; }).observe(stage);
  else window.addEventListener('resize', function () { sw = stage.clientWidth; sh = stage.clientHeight; });
  function coverK() { return Math.max(sw / W, sh / H); }
  function staticK() { var narrow = window.innerWidth <= 768; var vis = narrow ? sw : sw * 0.806; return Math.max(vis / 1050, sh / H); }
  var LIVE_ZOOM = 1.32;

  /* ---------- state ---------- */
  var live = false;
  var c = { x: 0, y: 0, k: 0 };          // camera (centre in image px, scale)
  var cur = { x: 760, y: 520 };          // cursor in image px
  var t = { x: 0, y: 0, k: 0 };          // camera target
  c.k = t.k = staticK();

  function clampT(k, cx, cy) {
    var tx = sw / 2 - cx * k, ty = sh * 0.5 - cy * k;
    return { tx: Math.min(0, Math.max(sw - W * k, tx)), ty: Math.min(0, Math.max(sh - H * k, ty)) };
  }
  var lastTs = 0, running = false, needFrames = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000); lastTs = ts;
    if (live) { t.k = coverK() * LIVE_ZOOM; t.x = cur.x; t.y = cur.y + 40; }
    else { t.k = staticK(); t.x = 0; t.y = 0; }
    var a = 1 - Math.exp(-dt * (live ? 3.4 : 5));
    var ak = 1 - Math.exp(-dt * (live ? 2.6 : 5));
    c.x += (t.x - c.x) * a; c.y += (t.y - c.y) * a; c.k += (t.k - c.k) * ak;
    var p = clampT(c.k, c.x, c.y);
    cam.style.transform = 'translate3d(' + p.tx.toFixed(2) + 'px,' + p.ty.toFixed(2) + 'px,0) scale(' + c.k.toFixed(5) + ')';
    var px = p.tx + cur.x * c.k, py = p.ty + cur.y * c.k;
    cursor.style.transform = 'translate3d(' + (px - 3).toFixed(1) + 'px,' + (py - 3).toFixed(1) + 'px,0)';
    cursor.classList.toggle('tip-up', py > sh - 64);
    cursor.classList.toggle('tip-left', px > sw - 200);
    cursor._px = px; cursor._py = py;
    var settled = Math.abs(t.k - c.k) < 1e-4 && Math.abs(t.x - c.x) < .3 && Math.abs(t.y - c.y) < .3;
    if (live || !settled || needFrames-- > 0) requestAnimationFrame(frame); else { running = false; lastTs = 0; }
  }
  function kick() { if (!running) { running = true; lastTs = 0; requestAnimationFrame(frame); } }
  window.addEventListener('resize', function () { needFrames = 4; kick(); });
  c.k = staticK(); kick();

  /* ---------- timeline ---------- */
  var gen = 0;
  function Stop() {}
  function wait(ms, g) { return new Promise(function (res, rej) { setTimeout(function () { g === gen ? res() : rej(new Stop()); }, ms); }); }
  function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function glide(x, y, ms, g) {
    var ax = cur.x, ay = cur.y, dx = x - ax, dy = y - ay, d = Math.hypot(dx, dy) || 1, bend = Math.min(70, d * .12);
    return new Promise(function (res, rej) {
      var t0 = performance.now();
      (function step(now) {
        if (g !== gen) return rej(new Stop());
        var p = Math.min(1, (now - t0) / ms), e = ease(p), arc = Math.sin(Math.PI * e) * bend;
        cur.x = ax + dx * e - (dy / d) * arc; cur.y = ay + dy * e + (dx / d) * arc;
        p < 1 ? requestAnimationFrame(step) : res();
      })(t0);
    });
  }
  function click() {
    cursor.classList.add('is-press');
    ripple.style.left = cursor._px + 'px'; ripple.style.top = cursor._py + 'px';
    ripple.classList.remove('is-go'); void ripple.offsetWidth; ripple.classList.add('is-go');
    setTimeout(function () { cursor.classList.remove('is-press'); }, 150);
  }
  function caption(i, text) {
    capTxt.classList.add('is-swap');
    setTimeout(function () { capNum.textContent = (i + 1) + '/' + N; capTxt.textContent = text; capTxt.classList.remove('is-swap'); }, 180);
    bar.style.transition = 'transform .6s cubic-bezier(.2,.75,.15,1)';
    bar.style.transform = 'scaleX(' + ((i + 1) / N).toFixed(3) + ')';
  }

  async function run(g) {
    preloadAll();
    while (true) {
      for (var i = 0; i < STEPS.length; i++) {
        var s = STEPS[i], next = STEPS[i + 1] || END;
        caption(i, s.cap);
        ensure(s.f + 'h'); ensure(next.f);
        await wait(i === 0 ? 250 : 500, g);
        await glide(s.x, s.y, 1150, g);
        await ensure(s.f + 'h');
        tip.textContent = s.tip; cursor.classList.add('is-tip');
        show(s.f + 'h', true);
        await wait(480, g);
        click();
        await wait(220, g);
        await ensure(next.f);
        cursor.classList.remove('is-tip');
        show(next.f);
        await wait(650, g);
      }
      caption(STEPS.length, END.cap);
      await glide(END.x - 90, END.y - 120, 1100, g);
      await wait(2300, g);
      bar.style.transition = 'transform .5s ease'; bar.style.transform = 'scaleX(0)';
      show('s0');
      await glide(760, 520, 1000, g);
    }
  }

  function start() {
    if (reduce || live) return;
    var g = ++gen;
    live = true;
    root.classList.add('is-live');
    kick();
    run(g).catch(function (e) { if (!(e instanceof Stop)) throw e; });
  }
  function stop() {
    if (!live) return;
    ++gen; live = false;
    root.classList.remove('is-live');
    cursor.classList.remove('is-tip');
    bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
    show('s0');
    kick();
  }

  if (fineHover) {
    root.addEventListener('mouseenter', start);
    root.addEventListener('mouseleave', stop);
    root.addEventListener('pointerenter', function () { preloadAll(); }, { once: true });
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.55 }).observe(root);
  }
  root.addEventListener('focus', start);
  root.addEventListener('blur', stop);
})();
