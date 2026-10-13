// One arrival, then small direct responses. The image is always visible without JS.
(() => {
  const portrait = document.querySelector('.personal-portrait');
  const arrival = portrait?.querySelector('.portrait-arrival');
  const image = portrait?.querySelector('img');
  const hero = portrait?.closest('.hero-personal');
  const gaze = portrait?.querySelector('.portrait-gaze');
  const eyes = [...(portrait?.querySelectorAll('.portrait-eye') || [])];
  if (!arrival || !image || !hero || !gaze || eyes.length !== 2 || typeof arrival.animate !== 'function') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const ease = getComputedStyle(image).getPropertyValue('--ease-out').trim() || 'cubic-bezier(.23,1,.32,1)';
  // A late module must not hide an already-seen portrait; late image decoding is still allowed.
  let ready = false, visible = false, entered = document.readyState === 'complete' || performance.now() > 1500, keyboard = false;
  let entryMotion = null, touch = null;
  let blinkTimer = 0, blinkMotions = [];
  const blocked = () => reduced.matches || keyboard || document.hidden || !document.hasFocus() || document.documentElement.classList.contains('keyboard');
  const away = () => location.hash && location.hash !== '#inicio';
  function stopBlink() {
    clearTimeout(blinkTimer); blinkTimer = 0;
    blinkMotions.forEach(motion => motion.cancel()); blinkMotions = [];
  }
  function blink() {
    blinkMotions.forEach(motion => motion.cancel());
    blinkMotions = eyes.map(eye => eye.animate([
      {transform:'scaleY(1)',offset:0}, {transform:'scaleY(.08)',offset:.32},
      {transform:'scaleY(.08)',offset:.48}, {transform:'scaleY(1)',offset:1}
    ],{duration:200,easing:ease}));
  }
  function syncBlink() {
    if (!ready || !visible || blocked()) return stopBlink();
    if (blinkTimer) return;
    blinkTimer = setTimeout(() => {
      blinkTimer = 0;
      if (!ready || !visible || blocked()) return stopBlink();
      blink(); syncBlink();
    },4000+Math.random()*3000);
  }
  function reset() {
    entryMotion?.cancel(); entryMotion = null;
    gaze.style.transform = '';
    stopBlink();
    touch = null;
  }
  function dismiss() { entered = true; reset(); }
  function enter() {
    if (entered || !ready || !visible) return;
    if (blocked() || away()) return dismiss();
    entered = true;
    entryMotion = arrival.animate([
      {transform:'translateY(8px)',opacity:0},
      {transform:'translateY(0)',opacity:1}
    ],{duration:500,easing:ease});
  }
  function decoded() { ready = image.naturalWidth > 0; gaze.style.visibility = ready ? '' : 'hidden'; enter(); syncBlink(); }
  function prepare() {
    if (typeof image.decode === 'function') image.decode().then(decoded, () => { if (image.complete) decoded(); });
    else if (image.complete) decoded();
  }
  prepare();
  image.addEventListener('load', prepare, {once:true});
  image.addEventListener('error', () => { ready = false; gaze.style.visibility = 'hidden'; dismiss(); }, {once:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const entry = entries[0];
      visible = entry.isIntersecting && entry.intersectionRatio >= .18;
      if (visible) { enter(); syncBlink(); } else reset();
    },{threshold:[0,.18]}).observe(portrait);
  }
  // No observer means a static portrait rather than a scroll-listener fallback.
  portrait.addEventListener('pointermove', event => {
    if (touch && event.pointerId === touch.id && Math.hypot(event.clientX-touch.x,event.clientY-touch.y) >= 10) touch = null;
  });
  const resetGaze = () => { gaze.style.transform = ''; };
  document.addEventListener('pointermove', event => {
    if (!ready || !visible || blocked() || !fine.matches || !['mouse','pen'].includes(event.pointerType) || event.buttons) return;
    if (!hero.contains(event.target)) return resetGaze();
    const box = image.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const dx = (event.clientX-box.left-box.width*(640/1254))/(box.width*.5);
    const dy = (event.clientY-box.top-box.height*(321.25/1254))/(box.height*.5);
    const length = Math.max(1,Math.hypot(dx,dy));
    gaze.style.transform = `translate(${4*dx/length}px,${2.5*dy/length}px)`;
  });
  hero.addEventListener('pointerleave',resetGaze);
  document.addEventListener('pointerleave',resetGaze);
  portrait.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    keyboard = false;
    // This physical touch precedes app.js clearing keyboard mode during bubbling.
    if (!ready || !visible || reduced.matches || document.hidden) return;
    reset();
    touch = {id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
  });
  portrait.addEventListener('pointerup', event => {
    const gesture = touch; touch = null;
    if (!gesture || event.pointerId !== gesture.id || blocked() || !visible || performance.now()-gesture.time > 500 || Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y) >= 10) return;
    blink(); syncBlink();
  });
  portrait.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch' && touch) { reset(); syncBlink(); }
  });
  portrait.addEventListener('pointercancel', () => { reset(); syncBlink(); });
  document.addEventListener('keydown', event => {
    const pageKey = ['Home','End','PageUp','PageDown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);
    if (['Shift','Control','Alt','Meta'].includes(event.key) || event.altKey || ((event.ctrlKey || event.metaKey) && !pageKey)) return;
    keyboard = true; dismiss();
  });
  document.addEventListener('pointerdown', () => { keyboard = false; syncBlink(); });
  window.addEventListener('scroll', () => { touch = null; },{passive:true});
  window.addEventListener('pagehide',dismiss);
  window.addEventListener('pageshow', event => { if (event.persisted) { entered = true; syncBlink(); } });
  window.addEventListener('blur', dismiss);
  window.addEventListener('focus', syncBlink);
  window.addEventListener('wheel', () => { keyboard = false; syncBlink(); },{passive:true});
  window.addEventListener('hashchange', () => { if (away()) dismiss(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); else syncBlink(); });
  reduced.addEventListener('change', () => { if (reduced.matches) dismiss(); else syncBlink(); });
  fine.addEventListener('change', () => { reset(); syncBlink(); });
  if (blocked() || away()) dismiss();
})();
