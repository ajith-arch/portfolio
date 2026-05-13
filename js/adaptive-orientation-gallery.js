/**
 * AdaptiveOrientationGallery — manifest-driven layout by intrinsic image shape:
 * - ~square → pair two per row when consecutive squares, else centered single
 * - landscape → full-width row
 * - portrait → centered column with max width
 */
(function (global) {
  'use strict';

  function resolveUrl(base, file) {
    return String(base || '').replace(/\/?$/, '/') + String(file).replace(/^\//, '');
  }

  function toAbsoluteUrl(base, file) {
    var rel = resolveUrl(base, file);
    try {
      return new URL(rel, window.location.href).href;
    } catch (e) {
      return rel;
    }
  }

  function fetchManifest(manifestUrl) {
    var resolved = manifestUrl;
    try {
      resolved = new URL(manifestUrl, window.location.href).href;
    } catch (e0) {
      /* use raw */
    }

    var opts = { cache: 'no-store' };
    if (typeof AbortController !== 'undefined') {
      var ctrl = new AbortController();
      opts.signal = ctrl.signal;
      setTimeout(function () {
        ctrl.abort();
      }, 20000);
    }

    return fetch(resolved, opts).then(function (r) {
      if (!r.ok) throw new Error('Manifest fetch failed: ' + r.status);
      return r.json();
    });
  }

  function normalizeItems(manifest) {
    var base = manifest.base;
    try {
      var bu = new URL(String(base || './'), window.location.href);
      base = bu.href;
      if (!base.endsWith('/')) {
        base += '/';
      }
    } catch (e1) {
      /* keep manifest base string */
    }
    var items = Array.isArray(manifest.items) ? manifest.items : [];
    if (!items.length && Array.isArray(manifest.files)) {
      items = manifest.files.map(function (f) {
        return typeof f === 'string' ? { file: f } : f;
      });
    }
    return {
      base: base,
      items: items.filter(function (it) {
        var f = it.file || it.src || '';
        return /\.(webp|png|jpe?g|gif|webm|mp4)$/i.test(f);
      }),
    };
  }

  function loadDimensionsInBatches(items, base, batchSize) {
    batchSize = Math.max(1, batchSize || 4);
    var dimensions = [];
    var i = 0;
    function nextBatch() {
      if (i >= items.length) return Promise.resolve(dimensions);
      var batch = items.slice(i, i + batchSize);
      i += batch.length;
      return Promise.all(
        batch.map(function (item) {
          var file = item.file || item.src;
          return loadMediaSize(toAbsoluteUrl(base, file), file);
        })
      ).then(function (dims) {
        dimensions = dimensions.concat(dims);
        return nextBatch();
      });
    }
    return nextBatch();
  }

  function loadImageSize(url) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(dim) {
        if (done) return;
        done = true;
        resolve(dim);
      }
      var timer = setTimeout(function () {
        finish({ w: 0, h: 0 });
      }, 12000);

      var img = new Image();
      img.onload = function () {
        clearTimeout(timer);
        finish({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = function () {
        clearTimeout(timer);
        finish({ w: 0, h: 0 });
      };
      img.decoding = 'async';
      img.src = url;
    });
  }

  function loadVideoSize(url) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(dim) {
        if (done) return;
        done = true;
        resolve(dim);
      }
      var timer = setTimeout(function () {
        finish({ w: 0, h: 0 });
      }, 12000);

      var v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.playsInline = true;
      v.onloadedmetadata = function () {
        clearTimeout(timer);
        finish({ w: v.videoWidth, h: v.videoHeight });
      };
      v.onerror = function () {
        clearTimeout(timer);
        finish({ w: 0, h: 0 });
      };
      v.src = url;
    });
  }

  function loadMediaSize(url, file) {
    if (/\.(webm|mp4)$/i.test(String(file || ''))) {
      return loadVideoSize(url);
    }
    return loadImageSize(url);
  }

  function isVideoFile(file) {
    return /\.(webm|mp4)$/i.test(String(file || ''));
  }

  function classify(w, h) {
    if (!w || !h) return 'landscape';
    var r = w / h;
    if (r >= 0.9 && r <= 1.11) return 'square';
    if (r > 1.15) return 'landscape';
    if (r < 0.85) return 'portrait';
    return w >= h ? 'landscape' : 'portrait';
  }

  function buildLayoutKinds(dimensions) {
    return dimensions.map(function (d) {
      return classify(d.w, d.h);
    });
  }

  function buildRows(kinds) {
    var rows = [];
    var i = 0;
    while (i < kinds.length) {
      var k = kinds[i];
      if (k === 'square') {
        if (i + 1 < kinds.length && kinds[i + 1] === 'square') {
          rows.push({ type: 'grid2', indices: [i, i + 1] });
          i += 2;
        } else {
          rows.push({ type: 'squareSingle', indices: [i] });
          i += 1;
        }
      } else if (k === 'landscape') {
        rows.push({ type: 'full', indices: [i] });
        i += 1;
      } else {
        rows.push({ type: 'portrait', indices: [i] });
        i += 1;
      }
    }
    return rows;
  }

  function renderGallery(container, base, items, dimensions, rows) {
    container.innerHTML = '';
    container.classList.add('adaptive-gallery', 'adaptive-gallery--ready');

    rows.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className =
        'adaptive-gallery__row adaptive-gallery__row--' +
        (row.type === 'grid2' ? 'grid2' : row.type);

      row.indices.forEach(function (idx) {
        var item = items[idx];
        var file = item.file || item.src;
        if (!file) return;
        var url = toAbsoluteUrl(base, file);
        var fig = document.createElement('figure');
        fig.className = 'adaptive-gallery__cell';
        var d = dimensions[idx];
        if (row.type === 'squareSingle') {
          fig.classList.add('adaptive-gallery__cell--single-square');
        }

        if (isVideoFile(file)) {
          var video = document.createElement('video');
          video.className = 'adaptive-gallery__video';
          video.src = url;
          video.muted = true;
          video.defaultMuted = true;
          video.loop = true;
          video.autoplay = true;
          video.playsInline = true;
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.preload = 'auto';
          video.controls = false;
          video.removeAttribute('controls');
          video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
          video.disablePictureInPicture = true;
          if (d && d.w && d.h) {
            video.setAttribute('width', String(d.w));
            video.setAttribute('height', String(d.h));
          }
          fig.appendChild(video);
          requestAnimationFrame(function () {
            var p = video.play();
            if (p && typeof p.catch === 'function') {
              p.catch(function () {
                /* autoplay blocked or decode stall */
              });
            }
          });
        } else {
          var img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.draggable = false;
          if (d && d.w && d.h) {
            img.setAttribute('width', String(d.w));
            img.setAttribute('height', String(d.h));
          }
          fig.appendChild(img);
        }
        rowEl.appendChild(fig);
      });

      container.appendChild(rowEl);
    });
  }

  function renderGalleryInto(container, base, items) {
    if (!container) {
      return Promise.reject(new Error('AdaptiveOrientationGallery: missing container'));
    }
    container.classList.add('adaptive-gallery', 'adaptive-gallery--loading');
    container.innerHTML = '';
    if (!items.length) {
      container.classList.remove('adaptive-gallery--loading');
      return Promise.resolve();
    }
    return loadDimensionsInBatches(items, base, 4).then(function (dimensions) {
      var kinds = buildLayoutKinds(dimensions);
      var rows = buildRows(kinds);
      renderGallery(container, base, items, dimensions, rows);
      container.classList.remove('adaptive-gallery--loading');
    });
  }

  function initAdaptiveOrientationGallery(options) {
    var container = options.container;
    var manifestUrl = options.manifestUrl;
    var baseOverride = options.base;

    if (!container) {
      return Promise.reject(new Error('AdaptiveOrientationGallery: missing container'));
    }

    container.classList.add('adaptive-gallery', 'adaptive-gallery--loading');
    container.innerHTML = '';

    return fetchManifest(manifestUrl)
      .then(normalizeItems)
      .then(function (data) {
        var base = baseOverride != null ? baseOverride : data.base;
        var items = data.items;
        if (!items.length) {
          container.classList.remove('adaptive-gallery--loading');
          container.textContent = 'No images in manifest.';
          return;
        }

        return loadDimensionsInBatches(items, base, 4).then(function (dimensions) {
          var kinds = buildLayoutKinds(dimensions);
          var rows = buildRows(kinds);
          renderGallery(container, base, items, dimensions, rows);
          container.classList.remove('adaptive-gallery--loading');
        });
      })
      .catch(function (err) {
        container.classList.remove('adaptive-gallery--loading');
        container.classList.add('adaptive-gallery--error');
        container.textContent = 'Could not load gallery.';
        console.error(err);
      });
  }

  global.initAdaptiveOrientationGallery = initAdaptiveOrientationGallery;
  global.adaptiveGalleryCore = {
    fetchManifest: fetchManifest,
    normalizeItems: normalizeItems,
    renderGalleryInto: renderGalleryInto,
  };
})(typeof window !== 'undefined' ? window : globalThis);
