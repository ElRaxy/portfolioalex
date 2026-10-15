// One authority for the articulated character; arrival/FLIP still belong to the shared entrance.
(() => {
  if (window.portfolioCharacterController) return;
  const portrait = document.querySelector('.personal-portrait');
  const host = portrait?.querySelector('.portrait-rig');
  const image = host?.querySelector('img');
  const hero = portrait?.closest('.hero-personal');
  if (!host || !image || !hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(.23,1,.32,1)', drawer = 'cubic-bezier(.32,.72,0,1)';
  const motions = new Set();
  let rig = null, visible = false, keyboard = false, touch = null;
  let idleTimer = 0, generation = 0, turn = 0, activity = 'rest';
  const blocked = () => reduced.matches || keyboard || document.hidden || !document.hasFocus() || document.documentElement.classList.contains('keyboard');
  const live = () => Boolean(rig && visible && !blocked() && !window.portfolioEntry?.active);
  const state = value => { activity = value; host.dataset.characterState = value; };
  function stop({preservePose = false} = {}) {
    const pose = preservePose && rig && motions.size ? { head:getComputedStyle(rig.head).transform, gaze:getComputedStyle(rig.gaze).transform } : null;
    generation++;
    clearTimeout(idleTimer); idleTimer = 0;
    motions.forEach(motion => motion.cancel()); motions.clear();
    host.classList.add('character-paused');
    if (rig) { rig.head.style.transform = pose?.head || ''; rig.gaze.style.transform = pose?.gaze || ''; }
    if (pose) { rig.head.getBoundingClientRect(); host.classList.remove('character-paused'); }
    touch = null;
    state('rest');
  }
  function animate(element, frames, duration, easing = ease) {
    const motion = element.animate(frames, { duration, easing });
    motions.add(motion);
    motion.finished.catch(() => {}).finally(() => motions.delete(motion));
    return motion;
  }
  function schedule(delay = 4500 + Math.random() * 3000, kind = null) {
    if (idleTimer || !live()) return;
    idleTimer = setTimeout(() => {
      idleTimer = 0;
      if (live()) act(kind || ['type', 'glance', 'blink'][turn++ % 3]);
    }, delay);
  }
  function act(kind) {
    if (!live()) return false;
    stop();
    host.classList.remove('character-paused');
    const current = generation;
    state(kind);
    const sequence = [];
    if (kind === 'type') {
      sequence.push(animate(rig.head, [{transform:'rotate(0deg)'},{transform:'rotate(4deg)',offset:.22},{transform:'rotate(4deg)',offset:.72},{transform:'rotate(0deg)'}],1050,drawer));
      sequence.push(animate(rig.gaze, [{transform:'translate(0,0)'},{transform:'translate(-10px,16px)',offset:.2},{transform:'translate(-10px,16px)',offset:.74},{transform:'translate(0,0)'}],1050));
      sequence.push(animate(rig.hand, [0,-3,0,-3,0,-2.5,0].map(angle=>({transform:`rotate(${angle}deg)`})),880));
    } else if (kind === 'glance') {
      sequence.push(animate(rig.head,[{transform:'rotate(0deg)'},{transform:'rotate(-3.5deg)',offset:.35},{transform:'rotate(-3.5deg)',offset:.65},{transform:'rotate(0deg)'}],950,drawer));
      sequence.push(animate(rig.gaze,[{transform:'translate(0,0)'},{transform:'translate(-18px,-7px)',offset:.3},{transform:'translate(-18px,-7px)',offset:.65},{transform:'translate(0,0)'}],950));
    }
    if (kind !== 'type') rig.eyes.forEach(eye => sequence.push(animate(eye,[{transform:'scaleY(1)'},{transform:'scaleY(.1)',offset:.35},{transform:'scaleY(.1)',offset:.5},{transform:'scaleY(1)'}],220)));
    Promise.allSettled(sequence.map(motion => motion.finished)).then(() => {
      if (generation !== current) return;
      state('rest'); schedule();
    });
    return true;
  }
  window.portfolioCharacterController = { stop, act, get ready() { return Boolean(rig); }, get activity() { return activity; }, get activeMotions() { return motions.size; } };
  host.classList.add('is-image-loading');
  image.decode().then(() => { host.classList.remove('is-image-loading'); host.classList.add('is-image-decoded'); }).catch(() => { host.classList.remove('is-image-loading'); host.classList.add('is-image-failed'); });
  if (window.PortfolioCharacterRig) {
    window.PortfolioCharacterRig.mount(host, image).then(value => { rig = value; schedule(); });
    const story = document.querySelector('.story-character');
    const storyImage = story?.querySelector('img');
    if (story && storyImage && window.portfolioEntry?.active) {
      window.PortfolioCharacterRig.mount(story, storyImage, { active: () => Boolean(window.portfolioEntry?.active) }).then(value => {
        if (!value || !window.portfolioEntry?.active) return;
        const phase = document.querySelector('.intro-story')?.getAnimations().find(animation => animation.animationName === 'storyExit')?.currentTime || 0;
        story.style.setProperty('--character-story-delay', `-${phase}ms`);
        story.classList.add('character-acting');
      });
    }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    const entry = entries[0];
    visible = entry.isIntersecting && entry.intersectionRatio >= .18;
    if (visible) schedule(); else stop();
  },{threshold:[0,.18]}).observe(portrait);
  document.addEventListener('pointermove', event => {
    if (touch?.id === event.pointerId && Math.hypot(event.clientX-touch.x,event.clientY-touch.y) >= 10) touch = null;
    if (!live() || !fine.matches || !['mouse','pen'].includes(event.pointerType) || event.buttons) return;
    if (!hero.contains(event.target)) { if (activity === 'pointer') { stop(); schedule(); } return; }
    if (activity !== 'pointer') { stop({preservePose:true}); host.classList.remove('character-paused'); state('pointer'); }
    const box = image.getBoundingClientRect();
    if (!box.width || !box.height) return;
    let x = (event.clientX-box.left-box.width*.51)/(box.width*.5);
    let y = (event.clientY-box.top-box.height*.27)/(box.height*.5);
    const length = Math.max(1,Math.hypot(x,y)); x /= length; y /= length;
    rig.head.style.transform = `rotate(${3*x}deg)`;
    rig.gaze.style.transform = `translate(${20*x}px,${12*y}px)`;
  });
  hero.addEventListener('pointerleave', () => { stop(); schedule(); });
  portrait.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.isPrimary === false || !rig || !visible || reduced.matches || document.hidden) return;
    keyboard = false; stop();
    touch = { id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now() };
  });
  portrait.addEventListener('pointerup', event => {
    const gesture = touch; touch = null;
    if (!gesture || gesture.id !== event.pointerId || performance.now()-gesture.time > 500 || Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y) >= 10 || !live()) return;
    act('glance');
  });
  portrait.addEventListener('pointercancel', stop);
  window.addEventListener('scroll', () => { stop(); schedule(); },{passive:true});
  window.addEventListener('wheel', () => { keyboard = false; stop(); schedule(); },{passive:true});
  document.addEventListener('keydown', event => {
    const pageKey = ['Home','End','PageUp','PageDown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);
    if (['Shift','Control','Alt','Meta'].includes(event.key) || event.altKey || ((event.ctrlKey || event.metaKey) && !pageKey)) return;
    keyboard = true; stop();
  });
  document.addEventListener('pointerdown', () => { keyboard = false; schedule(); });
  window.addEventListener('portfolio:entryend', () => { stop(); if (window.portfolioEntry?.completed) schedule(700,'blink'); else schedule(); });
  window.addEventListener('blur',stop);
  window.addEventListener('focus',() => schedule());
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',event => { if(event.persisted) schedule(); });
  document.addEventListener('visibilitychange',() => { if(document.hidden) stop(); else schedule(); });
  reduced.addEventListener('change',() => { if(reduced.matches) stop(); else schedule(); });
  fine.addEventListener('change',() => { stop(); schedule(); });
})();
