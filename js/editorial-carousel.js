/**
 * EditorialCarousel — horizontal snap-scroll strip with wheel → horizontal,
 * pointer drag, and touch pan. Expects slide nodes already populated with media.
 */
(function (global) {
  'use strict';

  function initEditorialCarousel(root) {
    if (!root) return;
    var track = root.querySelector('.editorial-carousel__track');
    if (!track) return;

    var isDown = false;
    var startX = 0;
    var startScroll = 0;
    var pointerId = null;

    track.addEventListener(
      'wheel',
      function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      },
      { passive: false }
    );

    track.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(pointerId);
      track.classList.add('editorial-carousel__track--dragging');
      track.style.scrollSnapType = 'none';
    });

    track.addEventListener('pointermove', function (e) {
      if (!isDown || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      track.scrollLeft = startScroll - dx;
    });

    function endDrag(e) {
      if (!isDown || (pointerId != null && e.pointerId !== pointerId)) return;
      isDown = false;
      pointerId = null;
      try {
        track.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      track.classList.remove('editorial-carousel__track--dragging');
      track.style.scrollSnapType = '';
    }

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('lostpointercapture', function () {
      isDown = false;
      pointerId = null;
      track.classList.remove('editorial-carousel__track--dragging');
      track.style.scrollSnapType = '';
    });
  }

  global.initEditorialCarousel = initEditorialCarousel;
})(typeof window !== 'undefined' ? window : globalThis);
