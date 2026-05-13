/**
 * SequentialMediaGallery — fetch a manifest and render stacked full-width media.
 * Manifest: { base: "../assets/solar/", items: [{ file: "one.webp" }, ...] }
 */
(function (global) {
  'use strict';

  var WORD_ORDER = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    ninteen: 19,
    twenty: 20,
  };

  var VIDEO_EXT = /\.(mp4|webm|mov)$/i;

  function basenameNoExt(file) {
    var m = String(file).replace(/^.*\//, '');
    var i = m.lastIndexOf('.');
    return i === -1 ? m.toLowerCase() : m.slice(0, i).toLowerCase();
  }

  function extRank(file) {
    var ext = String(file).toLowerCase().split('.').pop();
    if (ext === 'gif') return 1;
    if (ext === 'mp4' || ext === 'webm' || ext === 'mov') return 2;
    return 0;
  }

  function sortItemsLikeManifest(items) {
    return items.slice().sort(function (a, b) {
      var fa = a.file || a;
      var fb = b.file || b;
      var wa = WORD_ORDER[basenameNoExt(fa)] || 999;
      var wb = WORD_ORDER[basenameNoExt(fb)] || 999;
      if (wa !== wb) return wa - wb;
      return extRank(fa) - extRank(fb);
    });
  }

  function resolveUrl(base, file) {
    return String(base || '').replace(/\/?$/, '/') + String(file).replace(/^\//, '');
  }

  function createSlot(url, index, total) {
    var ext = url.split('.').pop().toLowerCase();
    var wrap = document.createElement('div');
    wrap.className = 'sequential-media__slot';
    wrap.setAttribute('data-index', String(index));

    if (VIDEO_EXT.test(url)) {
      var v = document.createElement('video');
      v.className = 'sequential-media__media sequential-media__media--video';
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('loop', '');
      v.setAttribute('preload', 'none');
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.controls = false;
      v.setAttribute('aria-label', 'Project video');
      /*
       * .mov: many Chromium builds play H.264-in-MOV when typed as video/mp4 but
       * ignore video/quicktime; Safari prefers quicktime. Use two sources (same URL).
       * .mp4 / .webm: single source via video.src in activateVideoLazy.
       */
      if (ext === 'mov') {
        var sMp4 = document.createElement('source');
        sMp4.setAttribute('data-lazy-src', url);
        sMp4.type = 'video/mp4';
        var sQt = document.createElement('source');
        sQt.setAttribute('data-lazy-src', url);
        sQt.type = 'video/quicktime';
        v.appendChild(sMp4);
        v.appendChild(sQt);
        wireMovInViewWhenReady(v, url);
      } else {
        wireVideoLazy(v, url);
      }
      wrap.appendChild(v);
      return wrap;
    }

    var img = document.createElement('img');
    img.className = 'sequential-media__media';
    img.src = url;
    img.alt = '';
    img.decoding = index < 2 ? 'sync' : 'async';
    img.loading = index < 2 ? 'eager' : 'lazy';
    if (index < 2) img.setAttribute('fetchpriority', 'high');
    img.draggable = false;
    wrap.appendChild(img);
    return wrap;
  }

  function bindVideoLayout(video) {
    function onMeta() {
      var w = video.videoWidth;
      var h = video.videoHeight;
      if (w > 0 && h > 0) {
        video.style.aspectRatio = String(w) + ' / ' + String(h);
      }
    }
    video.addEventListener('loadedmetadata', onMeta, { once: true });
    video.addEventListener(
      'error',
      function () {
        video.controls = true;
        video.setAttribute('data-video-error', '1');
      },
      { once: true }
    );
  }

  function wireVideoLazy(video, url) {
    bindVideoLayout(video);

    function activate() {
      if (video.dataset.mediaReady === '1') return;
      video.dataset.mediaReady = '1';
      video.src = url;
      video.load();
      var pr = video.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function () {});
    }

    if (!('IntersectionObserver' in window)) {
      activate();
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          activate();
          obs.unobserve(video);
        });
      },
      { root: null, rootMargin: '160px 0px', threshold: 0.01 }
    );
    obs.observe(video);
  }

  function wireMovInViewWhenReady(video, url) {
    bindVideoLayout(video);

    function activate() {
      if (video.dataset.mediaReady === '1') return;
      video.dataset.mediaReady = '1';
      var list = video.querySelectorAll('source[data-lazy-src]');
      for (var i = 0; i < list.length; i++) {
        list[i].src = url;
      }
      video.load();
      var pr = video.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function () {});
    }

    if (!('IntersectionObserver' in window)) {
      activate();
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          activate();
          obs.unobserve(video);
        });
      },
      { root: null, rootMargin: '160px 0px', threshold: 0.01 }
    );
    obs.observe(video);
  }

  function fetchSortedManifest(manifestUrl) {
    return fetch(manifestUrl, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('Manifest fetch failed: ' + r.status);
        return r.json();
      })
      .then(function (manifest) {
        var base = manifest.base;
        var items = Array.isArray(manifest.items) ? manifest.items : [];
        if (!items.length && Array.isArray(manifest.files)) {
          items = manifest.files.map(function (f) {
            return typeof f === 'string' ? { file: f } : f;
          });
        }
        items = sortItemsLikeManifest(items);
        return { base: base, items: items };
      });
  }

  function partitionManifestByWordIndex(items, startInclusive, endInclusive) {
    var before = [];
    var mid = [];
    var after = [];
    items.forEach(function (item) {
      var file = item.file || item.src;
      if (!file) return;
      var word = basenameNoExt(file);
      var n = WORD_ORDER[word];
      if (n == null) {
        after.push(item);
        return;
      }
      if (n < startInclusive) before.push(item);
      else if (n <= endInclusive) mid.push(item);
      else after.push(item);
    });
    return { before: before, mid: mid, after: after };
  }

  function appendSequentialSlot(parent, base, item, index, totalHint) {
    var file = item.file || item.src;
    if (!file) return;
    var url = resolveUrl(base, file);
    parent.appendChild(createSlot(url, index, totalHint));
  }

  function renderSequentialStrip(container, base, items, options) {
    options = options || {};
    var globalStart = options.globalIndexStart || 0;
    var totalHint =
      options.totalHint != null ? options.totalHint : globalStart + items.length;
    container.innerHTML = '';
    container.classList.add('sequential-media');
    items.forEach(function (item, i) {
      appendSequentialSlot(container, base, item, globalStart + i, totalHint);
    });
  }

  function initSequentialMediaGallery(options) {
    var container = options.container;
    if (!container) return Promise.reject(new Error('SequentialMediaGallery: missing container'));

    var manifestUrl = options.manifestUrl;
    var baseOverride = options.base;

    container.innerHTML = '';
    container.classList.add('sequential-media', 'sequential-media--loading');

    return fetchSortedManifest(manifestUrl)
      .then(function (data) {
        var base = baseOverride != null ? baseOverride : data.base;
        var items = data.items;
        renderSequentialStrip(container, base, items, {
          globalIndexStart: 0,
          totalHint: items.length,
        });
        container.classList.remove('sequential-media--loading');
      })
      .catch(function (err) {
        container.classList.remove('sequential-media--loading');
        container.classList.add('sequential-media--error');
        container.textContent = 'Could not load gallery.';
        console.error(err);
      });
  }

  global.initSequentialMediaGallery = initSequentialMediaGallery;
  global.SequentialMediaGallerySort = sortItemsLikeManifest;
  global.fetchSortedManifest = fetchSortedManifest;
  global.partitionManifestByWordIndex = partitionManifestByWordIndex;
  global.renderSequentialStrip = renderSequentialStrip;
  global.appendSequentialSlot = appendSequentialSlot;
  global.resolveSequentialMediaUrl = resolveUrl;
})(typeof window !== 'undefined' ? window : globalThis);
