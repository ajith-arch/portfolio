/* Pause the Flipkart phone marquee while the card is off-screen. */
(function () {
  var el = document.querySelector('.fp[data-phones]');
  if (!el || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { el.classList.toggle('is-paused', !e.isIntersecting); });
  }, { rootMargin: '120px 0px' }).observe(el);
})();
