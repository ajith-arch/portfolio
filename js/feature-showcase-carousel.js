/**
 * FeatureShowcaseCarousel — reusable Apple-style split layout + horizontal track,
 * images (.webp etc.) and video (.webm, .mp4), single active video playback.
 */
(function (global) {
  'use strict';

  function isVideoFile(file) {
    return /\.(webm|mp4)$/i.test(String(file || ''));
  }

  function resolveSlideUrl(base, file) {
    var rel = String(base || '').replace(/\/?$/, '/') + String(file).replace(/^\//, '');
    try {
      return new URL(rel, window.location.href).href;
    } catch (e) {
      return rel;
    }
  }

  function pad2(num) {
    var s = String(num);
    return s.length < 2 ? '0' + s : s;
  }

  function initFeatureShowcaseCarousel(options) {
    var container = options.container;
    var base = options.base;
    var slides = options.slides || [];
    var labels = options.labels;
    var n = slides.length;
    if (!container || !n) {
      return Promise.resolve();
    }

    if (!labels || labels.length !== n) {
      labels = [];
      for (var li = 0; li < n; li++) {
        labels.push('Detail ' + pad2(li + 1));
      }
    }

    var reduced =
      global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var transitionMs = reduced ? 0 : 480;

    var root = document.createElement('section');
    root.className = 'feature-sc';
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', options.ariaLabel || 'Feature highlights');
    root.tabIndex = 0;

    var inner = document.createElement('div');
    inner.className = 'feature-sc__inner';

    var nav = document.createElement('nav');
    nav.className = 'feature-sc__nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-orientation', 'vertical');

    var stageWrap = document.createElement('div');
    stageWrap.className = 'feature-sc__stage';

    var viewport = document.createElement('div');
    viewport.className = 'feature-sc__viewport';

    var track = document.createElement('div');
    track.className = 'feature-sc__track';

    var dots = document.createElement('div');
    dots.className = 'feature-sc__dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Slides');

    var mediaEls = [];
    var current = 0;
    var dragging = false;
    var startX = 0;
    var dragDx = 0;
    var slideW = 0;

    function setPanelsHidden(active) {
      track.querySelectorAll('.feature-sc__slide').forEach(function (el, j) {
        el.setAttribute('aria-hidden', j === active ? 'false' : 'true');
      });
    }

    function syncVideoPlayback(activeIndex) {
      mediaEls.forEach(function (entry, j) {
        if (!entry || !entry.video) return;
        var v = entry.video;
        if (j === activeIndex) {
          v.preload = 'auto';
          v.muted = true;
          var p = v.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () {});
          }
        } else {
          v.pause();
          try {
            v.currentTime = 0;
          } catch (e) {
            /* ignore */
          }
          v.preload = 'none';
        }
      });
    }

    function layoutTrack() {
      slideW = viewport.getBoundingClientRect().width;
      if (slideW < 1) slideW = 1;
      track.style.width = slideW * n + 'px';
      Array.prototype.forEach.call(track.children, function (slideEl) {
        slideEl.style.flex = '0 0 ' + slideW + 'px';
        slideEl.style.width = slideW + 'px';
        slideEl.style.maxWidth = slideW + 'px';
      });
    }

    function applyTransform(px, animate) {
      track.style.transition =
        animate && transitionMs > 0
          ? 'transform ' + transitionMs + 'ms cubic-bezier(0.25, 0.1, 0.25, 1)'
          : 'none';
      track.style.transform = 'translate3d(' + px + 'px,0,0)';
    }

    function goTo(index, animate) {
      var next = Math.max(0, Math.min(n - 1, index));
      current = next;
      layoutTrack();
      applyTransform(-current * slideW, animate !== false && transitionMs > 0);

      nav.querySelectorAll('.feature-sc__nav-btn').forEach(function (btn, j) {
        var on = j === current;
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
        btn.classList.toggle('feature-sc__nav-btn--active', on);
      });
      dots.querySelectorAll('.feature-sc__dot').forEach(function (dot, j) {
        var on = j === current;
        dot.classList.toggle('feature-sc__dot--active', on);
      });
      setPanelsHidden(current);
      syncVideoPlayback(current);
    }

    slides.forEach(function (slide, i) {
      var file = slide.file || slide.src;
      var url = resolveSlideUrl(base, file);

      var slideEl = document.createElement('div');
      slideEl.className = 'feature-sc__slide';
      slideEl.setAttribute('role', 'tabpanel');
      slideEl.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      slideEl.id = 'feature-sc-panel-' + String(i);

      var mediaBox = document.createElement('div');
      mediaBox.className = 'feature-sc__media';

      var entry = { video: null, img: null };
      if (isVideoFile(file)) {
        var video = document.createElement('video');
        video.className = 'feature-sc__video';
        video.src = url;
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.preload = i === 0 ? 'auto' : 'none';
        video.controls = false;
        video.removeAttribute('controls');
        video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
        if (video.disablePictureInPicture !== undefined) {
          video.disablePictureInPicture = true;
        }
        mediaBox.appendChild(video);
        entry.video = video;
      } else {
        var img = document.createElement('img');
        img.className = 'feature-sc__img';
        img.src = url;
        img.alt = slide.alt || '';
        img.decoding = 'async';
        img.draggable = false;
        img.loading = i < 2 ? 'eager' : 'lazy';
        mediaBox.appendChild(img);
        entry.img = img;
      }
      mediaEls.push(entry);
      slideEl.appendChild(mediaBox);
      track.appendChild(slideEl);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feature-sc__nav-btn';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', slideEl.id);
      btn.id = 'feature-sc-tab-' + String(i);
      btn.textContent = labels[i];
      btn.addEventListener('click', function () {
        goTo(i, true);
      });
      nav.appendChild(btn);

      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'feature-sc__dot';
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i, true);
      });
      dots.appendChild(dot);

      slideEl.setAttribute('aria-labelledby', btn.id);
    });

    viewport.appendChild(track);
    stageWrap.appendChild(viewport);
    inner.appendChild(nav);
    inner.appendChild(stageWrap);
    inner.appendChild(dots);
    root.appendChild(inner);
    container.appendChild(root);

    layoutTrack();
    goTo(0, false);

    viewport.addEventListener(
      'pointerdown',
      function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        startX = e.clientX;
        dragDx = 0;
        viewport.setPointerCapture(e.pointerId);
        slideW = viewport.getBoundingClientRect().width || 1;
      },
      { passive: true }
    );

    viewport.addEventListener(
      'pointermove',
      function (e) {
        if (!dragging) return;
        dragDx = e.clientX - startX;
        applyTransform(-current * slideW + dragDx, false);
      },
      { passive: true }
    );

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      var w = viewport.getBoundingClientRect().width || 1;
      var threshold = Math.max(48, w * 0.12);
      var next = current;
      if (dragDx < -threshold) next = current + 1;
      else if (dragDx > threshold) next = current - 1;
      dragDx = 0;
      goTo(next, true);
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(n - 1, true);
      }
    });

    var ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(function () {
            if (!dragging) {
              goTo(current, false);
            }
          })
        : null;
    if (ro) {
      ro.observe(viewport);
    } else {
      global.addEventListener('resize', function () {
        if (!dragging) {
          goTo(current, false);
        }
      });
    }

    return Promise.resolve();
  }

  global.initFeatureShowcaseCarousel = initFeatureShowcaseCarousel;
})(typeof window !== 'undefined' ? window : globalThis);
