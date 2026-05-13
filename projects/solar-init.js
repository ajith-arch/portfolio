/**
 * Solar case study (portfolio “Solar tracker” page — same pattern as an AirPods-style case study):
 * - Vertical strip: frames 1–7
 * - Carousel: only .webp files in word slots 8–14 (eight.webp … fourteen.webp)
 * - Vertical strip: non-webp in 8–14 (e.g. ten.mov, fourteen.mov) merged with frames 15+, sorted by narrative order
 */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var manifestUrl = params.get('manifest') || '../assets/solar/manifest.json';

  var stripBefore = document.getElementById('solarStripBefore');
  var stripAfter = document.getElementById('solarStripAfter');
  var carouselRoot = document.getElementById('solarEditorialCarousel');
  var carouselTrack = carouselRoot && carouselRoot.querySelector('.editorial-carousel__track');
  var carouselWrap = document.getElementById('solarCarouselWrap');
  var main = document.getElementById('solarGallery');

  if (
    !stripBefore ||
    !stripAfter ||
    !carouselRoot ||
    !carouselTrack ||
    !main ||
    typeof fetchSortedManifest !== 'function' ||
    typeof partitionManifestByWordIndex !== 'function' ||
    typeof renderSequentialStrip !== 'function' ||
    typeof appendSequentialSlot !== 'function'
  ) {
    return;
  }

  main.classList.add('solar-work--loading');

  fetchSortedManifest(manifestUrl)
    .then(function (data) {
      main.classList.remove('solar-work--error');
      stripBefore.classList.remove('sequential-media--error');

      var base = data.base;
      var items = data.items;
      var total = items.length;
      var part = partitionManifestByWordIndex(items, 8, 14);

      var carouselWebp = [];
      var midNonWebp = [];
      part.mid.forEach(function (item) {
        var f = item.file || item.src || '';
        if (/\.webp$/i.test(f)) carouselWebp.push(item);
        else midNonWebp.push(item);
      });

      var afterMerged =
        typeof SequentialMediaGallerySort === 'function'
          ? SequentialMediaGallerySort(midNonWebp.concat(part.after))
          : midNonWebp.concat(part.after);

      renderSequentialStrip(stripBefore, base, part.before, {
        globalIndexStart: 0,
        totalHint: total,
      });

      carouselTrack.innerHTML = '';
      if (carouselWebp.length === 0) {
        if (carouselWrap) carouselWrap.hidden = true;
      } else {
        if (carouselWrap) carouselWrap.hidden = false;
        carouselWebp.forEach(function (item, i) {
          var slide = document.createElement('div');
          slide.className = 'editorial-carousel__slide';
          var idx = part.before.length + i;
          appendSequentialSlot(slide, base, item, idx, total);
          carouselTrack.appendChild(slide);
        });
        if (typeof initEditorialCarousel === 'function') {
          initEditorialCarousel(carouselRoot);
        }
      }

      var afterStart = part.before.length + carouselWebp.length;
      renderSequentialStrip(stripAfter, base, afterMerged, {
        globalIndexStart: afterStart,
        totalHint: total,
      });

      main.classList.remove('solar-work--loading');
    })
    .catch(function (err) {
      main.classList.remove('solar-work--loading');
      main.classList.add('solar-work--error');
      stripBefore.classList.add('sequential-media--error');
      stripBefore.textContent = 'Could not load gallery.';
      stripAfter.innerHTML = '';
      if (carouselWrap) carouselWrap.hidden = true;
      console.error(err);
    });
});
