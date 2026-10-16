/* One position owns one pose. Reading, controls and native scrolling never move for decoration. */
(() => {
  if (!document.body.classList.contains('personal-world') || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width:759px)');
  const root = document.documentElement;
  const progress = document.querySelector('.reading-progress');
  const entries = [], near = new Set();
  let frame = 0, suspended = false;
  const add = (wrapper, kind, targets) => {
    if (wrapper && targets.length) entries.push({wrapper, kind, targets, last:null});
  };
  document.querySelectorAll('.journey-window').forEach(wrapper => add(wrapper, 'media', [...wrapper.querySelectorAll('.journey-media')]));
  document.querySelectorAll('.journey-accent').forEach(target => add(target.parentElement, 'accent', [target]));
  document.querySelectorAll('section:not(.hero-personal) [data-world-scene]').forEach(wrapper => {
    add(wrapper, 'drawing', [...wrapper.querySelectorAll('[pathLength="1"]')]);
    const gesture = wrapper.querySelector('.web-piece,.automation-cable,.review-pencil,.code-symbol,.work-sheet,.talk-pencil');
    if (gesture) add(wrapper, 'gesture', [gesture]);
  });
  const blocked = () => suspended || reduced.matches || document.hidden || !document.hasFocus() || root.classList.contains('keyboard');
  const arrival = (top, height) => {
    const p = Math.max(0, Math.min(1, (.92 * height - top) / (.30 * height)));
    return p >= 1 - 1e-9 ? 1 : p * p * (3 - 2 * p);
  };
  const apply = (entry, value) => {
    if (entry.last === value) return;
    entry.last = value;
    const remaining = 1 - value;
    entry.targets.forEach(target => {
      if (entry.kind === 'media') {
        target.style.transform = value === 1 ? 'none' : `translate3d(0,${remaining * (compact.matches ? 12 : 24)}px,0) scale(${1 + remaining * (compact.matches ? .02 : .035)})`;
        target.style.clipPath = value === 1 ? 'none' : `inset(0 0 ${remaining * 8}% 0 round 4px)`;
      } else if (entry.kind === 'accent') {
        target.style.transform = `scaleX(${.2 + .8 * value})`;
      } else if (entry.kind === 'drawing') {
        target.style.strokeDashoffset = String(remaining);
      } else {
        target.style.transform = value === 1 ? 'none' : `translate(${remaining * 8}px,${remaining * -4}px) rotate(${remaining * -5}deg)`;
      }
    });
  };
  const settle = () => {
    cancelAnimationFrame(frame); frame = 0;
    entries.forEach(entry => apply(entry, 1));
  };
  const render = () => {
    frame = 0;
    const height = window.innerHeight;
    const travel = root.scrollHeight - height;
    const end = window.scrollY >= travel - 1;
    const disabled = blocked();
    // Read stable wrappers as a batch. Transformed children cannot feed back into progress.
    const poses = [...near].map(entry => {
      const rect = entry.wrapper.getBoundingClientRect();
      const focused = entry.wrapper.closest('.project,.hero-note,.about-heading-row,.work-heading,.contact-intro')?.contains(document.activeElement);
      return [entry, disabled || end || focused || !rect.width || !rect.height ? 1 : arrival(rect.top, height)];
    });
    if (progress) progress.style.transform = `scaleX(${travel > 0 ? Math.max(0, Math.min(1, window.scrollY / travel)) : 0})`;
    if (disabled || end) entries.forEach(entry => apply(entry, 1));
    else poses.forEach(([entry, value]) => apply(entry, value));
  };
  const refresh = () => {
    if (suspended || document.hidden) return;
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
        else { near.delete(entry); apply(entry, blocked() || boundingClientRect.top < 0 ? 1 : 0); }
      });
    });
    refresh();
  }, {rootMargin:'150px', threshold:0});
  byWrapper.forEach((_, wrapper) => observer.observe(wrapper));
  window.portfolioJourney = Object.freeze({refresh, settle});
  window.addEventListener('scroll', refresh, {passive:true});
  window.addEventListener('resize', () => { entries.forEach(entry => { entry.last = null; }); refresh(); }, {passive:true});
  window.addEventListener('load', refresh);
  window.addEventListener('portfolio:entryend', refresh);
  window.addEventListener('hashchange', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('blur', settle);
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('focusin', refresh);
  document.addEventListener('focusout', refresh);
  document.addEventListener('keydown', event => {
    if (['Tab','Enter','Escape',' ','ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(event.key)) settle();
  });
  document.addEventListener('pointerdown', () => queueMicrotask(refresh));
  document.addEventListener('visibilitychange', () => document.hidden ? settle() : refresh());
  reduced.addEventListener('change', () => { settle(); refresh(); });
  window.addEventListener('pagehide', () => { suspended = true; settle(); observer.disconnect(); near.clear(); });
  window.addEventListener('pageshow', () => { suspended = false; byWrapper.forEach((_, wrapper) => observer.observe(wrapper)); refresh(); });
  document.fonts?.ready.then(refresh);
  refresh();
})();
