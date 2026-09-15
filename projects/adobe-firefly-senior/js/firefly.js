/**
 * Adobe Firefly case study interactions
 */

(function () {
  'use strict';

  // Navigation scroll state
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Asset placeholders — show label when image fails to load
  document.querySelectorAll('.asset[data-src]').forEach((container) => {
    const src = container.dataset.src;
    const alt = container.dataset.alt || '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = container.dataset.eager ? 'eager' : 'lazy';
    img.decoding = 'async';

    img.addEventListener('load', () => {
      container.classList.add('asset--loaded');
      const label = container.querySelector('.asset__label');
      if (label) label.remove();
    });

    img.addEventListener('error', () => {
      img.remove();
    });

    const label = container.querySelector('.asset__label');
    container.insertBefore(img, label);
  });

  // Sticky scroll story — desktop only
  const scrollStory = document.querySelector('.scroll-story');
  if (scrollStory && window.matchMedia('(min-width: 901px)').matches) {
    const steps = scrollStory.querySelectorAll('.scroll-story__step');
    const images = scrollStory.querySelectorAll('.scroll-story__images .asset');

    const setActive = (index) => {
      steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
      images.forEach((img, i) => img.classList.toggle('is-active', i === index));
    };

    setActive(0);

    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(steps).indexOf(entry.target);
            if (index >= 0) setActive(index);
          }
        });
      },
      { threshold: 0.55, rootMargin: '-20% 0px -20% 0px' }
    );

    steps.forEach((step) => stepObserver.observe(step));
  } else if (scrollStory) {
    scrollStory.querySelectorAll('.scroll-story__step').forEach((s) => s.classList.add('is-active'));
    scrollStory.querySelectorAll('.scroll-story__images .asset').forEach((img, i) => {
      if (i === 0) img.classList.add('is-active');
    });
  }

  // Interaction gallery — play WebMs only while near viewport
  const galleryVideos = document.querySelectorAll('#interaction-gallery .ix-card__video');
  if (galleryVideos.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const safePlay = (video) => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    };

    if (reduceMotion) {
      galleryVideos.forEach((video) => {
        video.removeAttribute('autoplay');
        video.pause();
        try {
          video.currentTime = 0;
        } catch (e) {}
      });
    } else if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
              safePlay(video);
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.35, rootMargin: '80px 0px' }
      );

      galleryVideos.forEach((video) => {
        video.muted = true;
        video.setAttribute('playsinline', '');
        videoObserver.observe(video);
      });
    } else {
      galleryVideos.forEach((video) => {
        video.muted = true;
        safePlay(video);
      });
    }
  }
})();
