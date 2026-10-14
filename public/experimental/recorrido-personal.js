/* Travesuras1013: bounded illustration gestures; links, reading and scrolling stay native. */
(() => {
  if (!document.body.classList.contains('personal-world') || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const drawings = [...document.querySelectorAll('[data-world-scene]')];
  const controls = [...document.querySelectorAll('.capability-link, .project-heading, .contact-options a, .name-composition, .portrait-scene')];
  const targets = [...drawings, ...controls];
  const active = new Map(), inside = new Set(), encounters = new Map(), pending = new Set();
  const entryCovered = new Set(window.portfolioEntry?.started ? drawings.filter(drawing => drawing.closest('.hero-personal')) : []);
  const ease = 'cubic-bezier(.23,1,.32,1)';
  let touch = null, suspended = false;
  const blocked = () => suspended || reduced.matches || document.hidden || !document.hasFocus() || document.documentElement.classList.contains('keyboard') || window.portfolioEntry?.active;
  const stop = owner => {
    active.get(owner)?.forEach(animation => animation.cancel());
    active.delete(owner);
  };
  const stopAll = () => { touch = null; targets.forEach(stop); };
  const animate = (owner, element, frames, duration = 420, delay = 0) => {
    if (!element) return;
    const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
    if (!active.has(owner)) active.set(owner, new Set());
    const batch = active.get(owner);
    batch.add(animation);
    animation.finished.then(() => {
      batch.delete(animation);
      if (!batch.size && active.get(owner) === batch) active.delete(owner);
    }).catch(() => {});
  };
  const draw = (owner, selector, delay = 0) => {
    owner.querySelectorAll(selector).forEach((path, index) => animate(owner, path,
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 360, delay + index * 60));
  };
  const play = owner => {
    if (!owner || !inside.has(owner) || (encounters.get(owner) || 0) >= 2 || active.has(owner)) return;
    if (window.portfolioEntry?.active && owner.closest('.hero-personal')) return;
    if (blocked()) { pending.add(owner); return; }
    pending.delete(owner);
    encounters.set(owner, (encounters.get(owner) || 0) + 1);
    const scene = owner.dataset.worldScene;
    if (scene === 'name') {
      draw(owner, '.name-stroke');
    } else if (scene === 'web') {
      animate(owner, owner.querySelector('.web-piece'), [
        { transform: 'translate(3px,-2px) rotate(-5deg)' }, { transform: 'translate(0,0) rotate(0deg)' }
      ], 420);
      animate(owner, owner.querySelector('.web-cursor'), [
        { transform: 'translate(4px,2px)' }, { transform: 'translate(0,0)' }
      ], 480);
    } else if (scene === 'automation') {
      animate(owner, owner.querySelector('.automation-knot'), [{ opacity: 1 }, { opacity: 0 }], 420);
      animate(owner, owner.querySelector('.automation-cable'), [{ opacity: 0 }, { opacity: 1 }], 420, 80);
    } else if (scene === 'review') {
      draw(owner, '.review-strike');
      draw(owner, '.review-rewrite', 180);
      animate(owner, owner.querySelector('.review-pencil'), [
        { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }
      ], 480, 60);
    } else if (scene === 'code' && owner.matches('.portrait-code')) {
      animate(owner, owner.querySelector('.portrait-bug'), [
        { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }
      ], 420);
      draw(owner, '.bug-bracket', 80);
    } else if (scene === 'code') {
      draw(owner, '.code-line');
      animate(owner, owner.querySelector('.code-caret'), [
        { transform: 'translateX(-10px)', opacity: .35 },
        { transform: 'translateX(0)', opacity: 1 }
      ], 480, 60);
      animate(owner, owner.querySelector('.code-symbol'), [
        { transform: 'scaleX(.88)' }, { transform: 'scaleX(1)' }
      ], 420);
    } else if (scene === 'work') {
      animate(owner, owner.querySelector('.work-sheet'), [
        { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }
      ], 420);
      draw(owner, '.work-clip');
      draw(owner, '.work-connect', 120);
    } else if (scene === 'talk') {
      animate(owner, owner.querySelector('.talk-pencil'), [
        { transform: 'translate(-4px,2px)' }, { transform: 'translate(0,0)' }
      ], 480);
      draw(owner, '.talk-line', 120);
      animate(owner, owner.querySelector('.note-corner'), [
        { transform: 'rotate(-4deg)' }, { transform: 'rotate(0deg)' }
      ], 360);
    } else if (owner.matches('.project-heading')) {
      draw(owner, '.project-accent path');
    } else {
      animate(owner, owner.querySelector('.contact-option-arrow, span[aria-hidden]'), [
        { transform: 'translate(0,0)' },
        { transform: 'translate(3px,-3px)', offset: .45 },
        { transform: 'translate(0,0)' }
      ], 320);
    }
  };
  const interact = control => {
    if (control.matches('.portrait-scene')) {
      play(control.querySelector('.portrait-code'));
      return;
    }
    if (control.matches('.name-composition')) {
      play(control.querySelector('[data-world-scene="name"]'));
      return;
    }
    play(control);
    const localDrawing = control.closest('.hero-note')?.querySelector('[data-world-scene]');
    play(localDrawing || control.closest('section')?.querySelector('[data-world-scene]'));
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) {
        inside.delete(target); encounters.delete(target); pending.delete(target); stop(target);
        if (touch?.target === target) touch = null;
        return;
      }
      if (inside.has(target)) return;
      inside.add(target);
      // The CSS entrance already presented these drawings, including with a late IO callback.
      if (entryCovered.delete(target)) encounters.set(target, 1);
      else if (target.dataset.worldScene || target.matches('.project-heading')) play(target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -28px 0px' });
  targets.forEach(target => observer.observe(target));
  controls.forEach(control => {
    control.addEventListener('pointerenter', event => {
      if (fine.matches && ['mouse', 'pen'].includes(event.pointerType)) interact(control);
    });
    control.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch') stop(control);
    });
    control.addEventListener('pointerdown', event => {
      // Do not block the first physical touch after Tab: app.js clears modality on bubbling.
      if (event.pointerType !== 'touch' || event.isPrimary === false || reduced.matches || suspended || document.hidden || !document.hasFocus()) return;
      touch = { target: control, id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
    });
    control.addEventListener('pointermove', event => {
      if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) >= 10) touch = null;
    });
    control.addEventListener('pointerup', event => {
      const gesture = touch;
      touch = null;
      if (!gesture || gesture.target !== control || gesture.id !== event.pointerId || performance.now() - gesture.time > 500 || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 10) return;
      interact(control);
    });
    control.addEventListener('pointercancel', () => { touch = null; stop(control); });
    if (control.matches('.project-heading')) control.parentElement.addEventListener('toggle', () => {
      if (control.parentElement.open) play(control);
    });
  });
  window.addEventListener('scroll', () => { touch = null; }, { passive: true });
  const resumePending = () => { if (!blocked()) [...pending].forEach(play); };
  window.addEventListener('focus', resumePending);
  window.addEventListener('portfolio:entryend', resumePending);
  document.addEventListener('pointerdown', () => queueMicrotask(resumePending));
  reduced.addEventListener('change', () => { stopAll(); resumePending(); });
  fine.addEventListener('change', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); else resumePending(); });
  window.addEventListener('blur', stopAll);
  document.addEventListener('keydown', event => {
    if (['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', ' '].includes(event.key)) stopAll();
  });
  window.addEventListener('pagehide', () => {
    suspended = true; stopAll(); observer.disconnect(); inside.clear(); encounters.clear(); pending.clear();
  });
  window.addEventListener('pageshow', () => {
    suspended = false; targets.forEach(target => observer.observe(target));
  });
})();
