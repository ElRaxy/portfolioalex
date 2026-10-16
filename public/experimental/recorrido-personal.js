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
  // End pure geometry.
  const add = (wrapper, kind, targets) => {
    if (wrapper && targets.length) entries.push({wrapper, kind, targets, last:null});
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
    add(wrapper, 'drawing', [...wrapper.querySelectorAll('[pathLength="1"]')]);
  });
  const paused = () => suspended || document.hidden || !document.hasFocus();
  const neutral = () => reduced.matches || root.classList.contains('keyboard');
  const apply = (entry, value, width, quiet = false) => {
    const key = `${value}:${width}:${quiet}`;
    if (entry.last === key) return;
    entry.last = key;
    entry.targets.forEach(target => {
      if (entry.kind === 'accent') target.style.transform = `scaleX(${quiet ? 1 : .2 + .8 * value})`;
      else if (entry.kind === 'drawing') target.style.strokeDashoffset = String(quiet ? 0 : 1 - value);
      else target.style.transform = depthPose(entry.kind, value, width, quiet);
    });
  };
  const pause = () => { cancelAnimationFrame(frame); frame = 0; };
  const settle = () => {
    pause(); entries.forEach(entry => apply(entry, 1, window.innerWidth, true));
  };
  const render = () => {
    frame = 0;
    if (paused()) return;
    const height = window.innerHeight, width = window.innerWidth;
    const travel = root.scrollHeight - height;
    const disabled = neutral();
    const headerHeight = parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0;
    // Read each fixed wrapper once, even when it carries several independent visual planes.
    const rectangles = new Map();
    near.forEach(entry => { if (!rectangles.has(entry.wrapper)) rectangles.set(entry.wrapper, entry.wrapper.getBoundingClientRect()); });
    const poses = [...near].map(entry => {
      const rect = rectangles.get(entry.wrapper);
      const quiet = disabled || !rect.width || !rect.height || (entry.kind.startsWith('hero-') && window.portfolioEntry?.active);
      const p = entry.kind.startsWith('hero-') ? clamp((headerHeight - rect.top) / (Math.max(height, rect.height) * .85))
        : ['drawing','accent'].includes(entry.kind) ? arrival(rect.top, height) : depthProgress(rect.top, rect.height, height);
      return [entry, p, quiet];
    });
    if (progress) progress.style.transform = `scaleX(${travel > 0 ? clamp(window.scrollY / travel) : 0})`;
    if (disabled) entries.forEach(entry => apply(entry, 1, width, true));
    else poses.forEach(([entry, value, quiet]) => apply(entry, value, width, quiet));
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
    changes.forEach(({target, isIntersecting, boundingClientRect}) => {
      byWrapper.get(target).forEach(entry => {
        if (isIntersecting) near.add(entry);
        else {
          near.delete(entry);
          if (!paused()) apply(entry, boundingClientRect.top < 0 ? 1 : 0, window.innerWidth, neutral());
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
