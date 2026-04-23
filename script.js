// ===== Portfolio Homepage JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    // Initialize components
    initLandingReveal();
    initFilterButtons();
    initSmoothScroll();
    initProjectHeroVideos();
    /* EXPERIMENTAL — safe to remove: see initExpScrollHero() below */
    initExpScrollHero();
    /* Mobile: unified whole-card reveal (no split text/thumbnail animation) */
    initMobileProjectHeroReveal();
});

// ===== Theme Toggle + Background Video Source Switching =====
function initThemeToggle() {
    var STORAGE_KEY = 'portfolio-theme';
    var root = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Preload both videos once for smoother source swaps.
    preloadThemeVideos();

    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getSystemTheme() {
        return mediaQuery.matches ? 'dark' : 'light';
    }

    function resolveTheme() {
        return getSavedTheme() || window.__initialTheme || getSystemTheme();
    }

    function updateToggleState(theme) {
        if (!toggle) return;
        var isDark = theme === 'dark';
        toggle.setAttribute('aria-pressed', String(isDark));
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    function applyTheme(theme, options) {
        options = options || {};
        var shouldSwapVideo = options.swapVideo !== false;
        // data-theme drives both palette + CSS cursor variable immediately.
        root.setAttribute('data-theme', theme);
        updateToggleState(theme);
        if (shouldSwapVideo) {
            swapBackgroundVideo(theme);
        }
    }

    function persistTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function clearSavedTheme() {
        localStorage.removeItem(STORAGE_KEY);
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            persistTheme(next);
            applyTheme(next, { swapVideo: true });
        });
    }

    // Respect system changes only when user has not explicitly selected a theme.
    mediaQuery.addEventListener('change', function () {
        if (getSavedTheme()) return;
        clearSavedTheme();
        applyTheme(getSystemTheme(), { swapVideo: true });
    });

    applyTheme(resolveTheme(), { swapVideo: true });
}

function preloadThemeVideos() {
    var light = 'assets/image/background.webm';
    var dark = 'assets/image/background dark.webm';
    [light, dark].forEach(function (src) {
        var preloadVideo = document.createElement('video');
        preloadVideo.preload = 'metadata';
        preloadVideo.muted = true;
        preloadVideo.playsInline = true;
        preloadVideo.src = src;
        preloadVideo.load();
    });
}

function swapBackgroundVideo(theme) {
    var video = document.getElementById('homeBgVideo');
    if (!video) return;

    var lightSrc = video.dataset.lightSrc || './assets/image/background.webm';
    var darkSrc = video.dataset.darkSrc || './assets/image/background dark.webm';
    var targetSrc = theme === 'dark' ? darkSrc : lightSrc;
    var currentSrc = video.getAttribute('src') || '';

    // Avoid unnecessary reload if source is already active.
    if (currentSrc === targetSrc || currentSrc.endsWith(targetSrc.replace('./', ''))) {
        return;
    }

    var previousTime = video.currentTime || 0;
    var wasPaused = video.paused;

    video.setAttribute('src', targetSrc);
    video.load();

    // Keep transition smooth: restore approximate playback position when metadata arrives.
    video.addEventListener('loadedmetadata', function onLoadedMeta() {
        video.removeEventListener('loadedmetadata', onLoadedMeta);
        if (Number.isFinite(previousTime) && video.duration) {
            video.currentTime = Math.min(previousTime, Math.max(0, video.duration - 0.1));
        }
        if (!wasPaused) {
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }
    });
}

// ===== Project Filtering =====
function initFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter projects
            const filter = this.dataset.filter;
            
            projectCards.forEach(card => {
                const category = card.dataset.category;
                const isHero = card.classList.contains('project-hero');
                const visibleDisplay = isHero ? 'flex' : 'block';
                
                if (filter === 'all' || category === filter) {
                    card.style.display = visibleDisplay;
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.display = 'none';
                }
            });
            if (typeof window.__refreshMobileProjectHeroReveal === 'function') {
                requestAnimationFrame(function () {
                    window.__refreshMobileProjectHeroReveal();
                });
            }
        });
    });
}

// ===== Smooth Scroll for Navigation =====
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ===== Update Active Nav Link on Scroll =====
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ===== Project hero video hover =====
function initProjectHeroVideos() {
  var isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var frames = document.querySelectorAll('.project-hero-media-frame');

  frames.forEach(function(frame) {
    var video = frame.querySelector('.project-hero-video');
    if (!video) return;

    if (frame.classList.contains('project-hero-media--campus') || frame.classList.contains('project-hero-media--flipkart')) {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function(){});
      return;
    }

    if (isTouch) {
      video.setAttribute('autoplay', '');
      video.setAttribute('loop', '');
      frame.classList.add('is-playing');
      var tp = video.play();
      if (tp && typeof tp.catch === 'function') tp.catch(function(){});
      return;
    }

    var play = function() {
      frame.classList.add('is-playing');
      var pr = video.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function(){});
    };
    var pause = function() {
      frame.classList.remove('is-playing');
      video.pause();
      video.currentTime = 0;
    };

    frame.addEventListener('mouseenter', play);
    frame.addEventListener('mouseleave', pause);
    frame.addEventListener('focusin', play);
    frame.addEventListener('focusout', pause);
  });
}

// ===== Landing hero portrait reveal =====
function initLandingReveal() {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const wrapper = document.querySelector('.portrait-wrapper');
    const canvas = document.querySelector('.portrait-canvas');
    const animeImg = document.querySelector('.portrait-anime');
    const realImg = document.querySelector('.portrait-real');
    if (!wrapper || !canvas || !animeImg || !realImg) return;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let baseRadius = 120;

    const mouse = { x: -9999, y: -9999 };
    const smooth = { x: -9999, y: -9999 };
    let hovering = false;
    let reveal = 0;
    let t = 0;

    const parallax = { x: 0, y: 0 };
    const PARALLAX_MAX = 7;
    const PARALLAX_EASE = 0.07;

    const sweepConfigs = [
        { yRatio: 0.21, yArc: 0.025, dir:  1, duration: 2600, delay:  900, timeOff: 47, scale: 0.90 },
        { yRatio: 0.32, yArc: 0.020, dir: -1, duration: 2100, delay: 3700, timeOff: 23, scale: 0.85 },
        { yRatio: 0.52, yArc: 0.020, dir:  1, duration: 1800, delay: 6000, timeOff: 71, scale: 0.85 },
        { yRatio: 0.65, yArc: 0.020, dir: -1, duration: 1800, delay: 6000, timeOff: 95, scale: 0.85 },
    ];
    const sweeps = [];
    let sweepsPending = false;

    function scheduleSweeps() {
        const now = performance.now();
        for (let si = 0; si < sweepConfigs.length; si++) {
            const cfg = sweepConfigs[si];
            sweeps[si] = {
                yRatio: cfg.yRatio, yArc: cfg.yArc, dir: cfg.dir,
                duration: cfg.duration, timeOff: cfg.timeOff, scale: cfg.scale,
                startTime: now + cfg.delay, done: false,
                x: 0, y: 0, opacity: 0, radius: 0
            };
        }
        sweepsPending = false;
    }

    function easeInOutCubic(v) {
        return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
    }

    function sweepAlpha(p) {
        if (p < 0.12) return p / 0.12;
        if (p > 0.5)  return Math.max(0, 1 - (p - 0.5) / 0.5);
        return 1;
    }

    function blobNoise(angle, time) {
        return (
            0.28 * Math.sin(2 * angle + time * 0.6 + Math.sin(time * 0.25) * 0.7) +
            0.22 * Math.sin(3 * angle - time * 0.45 + 2.5) +
            0.10 * Math.sin(5 * angle + time * 0.35 + 4.2)
        );
    }

    function drawBlob(cx, cy, radius, time) {
        const n = 32;
        const pts = [];

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2;
            const noise = blobNoise(angle, time);
            const r = radius * (1 + noise);
            pts.push({
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
            });
        }

        ctx.beginPath();
        ctx.moveTo(
            (pts[n - 1].x + pts[0].x) * 0.5,
            (pts[n - 1].y + pts[0].y) * 0.5
        );

        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            ctx.quadraticCurveTo(
                pts[i].x,
                pts[i].y,
                (pts[i].x + pts[next].x) * 0.5,
                (pts[i].y + pts[next].y) * 0.5
            );
        }

        ctx.closePath();
    }

    function resize() {
        const rect = wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        w = rect.width;
        h = rect.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        baseRadius = Math.min(w, h) * 0.19;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        ctx.drawImage(realImg, 0, 0, w, h);

        for (let si = 0; si < sweeps.length; si++) {
            const s = sweeps[si];
            if (s.done || s.opacity < 0.005) continue;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = s.opacity;
            drawBlob(s.x, s.y, s.radius, t + s.timeOff);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (reveal > 0.005) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = Math.min(reveal, 1);

            drawBlob(smooth.x, smooth.y, baseRadius, t);
            ctx.fillStyle = '#000';
            ctx.fill();

            ctx.globalAlpha = 1;
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    function loop() {
        t += 0.05;
        smooth.x += (mouse.x - smooth.x) * 0.80;
        smooth.y += (mouse.y - smooth.y) * 0.80;

        const target = hovering ? 1 : 0;
        reveal += (target - reveal) * 0.12;

        let tx = 0;
        let ty = 0;
        if (hovering && w > 0 && h > 0) {
            tx = ((mouse.x / w) - 0.5) * 2 * PARALLAX_MAX;
            ty = ((mouse.y / h) - 0.5) * 2 * PARALLAX_MAX;
        }
        parallax.x += (tx - parallax.x) * PARALLAX_EASE;
        parallax.y += (ty - parallax.y) * PARALLAX_EASE;
        wrapper.style.transform = `translate3d(${parallax.x.toFixed(2)}px,${parallax.y.toFixed(2)}px,0)`;

        for (let si = 0; si < sweeps.length; si++) {
            const s = sweeps[si];
            if (s.done) continue;
            const elapsed = performance.now() - s.startTime;
            if (elapsed < 0) continue;
            const raw = Math.min(elapsed / s.duration, 1);
            const p = easeInOutCubic(raw);
            s.x = s.dir > 0
                ? w * 0.15 + (w * 0.7) * p
                : w * 0.85 - (w * 0.7) * p;
            s.y = h * s.yRatio + Math.sin(raw * Math.PI) * h * s.yArc;
            s.opacity = sweepAlpha(raw);
            s.radius = baseRadius * s.scale;
            if (raw >= 1) { s.done = true; }
        }

        if (sweeps.length > 0 && !sweepsPending && sweeps.every(s => s.done)) {
            sweepsPending = true;
            setTimeout(scheduleSweeps, 5000);
        }

        draw();
        requestAnimationFrame(loop);
    }

    function activate() {
        resize();
        draw();
        wrapper.classList.add('reveal-active');
        scheduleSweeps();
        requestAnimationFrame(loop);
    }

    function onEnter(e) {
        hovering = true;
        const rect = wrapper.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        smooth.x = mx;
        smooth.y = my;
        mouse.x = mx;
        mouse.y = my;
    }

    function onLeave() {
        hovering = false;
    }

    function onMove(e) {
        const rect = wrapper.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }

    if (canHover) {
        wrapper.addEventListener('mouseenter', onEnter);
        wrapper.addEventListener('mouseleave', onLeave);
        wrapper.addEventListener('mousemove', onMove);
    }
    window.addEventListener('resize', resize);

    const bothLoaded = () =>
        realImg.complete &&
        realImg.naturalWidth > 0 &&
        animeImg.complete &&
        animeImg.naturalWidth > 0;

    if (bothLoaded()) {
        activate();
    } else {
        const check = () => {
            if (bothLoaded()) activate();
        };
        realImg.addEventListener('load', check);
        animeImg.addEventListener('load', check);
    }
}

/*
 * =========================================================================
 * MOBILE: unified project card reveal (no separate text / thumbnail motion)
 * ----------------------------------------------------------------------------
 * ≤768px only: whole .project-hero-inner fades + slides as one block via IO.
 * Desktop unchanged. Remove initMobileProjectHeroReveal from DOMContentLoaded
 * and delete this + CSS block body.home-mobile-reveal … to disable.
 * =========================================================================
 */
function initMobileProjectHeroReveal() {
    var mq = window.matchMedia('(max-width: 768px)');
    var listSel = '#work .project-hero-list > .project-card.project-hero';
    var observer = null;

    function clearRevealMode() {
        document.querySelectorAll(listSel).forEach(function (card) {
            var inner = card.querySelector('.project-hero-inner');
            if (inner) inner.classList.remove('mobile-hero-in-view');
        });
        document.body.classList.remove('home-mobile-reveal');
    }

    function wire() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        document.querySelectorAll(listSel).forEach(function (card) {
            var inner = card.querySelector('.project-hero-inner');
            if (inner) inner.classList.remove('mobile-hero-in-view');
        });
        document.body.classList.remove('home-mobile-reveal');

        if (!mq.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            clearRevealMode();
            return;
        }

        document.body.classList.add('home-mobile-reveal');

        observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var card = entry.target;
                    if (window.getComputedStyle(card).display === 'none') return;
                    var inner = card.querySelector('.project-hero-inner');
                    if (inner) inner.classList.add('mobile-hero-in-view');
                    observer.unobserve(card);
                });
            },
            { root: null, rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
        );

        document.querySelectorAll(listSel).forEach(function (card) {
            if (window.getComputedStyle(card).display !== 'none') {
                observer.observe(card);
            }
        });
    }

    window.__refreshMobileProjectHeroReveal = wire;
    mq.addEventListener('change', wire);
    wire();
}

/*
 * =========================================================================
 * EXPERIMENTAL: fixed background video + sticky hero stage + foreground fade
 * -------------------------------------------------------------------------
 * Video reparents to <body> as z-index:0; .desktop-content is z-index:1.
 * Sticky .hero-pinned-stage + scroll tail drive overlap with .main. Scroll
 * updates only the hero foreground (.hero-foreground-scroll) and
 * body.exp-past-hero-stage — project cards are normal flow (no inner
 * transform/opacity driven by scroll).
 * -------------------------------------------------------------------------
 * Full opt-out: remove class "exp-scroll-hero" from <body> in index.html.
 * =========================================================================
 */
function initExpScrollHero() {
    if (!document.body.classList.contains('exp-scroll-hero')) return;

    if (window.innerWidth <= 768) {
        document.body.classList.remove('exp-scroll-hero');
        return;
    }

    const hero = document.querySelector('.hero');
    const foreground = document.querySelector('.hero-foreground-scroll');
    const tail = document.querySelector('.hero-scroll-tail');
    const video = document.querySelector('.hero-bg-video');
    if (!hero || !foreground) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.remove('exp-scroll-hero');
        return;
    }

    if (video) {
        video.classList.add('exp-stage-video');
        document.body.insertBefore(video, document.body.firstChild);
    }

    document.querySelectorAll('#work .project-hero-list > .project-card.project-hero .project-hero-inner').forEach(function (inner) {
        inner.style.transition = '';
        inner.style.opacity = '';
        inner.style.transform = '';
    });

    const rootStyle = document.documentElement.style;

    function getVH() { return window.innerHeight || 0; }

    function layout() {
        if (!tail) return;
        var h = getVH();
        var fadeRange = Math.max(h * 0.32, 260);
        var tailPx = Math.round(fadeRange + h * 0.14);
        tail.style.height = tailPx + 'px';
        var overlapPx = Math.round(Math.max(0, tailPx - fadeRange * 0.65));
        rootStyle.setProperty('--exp-main-overlap', '-' + overlapPx + 'px');
    }

    layout();

    var ticking = false;

    function update() {
        var scrollY = window.scrollY || window.pageYOffset;
        var heroTop = hero.offsetTop;
        var past = scrollY - heroTop;
        var h = getVH();

        var fadeRange = Math.max(h * 0.32, 260);
        var pFade = Math.min(1, Math.max(0, past / fadeRange));
        foreground.style.opacity = String(1 - pFade);
        foreground.style.transform = 'translate3d(0,' + (-10 * pFade) + 'px,0) scale(' + (1 - 0.02 * pFade) + ')';

        var heroBottom = heroTop + hero.offsetHeight;
        var pastStage = scrollY > heroBottom - h * 0.3;
        document.body.classList.toggle('exp-past-hero-stage', pastStage);

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function() { layout(); onScroll(); });
    update();
}

