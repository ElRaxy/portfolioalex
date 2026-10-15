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
  const motions = new Set(), blinkMotions = new Set();
  let rig = null, visible = false, keyboard = false, touch = null;
  let idleTimer = 0, blinkTimer = 0, generation = 0, turn = 0, activity = 'rest';
  const blocked = () => reduced.matches || keyboard || document.hidden || !document.hasFocus() || document.documentElement.classList.contains('keyboard');
  const live = () => Boolean(rig && visible && !blocked() && !window.portfolioEntry?.active);
  const state = value => { activity = value; host.dataset.characterState = value; };
  function stop({preservePose = false} = {}) {
    const pose = preservePose && rig ? { head:getComputedStyle(rig.head).transform, gaze:getComputedStyle(rig.gaze).transform } : null;
    generation++;
    clearTimeout(idleTimer); idleTimer = 0;
    clearTimeout(blinkTimer); blinkTimer = 0;
    motions.forEach(motion => motion.cancel()); motions.clear(); blinkMotions.clear();
    host.classList.add('character-paused');
    if (rig) { rig.head.style.transform = pose?.head || ''; rig.gaze.style.transform = pose?.gaze || ''; }
    if (pose) { rig.head.getBoundingClientRect(); host.classList.remove('character-paused'); }
    touch = null;
    state('rest');
    return pose;
  }
  function animate(element, frames, duration, easing = ease, delay = 0) {
    const motion = element.animate(frames, { duration, easing, delay });
    motions.add(motion);
    motion.finished.catch(() => {}).finally(() => { motions.delete(motion); blinkMotions.delete(motion); });
    return motion;
  }
  function animateBeats(element, frames, duration, curve = ease) {
    // Offsets describe real time; easing belongs to each interval, not the whole action clock.
    return animate(element,frames.map(frame=>({...frame,easing:curve})),duration,'linear');
  }
  function scheduleBlink() {
    if (blinkTimer || blinkMotions.size || !live()) return;
    const current = generation;
    blinkTimer = setTimeout(() => {
      blinkTimer = 0;
      if (generation === current && live()) blink();
    },4000 + Math.random() * 3000);
  }
  function blink(delay = 0) {
    if (!live()) return [];
    if (blinkMotions.size) return [...blinkMotions];
    clearTimeout(blinkTimer); blinkTimer = 0;
    const current = generation;
    const sequence = rig.eyes.map(eye => {
      const motion = animate(eye,[{transform:'scaleY(1)',offset:0},{transform:'scaleY(.1)',offset:.32},{transform:'scaleY(.1)',offset:.46},{transform:'scaleY(1)',offset:1}],200,ease,delay);
      blinkMotions.add(motion);
      return motion;
    });
    Promise.allSettled(sequence.map(motion=>motion.finished)).then(() => {
      if (generation === current) scheduleBlink();
    });
    return sequence;
  }
  function schedule(delay = 4500 + Math.random() * 3000, kind = null) {
    if (idleTimer || !live() || activity !== 'rest') return;
    idleTimer = setTimeout(() => {
      idleTimer = 0;
      if (live() && activity === 'rest') act(kind || ['type','glance'][turn++ % 2]);
    }, delay);
  }
  function resume() { schedule(); scheduleBlink(); }
  function complete(sequence, current) {
    Promise.allSettled(sequence.map(motion=>motion.finished)).then(() => {
      if (generation !== current) return;
      state('rest'); resume();
    });
  }
  function settle() {
    if (!live()) return stop();
    if (activity === 'rest' || activity === 'settle') return;
    const pose = stop({preservePose:true}), current = generation;
    host.classList.add('character-paused');
    rig.head.style.transform = 'rotate(0deg)'; rig.gaze.style.transform = 'translate(0,0)';
    state('settle');
    const sequence = [
      animate(rig.gaze,[{transform:pose.gaze},{transform:'translate(0,0)'}],150),
      animate(rig.head,[{transform:pose.head},{transform:'rotate(0deg)'}],300,drawer)
    ];
    host.classList.remove('character-paused');
    scheduleBlink(); complete(sequence,current);
  }
  function act(kind) {
    if (!live()) return false;
    if (kind === 'blink') return blink().length > 0;
    stop();
    host.classList.remove('character-paused');
    const current = generation;
    state(kind);
    const sequence = [];
    if (kind === 'type') {
      sequence.push(animateBeats(rig.gaze,[{transform:'translate(0,0)',offset:0},{transform:'translate(-10px,16px)',offset:.08},{transform:'translate(-10px,16px)',offset:.72},{transform:'translate(0,0)',offset:.88},{transform:'translate(0,0)',offset:1}],1080));
      sequence.push(animateBeats(rig.head,[{transform:'rotate(0deg)',offset:0},{transform:'rotate(0deg)',offset:.1},{transform:'rotate(3.7deg)',offset:.3},{transform:'rotate(3.7deg)',offset:.69},{transform:'rotate(0deg)',offset:.9},{transform:'rotate(0deg)',offset:1}],1080,drawer));
      sequence.push(animateBeats(rig.hand,[{transform:'rotate(0deg)',offset:0},{transform:'rotate(0deg)',offset:.12},{transform:'rotate(-3.5deg)',offset:.18},{transform:'rotate(0deg)',offset:.25},{transform:'rotate(-2.8deg)',offset:.29},{transform:'rotate(0deg)',offset:.36},{transform:'rotate(0deg)',offset:.5},{transform:'rotate(-3.8deg)',offset:.58},{transform:'rotate(0deg)',offset:.65},{transform:'rotate(-2.2deg)',offset:.73},{transform:'rotate(0deg)',offset:.79},{transform:'rotate(0deg)',offset:1}],990));
    } else if (kind === 'ack') {
      sequence.push(animateBeats(rig.gaze,[{transform:'translate(0,0)',offset:0},{transform:'translate(10px,-5px)',offset:.14},{transform:'translate(10px,-5px)',offset:.58},{transform:'translate(0,0)',offset:.79},{transform:'translate(0,0)',offset:1}],820));
      sequence.push(animateBeats(rig.head,[{transform:'rotate(0deg)',offset:0},{transform:'rotate(0deg)',offset:.12},{transform:'rotate(-2.8deg)',offset:.34},{transform:'rotate(-2.8deg)',offset:.55},{transform:'rotate(0deg)',offset:.9},{transform:'rotate(0deg)',offset:1}],820,drawer));
      sequence.push(...blink(120));
    } else if (kind === 'glance') {
      sequence.push(animateBeats(rig.gaze,[{transform:'translate(0,0)',offset:0},{transform:'translate(-18px,-7px)',offset:.12},{transform:'translate(-18px,-7px)',offset:.62},{transform:'translate(0,0)',offset:.82},{transform:'translate(0,0)',offset:1}],950));
      sequence.push(animateBeats(rig.head,[{transform:'rotate(0deg)',offset:0},{transform:'rotate(0deg)',offset:.1},{transform:'rotate(-3.5deg)',offset:.32},{transform:'rotate(-3.5deg)',offset:.65},{transform:'rotate(0deg)',offset:1}],950,drawer));
    }
    scheduleBlink(); complete(sequence,current);
    return true;
  }
  window.portfolioCharacterController = { stop, act, get ready() { return Boolean(rig); }, get activity() { return activity; }, get activeMotions() { return motions.size; }, get pendingTimers() { return { idle:Boolean(idleTimer), blink:Boolean(blinkTimer) }; } };
  host.classList.add('is-image-loading');
  image.decode().then(() => { host.classList.remove('is-image-loading'); host.classList.add('is-image-decoded'); }).catch(() => { host.classList.remove('is-image-loading'); host.classList.add('is-image-failed'); });
  if (window.PortfolioCharacterRig) {
    window.PortfolioCharacterRig.mount(host, image).then(value => { rig = value; resume(); });
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
    if (visible) resume(); else stop();
  },{threshold:[0,.18]}).observe(portrait);
  document.addEventListener('pointermove', event => {
    if (touch && touch.id === event.pointerId && Math.hypot(event.clientX-touch.x,event.clientY-touch.y) >= 10) touch = null;
    if (!live() || !fine.matches || !['mouse','pen'].includes(event.pointerType) || event.buttons) return;
    if (!hero.contains(event.target)) { if (activity === 'pointer') settle(); return; }
    if (activity !== 'pointer') { stop({preservePose:true}); host.classList.remove('character-paused'); state('pointer'); scheduleBlink(); }
    const box = image.getBoundingClientRect();
    if (!box.width || !box.height) return;
    let x = (event.clientX-box.left-box.width*.51)/(box.width*.5);
    let y = (event.clientY-box.top-box.height*.27)/(box.height*.5);
    const length = Math.max(1,Math.hypot(x,y)); x /= length; y /= length;
    rig.head.style.transform = `rotate(${4*x}deg)`;
    rig.gaze.style.transform = `translate(${20*x}px,${12*y}px)`;
  });
  const releaseTouch = event => {
    if (event.pointerType !== 'touch' || !touch || event.pointerId !== touch.id) return;
    touch = null; resume();
  };
  hero.addEventListener('pointerleave',event => {
    if (event.pointerType === 'touch') return releaseTouch(event);
    if (fine.matches && ['mouse','pen'].includes(event.pointerType)) settle();
  });
  portrait.addEventListener('pointerleave',releaseTouch);
  portrait.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.isPrimary === false || !rig || !visible || reduced.matches || document.hidden) return;
    keyboard = false; stop();
    touch = { id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now() };
  });
  portrait.addEventListener('pointerup', event => {
    const gesture = touch; touch = null;
    if (!gesture || gesture.id !== event.pointerId || performance.now()-gesture.time > 500 || Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y) >= 10 || !live()) return;
    act('ack');
  });
  portrait.addEventListener('pointercancel', stop);
  window.addEventListener('scroll', () => { stop(); resume(); },{passive:true});
  window.addEventListener('wheel', () => { keyboard = false; stop(); resume(); },{passive:true});
  document.addEventListener('keydown', event => {
    const pageKey = ['Home','End','PageUp','PageDown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);
    if (['Shift','Control','Alt','Meta'].includes(event.key) || event.altKey || ((event.ctrlKey || event.metaKey) && !pageKey)) return;
    keyboard = true; stop();
  });
  document.addEventListener('pointerdown', () => { keyboard = false; resume(); });
  window.addEventListener('portfolio:entryend', () => { stop(); if (window.portfolioEntry?.completed) { schedule(700,'ack'); scheduleBlink(); } else resume(); });
  window.addEventListener('blur',stop);
  window.addEventListener('focus',resume);
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',event => { if(event.persisted) resume(); });
  document.addEventListener('visibilitychange',() => { if(document.hidden) stop(); else resume(); });
  reduced.addEventListener('change',() => { if(reduced.matches) stop(); else resume(); });
  fine.addEventListener('change',() => { stop(); resume(); });
})();
