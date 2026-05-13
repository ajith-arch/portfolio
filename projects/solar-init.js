/**
 * Solar case study (portfolio “Solar tracker” page):
 * - Vertical strip: frames 1–7
 * - Vertical strip: frames 8–14 (same full-width column as other strips; includes .webp and any .mov in those slots)
 * - Vertical strip: frame 15+ (and any mid-slot media already covered above is excluded)
 */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var manifestUrl = params.get('manifest') || '../assets/solar/manifest.json';

  var stripBefore = document.getElementById('solarStripBefore');
  var stripMid = document.getElementById('solarStripMid');
  var stripAfter = document.getElementById('solarStripAfter');
  var main = document.getElementById('solarGallery');

  if (
    !stripBefore ||
    !stripMid ||
    !stripAfter ||
    !main ||
    typeof fetchSortedManifest !== 'function' ||
    typeof partitionManifestByWordIndex !== 'function' ||
    typeof renderSequentialStrip !== 'function'
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

      var afterMerged =
        typeof SequentialMediaGallerySort === 'function'
          ? SequentialMediaGallerySort(part.after)
          : part.after.slice();

      renderSequentialStrip(stripBefore, base, part.before, {
        globalIndexStart: 0,
        totalHint: total,
      });

      renderSequentialStrip(stripMid, base, part.mid, {
        globalIndexStart: part.before.length,
        totalHint: total,
      });

      var afterStart = part.before.length + part.mid.length;
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
      stripMid.innerHTML = '';
      stripAfter.innerHTML = '';
      console.error(err);
    });
});
