/* One scroll position owns one pose; separate paper, illustration and media planes. */
(() => {
  if (!document.body.classList.contains('personal-world') || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const progress = document.querySelector('.reading-progress');
  const entries = [], near = new Set();
  let frame = 0, suspended = false;
  // Pure geometry: independent of frame rate, direction and time spent at a position.
  const clamp = value => Math.max(0, Math.min(1, value));
  const amplitude = (width, mobile, tablet, desktop) => width <= 820
    ? mobile + (tablet - mobile) * clamp((width - 390) / 430)
    : tablet + (desktop - tablet) * clamp((width - 820) / 620);
  const arrival = (top, height) => {
    const p = clamp((.92 * height - top) / (.30 * height));
    return p >= 1 - 1e-9 ? 1 : p * p * (3 - 2 * p);
  };
  const depthProgress = (top, size, height) => clamp((height - top) / Math.max(1, height + size));
  const depthPose = (kind, position, width, neutral = false) => {
    const p = neutral ? (kind.startsWith('hero-') ? 0 : .5) : position;
    const d = 1 - 2 * p;
    if (kind === 'hero-portrait') return `translate3d(0,${-amplitude(width,34,64,112) * p}px,0)`;
    if (kind === 'hero-paper') return `translate3d(0,${amplitude(width,16,28,48) * p}px,0) rotate(${-4 + 2 * p}deg)`;
    if (kind === 'hero-doodle') return `translate3d(0,${amplitude(width,10,20,32) * p}px,0)`;
    if (kind === 'media') return `translate3d(0,${amplitude(width,16,24,36) * d}px,0)`;
    if (kind === 'paper') return `translate3d(0,${-amplitude(width,12,20,28) * d}px,0) rotate(${-6 - 2 * d}deg)`;
    const y = kind === 'talk' ? amplitude(width,20,30,44) : amplitude(width,16,26,36);
    return `translate3d(${amplitude(width,4,8,12) * d}px,${y * d}px,0) rotate(${-3 * d}deg)`;
  };
  const heightWeight = height => Math.max(.3, clamp((height - 260) / 440));
  // Clamp the end to reachable scroll, rather than resetting the whole scene at page bottom.
  const sceneArrival = (top, height, scroll, travel, start = .96, end = .64) => {
    const docTop = top + scroll, from = docTop - start * height;
    const to = Math.min(docTop - end * height, Math.max(0, travel));
    if (to <= from) return 1;
    if (start === .92 && end === .62 && to === docTop - end * height) return arrival(top,height);
    const p = clamp((scroll - from) / (to - from));
    return p >= 1 - 1e-9 ? 1 : p * p * (3 - 2 * p);
  };
  const journeyPose = (kind, depth, width, quiet = false, presented = 1, height = 700, size = 0) => {
    const weight = heightWeight(height), remaining = quiet ? 0 : 1 - presented;
    if (kind === 'heading') return `translate3d(0,${amplitude(width,22,32,48) * weight * remaining}px,0)`;
    const base = depthPose(kind, depth, width, quiet);
    if (quiet) return base;
    if (kind === 'hero-portrait') return `${base} scale(${1 - amplitude(width,.015,.025,.035) * weight * depth})`;
    if (kind === 'media' && remaining > 0) return `perspective(${Math.max(1000,4 * size)}px) ${base} rotateX(${amplitude(width,4,7,10) * weight * remaining}deg) scale(${1 - amplitude(width,.045,.075,.10) * weight * remaining})`;
    return base;
  };
  // End pure geometry.
  const add = (wrapper, kind, targets) => {
    if (wrapper && targets.length) entries.push({wrapper, kind, targets, order:Number(targets[0].dataset?.journeyOrder) || 0, project:wrapper.closest('.project'), last:null});
  };
  document.querySelectorAll('[data-parallax-scene]').forEach(wrapper => {
    wrapper.querySelectorAll('[data-parallax-layer]').forEach(target => {
      if (target.closest('[data-parallax-scene]') !== wrapper) return;
      const kind = target.dataset.parallaxLayer;
      add(wrapper, kind === 'sketch' && wrapper.closest('#contacto') ? 'talk' : kind, [target]);
    });
  });
  document.querySelectorAll('.journey-accent').forEach(target => add(target.parentElement, 'accent', [target]));
  document.querySelectorAll('section:not(.hero-personal) [data-world-scene]').forEach(wrapper => {
    const strokes = [...wrapper.querySelectorAll('[pathLength="1"]')];
    strokes.forEach((target, index) => {
      add(wrapper, 'drawing', [target]);
      entries[entries.length - 1].order = index / Math.max(1, strokes.length - 1);
    });
  });
  const paused = () => suspended || document.hidden || !document.hasFocus();
  const neutral = () => reduced.matches || root.classList.contains('keyboard');
  const apply = (entry, value, width, quiet = false, presented = 1, height = 700, size = 0) => {
    const key = `${value}:${width}:${quiet}:${presented}:${height}:${size}`;
    if (entry.last === key) return;
    entry.last = key;
    entry.targets.forEach(target => {
      if (entry.kind === 'accent') target.style.transform = `scaleX(${quiet ? 1 : .2 + .8 * value})`;
      else if (entry.kind === 'drawing') target.style.strokeDashoffset = String(quiet ? 0 : 1 - value);
      else target.style.transform = journeyPose(entry.kind, value, width, quiet, presented, height, size);
    });
  };
  const pause = () => { cancelAnimationFrame(frame); frame = 0; };
  const settle = () => {
    pause(); entries.forEach(entry => apply(entry, 1, window.innerWidth, true));
  };
  const frameGeometry = () => ({height:window.innerHeight, width:window.innerWidth, scroll:window.scrollY,
    travel:Math.max(0, root.scrollHeight - window.innerHeight),
    header:parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0});
  const poseFor = (entry, rect, view) => {
    const {height, width, scroll, travel, header} = view;
    const quiet = neutral() || !rect.width || !rect.height || (entry.kind.startsWith('hero-') && window.portfolioEntry?.active);
    const secondColumn = width >= 1000 && entry.project?.id !== 'strev' && !entry.project?.open && rect.left > width / 2;
    const presented = entry.kind === 'media' ? sceneArrival(rect.top,height,scroll,travel,secondColumn ? .945 : .98,.60)
      : sceneArrival(rect.top,height,scroll,travel,.96 - .035 * entry.order,.64);
    const p = entry.kind.startsWith('hero-') ? clamp((header - rect.top) / (Math.max(height,rect.height) * .85))
      : entry.kind === 'drawing' ? sceneArrival(rect.top,height,scroll,travel,.96 - .04 * entry.order,.64)
      : entry.kind === 'accent' ? sceneArrival(rect.top,height,scroll,travel,.92,.62) : depthProgress(rect.top,rect.height,height);
    return [entry,p,width,quiet,presented,height,rect.height];
  };
  const render = () => {
    frame = 0;
    if (paused()) return;
    const view = frameGeometry(), {travel, width} = view;
    const disabled = neutral();
    // Read each fixed wrapper once, even when it carries several independent visual planes.
    const rectangles = new Map();
    near.forEach(entry => { if (!rectangles.has(entry.wrapper)) rectangles.set(entry.wrapper, entry.wrapper.getBoundingClientRect()); });
    const poses = [...near].map(entry => poseFor(entry, rectangles.get(entry.wrapper), view));
    if (progress) progress.style.transform = `scaleX(${travel > 0 ? clamp(window.scrollY / travel) : 0})`;
    if (disabled) entries.forEach(entry => apply(entry, 1, width, true));
    else poses.forEach(pose => apply(...pose));
  };
  const refresh = () => {
    if (paused()) return;
    if (!frame) frame = requestAnimationFrame(render);
  };
  const byWrapper = new Map();
  entries.forEach(entry => {
    if (!byWrapper.has(entry.wrapper)) byWrapper.set(entry.wrapper, []);
    byWrapper.get(entry.wrapper).push(entry);
  });
  const observer = new IntersectionObserver(changes => {
    const view = frameGeometry();
    changes.forEach(({target, isIntersecting, boundingClientRect}) => {
      byWrapper.get(target).forEach(entry => {
        if (isIntersecting) near.add(entry);
        else {
          near.delete(entry);
          if (!paused()) apply(...poseFor(entry, boundingClientRect, view));
        }
      });
    });
    refresh();
  }, {rootMargin:'180px', threshold:0});
  byWrapper.forEach((_, wrapper) => observer.observe(wrapper));
  window.portfolioJourney = Object.freeze({refresh, settle});
  window.addEventListener('scroll', refresh, {passive:true});
  window.addEventListener('resize', refresh, {passive:true});
  window.addEventListener('load', refresh);
  window.addEventListener('portfolio:entryend', refresh);
  window.addEventListener('hashchange', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('blur', pause);
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('focusin', refresh);
  document.addEventListener('focusout', refresh);
  document.addEventListener('keydown', event => {
    if (['Tab','Enter','Escape',' ','ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(event.key)) settle();
  });
  document.addEventListener('pointerdown', () => queueMicrotask(refresh));
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : refresh());
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); else refresh(); });
  window.addEventListener('pagehide', () => { suspended = true; pause(); observer.disconnect(); near.clear(); });
  window.addEventListener('pageshow', () => { suspended = false; byWrapper.forEach((_, wrapper) => observer.observe(wrapper)); refresh(); });
  document.fonts?.ready.then(refresh);
  refresh();
})();
