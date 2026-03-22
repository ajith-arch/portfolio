// ===== Portfolio Homepage JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
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
                    if (document.body.classList.contains('exp-scroll-hero') && isHero) return;
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

    if (frame.classList.contains('project-hero-media--campus')) {
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
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
    const PARALLAX_MAX = 10;
    const PARALLAX_EASE = 0.10;

    function blobNoise(angle, time) {
        return (
            0.22 * Math.sin(2 * angle + time * 0.8 + Math.sin(time * 0.3) * 0.5) +
            0.18 * Math.sin(3 * angle - time * 0.6 + 1.3) +
            0.14 * Math.sin(4 * angle + time * 0.45 + 3.8) +
            0.10 * Math.sin(6 * angle - time * 0.35 + 2.1) +
            0.07 * Math.sin(9 * angle + time * 0.75 + 5.2)
        );
    }

    function drawBlob(cx, cy, radius, time) {
        const n = 72;
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
        baseRadius = Math.min(w, h) * 0.17;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        ctx.drawImage(realImg, 0, 0, w, h);

        if (reveal > 0.005) {
            ctx.globalCompositeOperation = 'destination-out';
            const blur = baseRadius * 0.22;
            ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = Math.min(reveal, 1);

            drawBlob(smooth.x, smooth.y, baseRadius, t);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.filter = 'none';
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

        draw();
        requestAnimationFrame(loop);
    }

    function activate() {
        resize();
        draw();
        wrapper.classList.add('reveal-active');
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

    wrapper.addEventListener('mouseenter', onEnter);
    wrapper.addEventListener('mouseleave', onLeave);
    wrapper.addEventListener('mousemove', onMove);
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
 * EXPERIMENTAL: persistent video stage + hero fade + per-card viewport reveal
 * -------------------------------------------------------------------------
 * Architecture: video is reparented to <body> as a fixed z-index:0 layer.
 * .desktop-content sits above (z-index:1). Hero + projects are transparent
 * so the video shows through. Negative margin on .main overlaps it with
 * the hero tail so cards enter the viewport as the hero foreground fades.
 * -------------------------------------------------------------------------
 * Disable: remove class "exp-scroll-hero" from <body> in index.html.
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

    const cards = document.querySelectorAll('#work .project-hero-list > .project-card.project-hero');
    const rootStyle = document.documentElement.style;

    function getVH() { return window.innerHeight || 0; }

    function smoothstep(t) {
        var x = Math.max(0, Math.min(1, t));
        return x * x * (3 - 2 * x);
    }

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

        var revealZone = h * 0.72;
        var travel = Math.min(h * 0.3, 250);

        var visible = Array.from(cards).filter(function(c) {
            return window.getComputedStyle(c).display !== 'none';
        });

        visible.forEach(function(card) {
            var inner = card.querySelector('.project-hero-inner');
            if (!inner) return;
            var top = card.getBoundingClientRect().top;
            var p = Math.min(1, Math.max(0, (h - top) / revealZone));
            var eased = smoothstep(p);
            var rise = (1 - eased) * travel;
            var opacity = smoothstep(Math.min(1, Math.max(0, (p - 0.04) / 0.22)));

            inner.style.transition = 'none';
            inner.style.opacity = String(opacity);
            inner.style.transform = 'translate3d(0,' + rise + 'px,0)';
        });

        cards.forEach(function(c) {
            if (window.getComputedStyle(c).display === 'none') {
                var inner = c.querySelector('.project-hero-inner');
                if (inner) {
                    inner.style.transition = '';
                    inner.style.opacity = '';
                    inner.style.transform = '';
                }
            }
        });

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

