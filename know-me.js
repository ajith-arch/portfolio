(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = window.matchMedia("(min-width: 1024px)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var header = document.querySelector(".header");
  var hero = document.querySelector("[data-hero]");
  var title = document.querySelector("[data-split]");
  var eyebrow = document.querySelector(".ab-hero__eyebrow");
  var context = document.querySelector(".ab-hero__context");
  var dark = document.querySelector("[data-dark]");
  var grid = document.querySelector(".ab-grid");

  /* Palettes: each theme has a resting state and a dark-section state. */
  var PALETTES = {
    light: {
      base: { bg: "#f6f4ef", fg: "#17171a", fg2: "#55555c", accent: "#d97706", blue: "#025eba" },
      dark: { bg: "#141416", fg: "#f3f2ee", fg2: "#a7a7ad", accent: "#f59e0b", blue: "#8ea8ff" }
    },
    dark: {
      base: { bg: "#111215", fg: "#efeee9", fg2: "#a3a3a9", accent: "#f59e0b", blue: "#8ea8ff" },
      dark: { bg: "#060607", fg: "#f3f2ee", fg2: "#a7a7ad", accent: "#f59e0b", blue: "#8ea8ff" }
    }
  };

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); });
  }

  function css(c) { return "rgb(" + c.join(",") + ")"; }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function themeKey() { return "light"; }

  var body = document.body;
  var lastTone = -1;
  var lastTheme = "";

  function applyTone(t) {
    var key = themeKey();
    if (Math.abs(t - lastTone) < 0.002 && key === lastTheme) return;
    lastTone = t;
    lastTheme = key;
    var p = PALETTES[key];
    var c = {};
    var tone = t * t * (3 - 2 * t);
    var ink = clamp((t - 0.48) / 0.12);
    ["bg", "fg", "fg2", "accent", "blue"].forEach(function (k) {
      c[k] = mix(rgb(p.base[k]), rgb(p.dark[k]), k === "bg" ? tone : ink);
    });
    var line = mix(c.bg, c.fg, 0.13);
    body.style.setProperty("--ab-bg", css(c.bg));
    body.style.setProperty("--ab-bg-rgb", c.bg.join(","));
    body.style.setProperty("--ab-fg", css(c.fg));
    body.style.setProperty("--ab-fg2", css(c.fg2));
    body.style.setProperty("--ab-line", css(line));
    body.style.setProperty("--ab-accent", css(c.accent));
    body.style.setProperty("--ab-blue", css(c.blue));
  }

  /* Headline: split into rendered lines so each line can rise on load. */
  function splitTitle(animate) {
    if (!title) return;
    var text = title.getAttribute("data-text") || title.textContent.trim();
    title.setAttribute("data-text", text);
    var words = text.split(/\s+/);
    title.innerHTML = words.map(function (w) { return '<span class="ab-w">' + w + "</span>"; }).join(" ");
    var lines = [];
    var top = null;
    Array.prototype.forEach.call(title.querySelectorAll(".ab-w"), function (el) {
      if (top === null || Math.abs(el.offsetTop - top) > 4) {
        lines.push([]);
        top = el.offsetTop;
      }
      lines[lines.length - 1].push(el.textContent);
    });
    title.innerHTML = lines.map(function (l, i) {
      return '<span class="ab-line"><span class="ab-line__in" style="--i:' + i + '">' + l.join(" ") + "</span></span>";
    }).join(" ");
    title.classList.add("is-split");
    title.classList.toggle("is-static", !animate);
  }

  if (title && !reduce) {
    var start = function () { splitTitle(true); };
    if (document.fonts && document.fonts.ready) {
      var done = false;
      document.fonts.ready.then(function () { if (!done) { done = true; start(); } });
      setTimeout(function () { if (!done) { done = true; start(); } }, 600);
    } else {
      start();
    }
    var lastWidth = window.innerWidth;
    var resizeTimer;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { splitTitle(false); }, 150);
    });
  }

  /* Scroll-linked updates, batched into one frame. */
  var ticking = false;

  function heroMotion(y, vh) {
    if (!hero || reduce || !wide.matches) {
      [title, eyebrow, context].forEach(function (el) {
        if (el) { el.style.transform = ""; el.style.opacity = ""; el.style.color = ""; }
      });
      return;
    }
    var p = clamp(y / (vh * 0.4));
    if (p === 0) {
      title.style.transform = "";
      title.style.opacity = "";
      eyebrow.style.transform = "";
      eyebrow.style.opacity = "";
      context.style.transform = "";
      context.style.color = "";
      return;
    }
    title.style.transform = "translate3d(0," + (-p * 96).toFixed(1) + "px,0)";
    title.style.opacity = (1 - p * 0.92).toFixed(3);
    eyebrow.style.transform = "translate3d(0," + (-p * 48).toFixed(1) + "px,0)";
    eyebrow.style.opacity = (1 - p).toFixed(3);
    context.style.transform = "translate3d(0," + (-p * vh * 0.2).toFixed(1) + "px,0)";
    var key = themeKey();
    var pal = PALETTES[key].base;
    context.style.color = css(mix(rgb(pal.fg2), rgb(pal.fg), p));
  }

  function darkTone(vh) {
    if (!dark) return 0;
    var r = dark.getBoundingClientRect();
    var enter = clamp((vh * 0.9 - r.top) / (vh * 0.5));
    var leave = clamp((r.bottom - vh * 0.1) / (vh * 0.5));
    return Math.min(enter, leave);
  }

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 80);
    heroMotion(y, vh);
    applyTone(darkTone(vh));
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  if (wide.addEventListener) wide.addEventListener("change", requestUpdate);
  new MutationObserver(function () { lastTone = -1; requestUpdate(); })
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  update();

  /* Entrances: groups reveal their [data-rise] children together. */
  var groups = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    groups.forEach(function (g) { g.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    groups.forEach(function (g) { io.observe(g); });
  }

  /* Background grid follows the pointer by a few pixels. */
  if (grid && finePointer && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, moving = false;
    var step = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      grid.style.setProperty("--ab-px", cx.toFixed(2) + "px");
      grid.style.setProperty("--ab-py", cy.toFixed(2) + "px");
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        requestAnimationFrame(step);
      } else {
        moving = false;
      }
    };
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 8;
      ty = (e.clientY / window.innerHeight - 0.5) * 8;
      if (!moving) {
        moving = true;
        requestAnimationFrame(step);
      }
    }, { passive: true });
  }
})();
