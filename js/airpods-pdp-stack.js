/**
 * AirPods PDP — composite layout: adaptive gallery (1–7), feature carousel (8–14), adaptive (15+).
 */
(function (global) {
  'use strict';

  var CAROUSEL_FILES = [
    '8.webp',
    '9.webp',
    '10.webm',
    '11.webm',
    '12.webp',
    '13.webm',
    '14.webm',
  ];

  function stemNum(it) {
    var f = it.file || it.src || '';
    var m = String(f).match(/^(\d+)/);
    if (!m) return NaN;
    return parseInt(m[1], 10);
  }

  function initAirpodsPdpGalleryStack(options) {
    var stack = document.getElementById('airpodsGallery');
    var beforeEl = document.getElementById('airpodsGalleryBefore');
    var afterEl = document.getElementById('airpodsGalleryAfter');
    var carouselEl = document.getElementById('airpodsFeatureCarousel');
    var manifestUrl = options && options.manifestUrl;
    var baseOverride = options && options.base;

    if (!stack || !beforeEl || !afterEl || !carouselEl) {
      return Promise.reject(new Error('AirPods gallery stack: missing DOM'));
    }
    if (!global.adaptiveGalleryCore || !global.initFeatureShowcaseCarousel) {
      return Promise.reject(new Error('AirPods gallery stack: missing scripts'));
    }

    var core = global.adaptiveGalleryCore;

    stack.classList.add('adaptive-gallery--loading');

    return core
      .fetchManifest(manifestUrl)
      .then(core.normalizeItems)
      .then(function (data) {
        var base = baseOverride != null ? baseOverride : data.base;
        var items = data.items;

        var beforeItems = items.filter(function (it) {
          var n = stemNum(it);
          return !isNaN(n) && n <= 7;
        });
        var afterItems = items.filter(function (it) {
          var n = stemNum(it);
          return !isNaN(n) && n >= 15;
        });
        var carouselSlides = CAROUSEL_FILES.map(function (name) {
          var found = items.find(function (it) {
            return (it.file || it.src) === name;
          });
          return found || { file: name };
        });

        function setEmpty(el, arr) {
          if (!el) return;
          el.classList.toggle('airpods-gallery-segment--empty', !arr.length);
        }
        setEmpty(beforeEl, beforeItems);
        setEmpty(afterEl, afterItems);

        return Promise.all([
          core.renderGalleryInto(beforeEl, base, beforeItems),
          core.renderGalleryInto(afterEl, base, afterItems),
          global.initFeatureShowcaseCarousel({
            container: carouselEl,
            base: base,
            slides: carouselSlides,
            ariaLabel: 'AirPods PDP feature sequence',
          }),
        ]);
      })
      .then(function () {
        stack.classList.remove('adaptive-gallery--loading');
      })
      .catch(function (err) {
        stack.classList.remove('adaptive-gallery--loading');
        console.error(err);
        var msg = document.createElement('p');
        msg.className = 'airpods-stack-error';
        msg.textContent = 'Could not load gallery.';
        stack.appendChild(msg);
      });
  }

  global.initAirpodsPdpGalleryStack = initAirpodsPdpGalleryStack;
})(typeof window !== 'undefined' ? window : globalThis);
