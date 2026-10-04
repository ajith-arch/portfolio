(function () {
  "use strict";

  var STORAGE_KEY = "acr-theme";

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    var next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}

    var meta = document.getElementById("meta-theme-color");
    if (meta) {
      var styles = getComputedStyle(document.documentElement);
      var color = styles.getPropertyValue("--theme-meta").trim();
      meta.setAttribute("content", color || (next === "dark" ? "#111214" : "#fafaf9"));
    }

    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-theme-set") === next ? "true" : "false"
      );
    });
  }

  document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(btn.getAttribute("data-theme-set"));
    });
  });

  setTheme(getTheme());

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  document.querySelectorAll(".cells[data-cells]").forEach(function (grid) {
    var total = Number(grid.getAttribute("data-cells")) || 0;
    var missing = Number(grid.getAttribute("data-missing"));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < total; i++) {
      var cell = document.createElement("i");
      if (i === missing) cell.className = "is-missing";
      frag.appendChild(cell);
    }
    grid.appendChild(frag);
  });

  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[role='tab']"));
    var current = 0;
    function select(i, focus) {
      var dir = i > current ? "is-in-next" : "is-in-prev";
      var changed = i !== current;
      current = i;
      tabs.forEach(function (tab, j) {
        var on = i === j;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
      });
      if (changed) {
        var panel = document.getElementById(tabs[i].getAttribute("aria-controls"));
        panel.classList.remove("is-in-next", "is-in-prev");
        void panel.offsetWidth;
        panel.classList.add(dir);
      }
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        var n = tabs.length;
        if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % n, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + n) % n, true); }
      });
    });
    document.querySelectorAll("[data-evo-open]").forEach(function (link) {
      link.addEventListener("click", function () {
        select(Number(link.getAttribute("data-evo-open")) - 1);
      });
    });
  });

  document.querySelectorAll("[data-proto]").forEach(function (proto) {
    var stage = proto.querySelector("[data-proto-stage]");
    var start = proto.querySelector("[data-proto-start]");
    if (!stage || !start) return;

    start.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.className = "proto__frame";
      frame.title = "Interactive Project Nova prototype";
      frame.src = "prototype/readiness.html?tour=1";
      stage.appendChild(frame);
      proto.classList.add("is-live");

      function fit() {
        frame.style.transform = "scale(" + stage.clientWidth / 1440 + ")";
      }
      fit();
      if ("ResizeObserver" in window) {
        new ResizeObserver(fit).observe(stage);
      } else {
        window.addEventListener("resize", fit);
      }
      frame.addEventListener("load", function () { frame.focus({ preventScroll: true }); });
    });
  });

  var links = document.querySelectorAll(".case-nav__link[href^='#']");
  var sections = [];
  links.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    var section = document.getElementById(id);
    if (section) sections.push({ id: id, el: section, link: link });
  });

  function setActive() {
    var y = window.scrollY + 120;
    var current = null;
    sections.forEach(function (s) {
      if (s.el.offsetTop <= y) current = s;
    });
    links.forEach(function (l) {
      l.classList.remove("is-active");
    });
    if (current) current.link.classList.add("is-active");
  }

  if (sections.length) {
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  function openZoom(src, alt) {
    if (document.querySelector(".acr-zoom-viewer")) return;

    var viewer = document.createElement("div");
    viewer.className = "acr-zoom-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Full-size image");

    var stage = document.createElement("div");
    stage.className = "acr-zoom-viewer__stage";

    var big = document.createElement("img");
    big.className = "acr-zoom-viewer__img";
    big.src = src;
    big.alt = alt || "";
    stage.appendChild(big);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "acr-zoom-viewer__close";
    close.setAttribute("aria-label", "Close full-size image");
    close.textContent = "×";

    var hint = document.createElement("p");
    hint.className = "acr-zoom-viewer__hint";
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    hint.textContent = finePointer
      ? "Move to pan · Click or Esc to close"
      : "Drag to explore · Tap × to close";

    viewer.appendChild(stage);
    viewer.appendChild(close);
    viewer.appendChild(hint);
    document.body.appendChild(viewer);

    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    function shut() {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      viewer.remove();
    }

    function onKey(e) {
      if (e.key === "Escape") shut();
    }

    if (finePointer) {
      stage.addEventListener("mousemove", function (e) {
        var maxX = stage.scrollWidth - stage.clientWidth;
        var maxY = stage.scrollHeight - stage.clientHeight;
        stage.scrollLeft = (e.clientX / stage.clientWidth) * maxX;
        stage.scrollTop = (e.clientY / stage.clientHeight) * maxY;
      });
      stage.addEventListener("click", shut);
      big.addEventListener("load", function () {
        big.style.width = Math.max(big.naturalWidth / 2, stage.clientWidth) + "px";
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
        stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
      });
    }

    close.addEventListener("click", function (e) {
      e.stopPropagation();
      shut();
    });
    document.addEventListener("keydown", onKey);
    close.focus();
  }

  document.querySelectorAll(".acr-zoom").forEach(function (button) {
    var img = button.querySelector("img");
    var hint = document.createElement("span");
    hint.className = "acr-tap-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "Tap to enlarge";
    button.insertAdjacentElement("afterend", hint);

    button.addEventListener("click", function () {
      openZoom(button.getAttribute("data-zoom"), img ? img.alt : "");
    });
  });
})();
