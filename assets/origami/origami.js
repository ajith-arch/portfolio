
/*
 * Ajith — two-stage polygon assembly + liquid reveal.
 * Intro: 252 monochrome SVG clips -> scroll/swipe -> 252 color SVG clips.
 * Steady state: SVG retired; monochrome img beneath a destination-out color canvas.
 * The four auto sweeps, wobble algorithm and hover behavior adapt HOW-IT-WORKS.txt.
 *
 * Portfolio integration (ajithalphonse.com):
 *  - 1st scroll / swipe / key  -> colour shards assemble (page stays put)
 *  - 2nd scroll / swipe / key  -> page glides to #work; the hero fades out
 *  - The site's background video stays; the old two-image reveal is retired.
 */
(() => {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const root = document.body;
  const mesh = window.PORTRAIT_MESH;
  const svg = document.getElementById('shardsSvg');
  const bwLayer = document.getElementById('bwShards');
  const colorLayer = document.getElementById('colorShards');
  const wrapper = document.getElementById('portraitWrap');
  const canvas = document.getElementById('liquidCanvas');
  const bwImage = document.getElementById('basePortrait');
  const colorImage = document.getElementById('colorPortrait');
  const breakButton = document.getElementById('breakButton');
  const breakLabel = document.getElementById('breakLabel');
  const replayButton = document.getElementById('replayButton');
  const status = document.getElementById('status');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Durations include the final stagger on the individual polygon triangles.
  const BW_MOTION_MS = 1280;
  const COLOR_MOTION_MS = 1440;
  const BW_TOTAL_MS = 1950;
  const COLOR_TOTAL_MS = 2340;
  let phase = 'init';
  let phaseTimer = 0;
  let queuedColor = false;
  let wheelEnergy = 0;
  let touchStart = null;
  let resetToken = 0;
  let liquid = null;
  let assetsReady = false;

  function node(tag, attrs = {}) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
    return n;
  }

  function geometry() {
    const clips = document.createDocumentFragment();
    const defs = svg.querySelector('defs');
    for (let i = 0; i < mesh.shards.length; i++) {
      const piece = mesh.shards[i];
      const points = piece.p.map(([x,y]) => `${x},${y}`).join(' ');
      const clip = node('clipPath', {id:`facet-${i}`, clipPathUnits:'userSpaceOnUse'});
      clip.append(node('polygon', {points}));
      clips.append(clip);
    }
    defs.append(clips);
    addShards(bwLayer, '#bwAsset', 'bw');
    addShards(colorLayer, '#colorAsset', 'color');
    // The SVG is only retained in memory after the intro and is not repainted at rest.
    wrapper.dataset.bwShards = String(mesh.shards.length);
    wrapper.dataset.colorShards = String(mesh.shards.length);
  }

  function addShards(layer, imageRef, variant) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < mesh.shards.length; i++) {
      const piece = mesh.shards[i];
      const bw = variant === 'bw';
      const angle = i * (bw ? 2.3999632297 : 2.3999632297 + Math.PI/9) + (bw ? 0 : 0.16);
      const wave = 0.5 + Math.sin(i * (bw ? 11.73 : 17.27))*0.5;
      const travel = (bw ? 230 : 318) + (i%(bw ? 7 : 8))*(bw ? 33 : 41) + wave*(bw ? 85 : 125);
      const x = Math.cos(angle)*travel;
      const y = Math.sin(angle)*travel*(bw ? 0.72 : 0.84);
      const spin = (i%2 ? -1:1)*((bw?20:28)+(i*(bw?23:37))%(bw?96:125));
      const scale = (bw ? 0.72 + (i%5)*.05 : 0.58 + (i%7)*.08).toFixed(2);
      const delay = Math.round((1-piece.cy/mesh.height)*(bw?220:250)+(i*(bw?43:67))%(bw?340:460));
      const shard = node('g', {class:`svg-shard ${bw?'bw-shard':'color-shard'}`, 'clip-path':`url(#facet-${i})`});
      shard.append(node('use', {href:imageRef}));
      shard.style.setProperty('--origin-x', `${piece.cx}px`);
      shard.style.setProperty('--origin-y', `${piece.cy}px`);
      shard.style.setProperty('--scatter-x', `${x.toFixed(1)}px`);
      shard.style.setProperty('--scatter-y', `${y.toFixed(1)}px`);
      shard.style.setProperty('--rotate', `${spin}deg`);
      shard.style.setProperty('--scale', scale);
      shard.style.setProperty('--delay', `${delay}ms`);
      shard.style.setProperty('--duration', `${bw ? BW_MOTION_MS : COLOR_MOTION_MS}ms`);
      fragment.append(shard);
    }
    layer.append(fragment);
  }

  function updateCoordinates() {
    const w = Math.round(window.innerWidth), h = Math.round(window.innerHeight);
    document.getElementById('axisTopRight').textContent = `${w},0`;
    document.getElementById('axisBottomLeft').textContent = `0,${h}`;
    document.getElementById('axisBottomRight').textContent = `${w},${h}`;
  }

  function announce(text) {status.textContent = text;}
  function updateControl() {
    const canReassemble = phase === 'bw-scattered' || phase === 'color-scattered';
    breakLabel.textContent = canReassemble ? 'PUT IT TOGETHER' : 'BREAK IT APART';
    breakButton.setAttribute('aria-label', canReassemble ? 'Reassemble the portrait' : 'Scatter the portrait pieces');
    breakButton.dataset.tip = canReassemble ? 'Put it together' : 'Break it apart';
  }
  function cancelPhaseTimer() {clearTimeout(phaseTimer);phaseTimer=0;}

  function resetAll(keepQueue) {
    resetToken++;
    cancelPhaseTimer();
    liquid?.stop();
    phase = 'init';
    if (!keepQueue) queuedColor = false;
    wheelEnergy = 0;
    root.classList.remove('assemble-bw','has-bw','show-color','assemble-color','has-liquid');
    wrapper.style.transform = 'translate3d(0,0,0)';
    updateControl();
    announce('Black-and-white pieces are scattered.');
  }

  function assembleBW() {
    if (!assetsReady || !['init','bw-scattered'].includes(phase)) return;
    cancelPhaseTimer();
    phase = 'bw-assembling';
    root.classList.add('assemble-bw');
    updateControl();
    announce('Assembling black-and-white portrait.');
    phaseTimer = setTimeout(() => {
      root.classList.add('has-bw');
      phase = 'await-scroll';
      announce('Black-and-white portrait complete. Scroll down or swipe up to assemble color.');
      if (queuedColor) assembleColor();
    }, prefersReducedMotion ? 0 : BW_TOTAL_MS);
  }

  function assembleColor() {
    if (phase !== 'await-scroll' && phase !== 'color-scattered') return;
    cancelPhaseTimer();
    queuedColor = false;
    phase = 'color-assembling';
    root.classList.add('show-color');
    announce('Assembling the color portrait above black-and-white.');
    updateControl();
    // Separate animation frames guarantee scattered start positions before assembly.
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('assemble-color')));
    phaseTimer = setTimeout(() => {
      startLiquid();
    }, prefersReducedMotion ? 0 : COLOR_TOTAL_MS);
  }

  function startLiquid() {
    if (phase !== 'color-assembling') return;
    cancelPhaseTimer();
    phase = 'liquid';
    if (!prefersReducedMotion && liquid?.start()) {
      root.classList.add('has-liquid');
      announce('Color portrait complete. Move your cursor over the portrait to reveal black-and-white.');
    } else {
      // Accessible and canvas-unsupported fallback: finished SVG remains static.
      announce('Color portrait complete.');
    }
    updateControl();
  }

  function scatterBW() {
    cancelPhaseTimer();
    root.classList.remove('assemble-bw','has-bw','show-color','assemble-color','has-liquid');
    queuedColor = false;
    phase = 'bw-scattered';
    announce('Black-and-white portrait scattered.');
    updateControl();
  }

  function scatterColor() {
    cancelPhaseTimer();
    liquid?.stop();
    root.classList.remove('has-liquid');
    // Keep the B&W image as the stationary base; color shards scatter above it.
    root.classList.add('has-bw','show-color');
    requestAnimationFrame(() => root.classList.remove('assemble-color'));
    phase = 'color-scattered';
    announce('Color portrait scattered, black-and-white remains underneath.');
    updateControl();
  }

  function toggleBreak() {
    if (phase === 'color-scattered') {assembleColor();return;}
    if (phase === 'bw-scattered') {assembleBW();return;}
    if (phase === 'liquid' || phase === 'color-assembling') {scatterColor();return;}
    if (phase === 'await-scroll' || phase === 'bw-assembling') {scatterBW();return;}
    if (phase === 'init') assembleBW();
  }

  function replay(keepQueue) {
    resetAll(keepQueue === true);
    const token = resetToken;
    phaseTimer = setTimeout(() => {
      if (token===resetToken) assembleBW();
    }, prefersReducedMotion ? 0 : 260);
  }

  function requestColor() {
    if (phase === 'await-scroll') assembleColor();
    else if (phase === 'bw-assembling' || phase === 'init') queuedColor = true;
  }

  function loadImage(img) {
    return new Promise((resolve, reject) => {
      if (img.complete) return img.naturalWidth ? resolve() : reject(new Error('Unable to load '+img.src));
      img.addEventListener('load', () => resolve(), {once:true});
      img.addEventListener('error', () => reject(new Error('Unable to load '+img.src)), {once:true});
    });
  }
  async function init() {
    if (!mesh || mesh.shards.length !== 252) throw new Error('Expected the original 252-piece polygon mesh.');
    geometry();
    updateCoordinates();
    liquid = createLiquidEffect();
    await Promise.all([loadImage(bwImage),loadImage(colorImage)]);
    if (bwImage.decode && colorImage.decode) {
      await Promise.allSettled([bwImage.decode(),colorImage.decode()]);
    }
    assetsReady = true;
    // One-time peek at the button labels once the portrait has formed.
    const ctrls=document.querySelector('.hero-controls');
    if (ctrls) setTimeout(()=>{ctrls.classList.add('og-peek');setTimeout(()=>ctrls.classList.remove('og-peek'),3200);},2400);
    if (prefersReducedMotion) {
      root.classList.add('has-bw','assemble-bw');
      phase='await-scroll';
      announce('Black-and-white portrait complete. Scroll to reveal color.');
      updateControl();
    } else {
      replay(true);
    }
  }

  function createLiquidEffect() {
    const ctx=canvas.getContext('2d',{alpha:true});
    if (!ctx) return {start:()=>false,stop:()=>{}};
    let active=false, raf=0, last=0, w=0, h=0, radius=0, t=0;
    let opacity=0, hovering=false, smooth={x:-999,y:-999}, mouse={x:-999,y:-999};
    const parallax={x:0,y:0};
    let sweeps=[], nextCycleAt=0;
    const sweepConfigs=[
      {yRatio:.21, yArc:.025, dir:1, duration:2600, delay:900, timeOff:47, scale:.90},
      {yRatio:.32, yArc:.020, dir:-1,duration:2100,delay:3700,timeOff:23, scale:.85},
      {yRatio:.52, yArc:.020, dir:1,duration:1800,delay:6000,timeOff:71, scale:.85},
      {yRatio:.65, yArc:.020, dir:-1,duration:1800,delay:6000,timeOff:95, scale:.85}
    ];
    function resize() {
      const r=wrapper.getBoundingClientRect();
      w=r.width; h=r.height;
      if (w<=0 || h<=0) return;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      radius=Math.min(w,h)*.19;
    }
    function schedule(now) {
      sweeps=sweepConfigs.map(c=>({...c,startTime:now+c.delay,done:false,x:0,y:0,opacity:0,radius:0}));
      nextCycleAt=0;
    }
    function ease(v) {return v<.5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2;}
    function sweepAlpha(v) {return v<.12 ? v/.12 : v>.5 ? Math.max(0,1-(v-.5)/.5) : 1;}
    function blobNoise(angle,time) {
      return .28*Math.sin(2*angle+time*.6+Math.sin(time*.25)*.7) +
             .22*Math.sin(3*angle-time*.45+2.5)+.10*Math.sin(5*angle+time*.35+4.2);
    }
    function blob(x,y,r,time) {
      const count=32,points=[];
      for (let i=0;i<count;i++) {
        const angle=i/count*Math.PI*2,ri=r*(1+blobNoise(angle,time));
        points.push({x:x+Math.cos(angle)*ri,y:y+Math.sin(angle)*ri});
      }
      ctx.beginPath();
      ctx.moveTo((points[count-1].x+points[0].x)/2,(points[count-1].y+points[0].y)/2);
      for (let i=0;i<count;i++) {
        const next=(i+1)%count;
        ctx.quadraticCurveTo(points[i].x,points[i].y,(points[i].x+points[next].x)/2,(points[i].y+points[next].y)/2);
      }
      ctx.closePath();
    }
    function draw() {
      ctx.clearRect(0,0,w,h);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.drawImage(colorImage,0,0,w,h);
      ctx.globalCompositeOperation='destination-out';
      for (const s of sweeps) {
        if (s.done || s.opacity<.005) continue;
        ctx.globalAlpha=s.opacity;
        blob(s.x,s.y,s.radius,t+s.timeOff);ctx.fill();
      }
      if (opacity>.005) {
        ctx.globalAlpha=Math.min(1,opacity);
        blob(smooth.x,smooth.y,radius,t);ctx.fill();
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
    let offscreen=false;
    function loop(now) {
      if (!active || document.hidden || offscreen) {raf=0;return;}
      raf=requestAnimationFrame(loop);
      if (now-last<1000/40) return; // 40fps cap, no heavy animation when intro runs.
      const dt=Math.min(last ? now-last : 16.67,60);last=now;
      t+=dt*.003;
      const follow=1-Math.pow(.2,dt/16.67);
      const fade=1-Math.pow(.88,dt/16.67);
      const drift=1-Math.pow(.93,dt/16.67);
      smooth.x+=(mouse.x-smooth.x)*follow;
      smooth.y+=(mouse.y-smooth.y)*follow;
      opacity+=((hovering?1:0)-opacity)*fade;
      const tx=hovering ? ((mouse.x/w)-.5)*7 : 0;
      const ty=hovering ? ((mouse.y/h)-.5)*7 : 0;
      parallax.x+=(tx-parallax.x)*drift;
      parallax.y+=(ty-parallax.y)*drift;
      // Both static base and color canvas move together, never lose alignment.
      wrapper.style.transform=`translate3d(${parallax.x.toFixed(2)}px,${parallax.y.toFixed(2)}px,0)`;
      if (!nextCycleAt) {
        for (const s of sweeps) {
          if (s.done) continue;
          const elapsed=now-s.startTime;
          if (elapsed<0) continue;
          const raw=Math.min(elapsed/s.duration,1), p=ease(raw);
          s.x=(s.dir>0 ? .15+.7*p : .85-.7*p)*w;
          s.y=(s.yRatio+Math.sin(raw*Math.PI)*s.yArc)*h;
          s.opacity=sweepAlpha(raw);
          s.radius=radius*s.scale;
          if (raw>=1) s.done=true;
        }
        if (sweeps.every(s=>s.done)) nextCycleAt=now+5000;
      } else if (now>=nextCycleAt) schedule(now);
      draw();
    }
    function locate(e) {
      const box=wrapper.getBoundingClientRect();
      mouse.x=e.clientX-box.left;mouse.y=e.clientY-box.top;
    }
    function onEnter(e) {
      if (!active) return;
      locate(e);smooth={...mouse};hovering=true;
    }
    // Cursor may already be over the face when colour finishes: treat the first move as an enter.
    function onMove(e) {if (!active) return; if (!hovering) {locate(e);smooth={...mouse};hovering=true;} else locate(e);}
    function onLeave() {hovering=false;}
    if (canHover) {
      wrapper.addEventListener('pointerenter',onEnter);
      wrapper.addEventListener('pointermove',onMove);
      wrapper.addEventListener('pointerleave',onLeave);
    }
    window.addEventListener('resize',()=>{if (active){resize();draw();}},{passive:true});
    document.addEventListener('visibilitychange',()=>{
      if (!active) return;
      if (document.hidden) {cancelAnimationFrame(raf);raf=0;}
      else {last=0;schedule(performance.now());raf=requestAnimationFrame(loop);}
    });
    return {
      start() {
        if (active) return true;
        resize();
        if (!w || !h || !colorImage.naturalWidth) return false;
        active=true;last=0;opacity=0;hovering=false;
        wrapper.style.transform='translate3d(0,0,0)';
        schedule(performance.now());
        draw(); // Make the full-color frame available before switching SVG off.
        raf=requestAnimationFrame(loop);
        return true;
      },
      setOffscreen(v) {
        offscreen=v;
        if (!v && active && !raf && !document.hidden) {last=0;raf=requestAnimationFrame(loop);}
      },
      stop() {
        active=false;hovering=false;opacity=0;
        cancelAnimationFrame(raf);raf=0;
        wrapper.style.transform='translate3d(0,0,0)';
      }
    };
  }

  /* ------------------------------------------------------------------
   * Scroll gate: two steps before the page scrolls normally.
   *   stage 0: next downward gesture assembles colour (page stays put)
   *   stage 1: next NEW downward gesture glides to #work, hero fades
   *   stage 2: free scrolling
   * A trackpad fling sends many wheel events; a gap of 260ms with no
   * events marks the start of a new gesture, so one fling = one step.
   * ------------------------------------------------------------------ */
  const html = document.documentElement;
  const work = document.getElementById('work');
  let stage = 0, gesture = 0, stepGesture = -1, lastWheel = 0, energy = 0, gliding = false;
  const atTop = () => (window.scrollY || window.pageYOffset) < 8;

  function setStage(n) {
    stage = n;
    html.classList.toggle('og-lock', stage < 2);
    root.classList.toggle('og-free', stage >= 2);
    root.classList.toggle('og-ready-to-leave', stage === 1);
  }

  function step() {
    if (stage === 0) {
      requestColor();
      setStage(1);
      announce('Scroll again to see the work.');
    } else if (stage === 1) {
      glideToWork();
    }
  }

  function glideToWork() {
    if (!work) { setStage(2); return; }
    setStage(2);
    const start = window.scrollY || window.pageYOffset;
    const target = Math.max(0, work.getBoundingClientRect().top + start - 24);
    if (prefersReducedMotion) { window.scrollTo(0, target); return; }
    const dist = target - start, dur = 1800, t0 = performance.now();
    const ease = (v) => v < .5 ? 4*v*v*v : 1 - Math.pow(-2*v + 2, 3) / 2;
    // During the glide the hero fades by time (slow and even), not by scroll distance.
    const fg = document.querySelector('.hero-foreground-scroll');
    const fadeEls = root.classList.contains('exp-scroll-hero') && fg ? [fg] : (fadeTargets || []);
    gliding = true;
    root.classList.add('og-gliding');
    html.style.scrollBehavior = 'auto';
    (function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + dist * ease(p));
      const f = Math.min(1, p / 0.9);               // fully faded just before landing
      const o = 1 - (f * f * (3 - 2 * f));          // smoothstep
      for (const el of fadeEls) el.style.opacity = o.toFixed(3);
      if (p < 1 && gliding) requestAnimationFrame(frame);
      else {
        gliding = false;
        root.classList.remove('og-gliding');
        html.style.scrollBehavior = '';
        window.dispatchEvent(new Event('scroll'));  // let the site's scroll fade take over again
      }
    })(t0);
  }

  function gateActive() { return stage < 2 && atTop() && !gliding; }

  function onWheel(e) {
    if (gliding) { e.preventDefault(); return; }
    if (!gateActive()) return;
    if (e.ctrlKey) return;                         // pinch-zoom
    if (e.deltaY <= 0) return;                     // scrolling up at the top: nothing to do
    e.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 260) { gesture++; energy = 0; }
    lastWheel = now;
    if (gesture === stepGesture) return;           // still the same fling that did the last step
    energy += Math.min(e.deltaY, 120);
    if (energy >= 54) { energy = 0; stepGesture = gesture; step(); }
  }

  let touchY = null;
  function onTouchStart(e) { if (e.touches.length === 1) touchY = e.touches[0].clientY; }
  function onTouchMove(e) {
    if (gliding || (gateActive() && touchY !== null && touchY - e.touches[0].clientY > 0)) e.preventDefault();
  }
  function onTouchEnd(e) {
    if (touchY === null || !e.changedTouches.length) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (gateActive() && dy > 40) step();
  }
  function onKeyDown(e) {
    if (!gateActive()) return;
    if (!['ArrowDown', 'PageDown', ' '].includes(e.key)) return;
    const t = e.target;
    if (t instanceof HTMLButtonElement || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t && t.isContentEditable)) return;
    e.preventDefault();
    step();
  }

  // Any other way of leaving the top (nav link, scrollbar, find-in-page) frees the page.
  function onScroll() {
    if (stage < 2 && !gliding && (window.scrollY || window.pageYOffset) > window.innerHeight * 0.5) setStage(2);
    if (fadeTargets && !gliding) fadeOnScroll();
  }

  /* On phones and with reduced motion the site's scroll-hero fade is off,
     so fade the hero pieces here instead. */
  let fadeTargets = null;
  function fadeOnScroll() {
    const p = Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset) / (window.innerHeight * 0.6)));
    for (const el of fadeTargets) el.style.opacity = String(1 - p);
  }

  // Pause the liquid canvas when the portrait is off screen or fully faded.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const en of entries) liquid?.setOffscreen?.(!en.isIntersecting);
    }).observe(wrapper);
  }

  breakButton.addEventListener('click',toggleBreak);
  replayButton.addEventListener('click',() => {
    replay();
    if (atTop()) { setStage(0); stepGesture = gesture; }
  });
  window.addEventListener('wheel',onWheel,{passive:false});
  document.addEventListener('touchstart',onTouchStart,{passive:true});
  document.addEventListener('touchmove',onTouchMove,{passive:false});
  document.addEventListener('touchend',onTouchEnd,{passive:true});
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',updateCoordinates,{passive:true});
  // Start locked only if the page opens at the top (not on a #work link or a restored scroll).
  setStage(atTop() && !location.hash ? 0 : 2);
  // Run after the site's own DOMContentLoaded setup so we know which fade mode is on.
  document.addEventListener('DOMContentLoaded', () => {
    if (!root.classList.contains('exp-scroll-hero')) {
      fadeTargets = Array.prototype.slice.call(document.querySelectorAll('.hero-identity, .hero-inner, .coordinate-grid, .hero-controls'));
      fadeOnScroll();
    }
  });
  init().catch((err)=>{
    console.error('Portrait initialization failed:',err);
    status.textContent='Portrait image could not load.';
    bwImage.style.opacity=1;
  });
})();

