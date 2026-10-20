'use strict';
const personalWorld = document.body.classList.contains('personal-world');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const detailsMotion = CSS.supports('selector(::details-content)') && CSS.supports('interpolate-size:allow-keywords') && CSS.supports('transition-behavior:allow-discrete');
let keyboard = false, introActive = Boolean(window.portfolioEntry?.active);
let headerHeight = 59;
let fontsReady = !document.fonts;
let morphGeometry = null;
let headingInkTop = null;
// Scroll scene elements: decorative children only; native links retain their full bounds.
const heroCopy = document.querySelector('.hero-bottom');
const proofFrame = document.querySelector('.proof-media');
const proofImage = proofFrame?.querySelector('img');
const proofRegion = document.querySelector('.about-proof');
const aboutPoster = document.querySelector('.presence-title');
const aboutFrame = document.querySelector('.presence-frame');
const posterLines = [...(document.querySelectorAll('.presence-first, .presence-system') || [])];
const sceneHeadlines = [...(document.querySelectorAll('[data-reveal]') || [])];
const workRegion = document.querySelector('#trabajo');
const workWash = document.querySelector('.work-wash');
const contactRegion = document.querySelector('#contacto');
const contactWash = document.querySelector('.contact-wash');
const contactSheet = document.querySelector('.contact-sheet');
const contactLines = [...(document.querySelectorAll('#contact-title > span') || [])];
// End scroll scene elements.
const presenceSystem = document.querySelector('.presence-system');
const presenceInk = document.querySelector('.presence-ink');
const header = document.querySelector('.index-bar');
const hero = document.querySelector('.hero');
const about = document.querySelector('#sobre-mi');
const name = document.querySelector('#nombre');
const hoverInk = document.querySelector('.name-hover');
let hoverFrame = 0;
let hoverX = 0, hoverY = 0, hoverRadius = 0;
let hoverTargetX = 0, hoverTargetY = 0, hoverTargetRadius = 0;
const signature = document.querySelector('.signature');
const morph = document.querySelector('.name-morph');
const sourceWords = [...name.querySelectorAll('.name-word')];
const targetWords = [...signature.querySelectorAll('.signature-word')];
const morphWords = [...morph.querySelectorAll('.morph-word')];
const stopMotion = () => {
  resetHoverInk();
  window.portfolioEntry?.finish();
  introActive = false;
};
document.addEventListener('keydown', event => {
  const pageNavigation = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End'].includes(event.key);
  if (event.altKey || (!pageNavigation && (event.metaKey || event.ctrlKey || !['Tab',' ','Enter','Escape'].includes(event.key)))) return;
  keyboard = true;
  document.documentElement.classList.add('keyboard');
  stopMotion(); cancelNativeScroll(); cancelPanelProgress(); updateProgress();
});
document.addEventListener('pointerdown', () => {
  if (introActive) stopMotion();
  keyboard = false;
  document.documentElement.classList.remove('keyboard');
  queueProgress();
});
reduced.addEventListener('change', () => {
  if (reduced.matches) { stopMotion(); cancelNativeScroll(); cancelPanelProgress(); }
  updateProgress();
});
// The pre-paint bootstrap owns the single coordinated CSS entrance.
window.addEventListener('portfolio:entryend', () => { introActive = false; });
const navLinks = [...document.querySelectorAll('.index-bar a')];
const sections = navLinks.map(link => document.querySelector(link.hash));
let smoothHash = null;
let smoothActive = false;
let smoothRestoreTimer = 0;
let smoothEndTimer = 0;
let panelProgressTimer = 0;
const markSection = id => {
  if (!navLinks.some(link => link.hash === `#${id}`)) return;
  navLinks.forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
};
let sectionObserver;
const observeSections = () => {
  if (sectionObserver) sectionObserver.disconnect();
  sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) markSection(entry.target.id); });
  }, {rootMargin:`-${Math.round(window.innerHeight * .15)}px 0px -${Math.round(window.innerHeight * .65)}px 0px`});
  sections.forEach(section => sectionObserver.observe(section));
};
observeSections();
markSection(window.location.hash.slice(1) || 'inicio');
window.addEventListener('hashchange', () => {
  stopMotion();
  if (smoothHash !== window.location.hash) cancelNativeScroll();
  smoothHash = null;
  markSection(window.location.hash.slice(1) || 'inicio');
  queueProgress();
});
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const localActivation = event?.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (!localActivation || event.defaultPrevented || link.hasAttribute('download')) return;
  stopMotion();
  cancelNativeScroll();
  if (!reduced.matches && !keyboard && event?.detail > 0 && localActivation) {
    smoothHash = link.hash;
    smoothActive = true;
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothRestoreTimer = setTimeout(() => { document.documentElement.style.scrollBehavior = ''; },0);
    smoothEndTimer = setTimeout(finishNativeScroll,1500);
  }
}));

const progress = document.querySelector('.reading-progress');
let progressFrame = 0;
function updateHeaderTheme() {
  const active = sections.filter(section => section.getBoundingClientRect().top <= headerHeight + 1).at(-1);
  const id = active?.id;
  header.setAttribute('data-theme',id === 'trabajo' ? 'ink' : id === 'contacto' ? 'cobalt' : 'paper');
}
function updateProgress() {
  cancelAnimationFrame(progressFrame);
  progressFrame = 0;
  if (personalWorld) { updateHeaderTheme(); window.portfolioJourney?.refresh(); return; }
  const travel = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = travel > 0 ? Math.min(1,Math.max(0,window.scrollY / travel)) : 0;
  progress.style.transform = `scaleX(${ratio})`;
  updateMorph();
  updateHeadingInk();
  updateHeaderTheme();
  updateScenes();
}
function queueProgress() {
  if (document.hidden) return;
  if (keyboard || reduced.matches) return updateProgress();
  if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
}
window.addEventListener('scroll', () => { resetHoverInk(); if (introActive && window.scrollY > 4) stopMotion(); queueProgress(); }, {passive:true});
window.addEventListener('resize', () => { stopMotion(); cancelNativeScroll(); syncHeader(); measureMorph(); observeSections(); queuePanelProgress(); });
window.addEventListener('load', () => { syncHeader(); measureMorph(); queueProgress(); });
const suspendMotion = () => {
  stopMotion();
  resetMorph();
  settleHeadingInk();
  settleScenes();
  cancelNativeScroll();
  cancelPanelProgress();
  cancelAnimationFrame(progressFrame);
  progressFrame = 0;
};
window.addEventListener('blur', suspendMotion);
window.addEventListener('pagehide', suspendMotion);
window.addEventListener('pageshow', () => { syncHeader(); measureMorph(); queueProgress(); });
const resumeMotion = () => { if (!morphGeometry) measureMorph(); if (headingInkTop === null) measureHeadingInk(); queueProgress(); };
window.addEventListener('focus', resumeMotion);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    suspendMotion();
  } else resumeMotion();
});
syncHeader();
measureMorph();
updateProgress();
if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; if (!document.hidden) { syncHeader(); measureMorph(); queueProgress(); } });

function cancelPanelProgress() {
  clearTimeout(panelProgressTimer);
  panelProgressTimer = 0;
}
function queuePanelProgress() {
  cancelPanelProgress();
  queueProgress();
  if (detailsMotion && !keyboard && !reduced.matches) {
    panelProgressTimer = setTimeout(() => {
      panelProgressTimer = 0;
      queueProgress();
    },300);
  }
}
function finishNativeScroll() {
  clearTimeout(smoothRestoreTimer);
  clearTimeout(smoothEndTimer);
  document.documentElement.style.scrollBehavior = '';
  smoothActive = false;
  smoothHash = null;
}
function cancelNativeScroll() {
  const wasActive = smoothActive;
  finishNativeScroll();
  if (wasActive) window.scrollTo({top:window.scrollY,behavior:'instant'});
}
function interruptNavigation() {
  keyboard = false;
  document.documentElement.classList.remove('keyboard');
  if (introActive) stopMotion();
  cancelNativeScroll();
  queueProgress();
}
window.addEventListener('wheel', interruptNavigation, {passive:true});
window.addEventListener('touchstart', interruptNavigation, {passive:true});
window.addEventListener('scrollend', finishNativeScroll);
function syncHeader() {
  headerHeight = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height',`${headerHeight}px`);
  measureHeadingInk();
}
function resetMorph() {
  if (personalWorld) return;
  name.style.opacity = '';
  signature.style.opacity = '';
  morph.style.visibility = 'hidden';
}
function measureMorph() {
  if (personalWorld) return;
  resetHoverInk();
  morphGeometry = null;
  resetMorph();
  if (!fontsReady || document.hidden || sourceWords.length !== 2 || targetWords.length !== 2 || morphWords.length !== 2) return;
  const toDocument = element => {
    const rect = element.getBoundingClientRect();
    return {x:rect.left,y:rect.top+window.scrollY,width:rect.width,height:rect.height};
  };
  const from = sourceWords.map(toDocument), to = targetWords.map(toDocument);
  if (![...from,...to].every(rect => Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0)) return;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const end = about.getBoundingClientRect().top + window.scrollY - padding;
  if (!Number.isFinite(end) || end <= 0) return;
  morphGeometry = {from,to,end};
}
// Geometric easing has no clock: the same scroll position always owns the same pose.
function sceneProgress(p) { return p*p*(3-2*p); }
function updateMorph() {
  if (hero.classList.contains('hero-personal')) return resetMorph();
  if (window.innerWidth < 1200 || window.innerHeight < 760 || window.innerWidth/window.innerHeight < 1.4) return resetMorph();
  if (!morphGeometry || keyboard || reduced.matches || document.hidden) return resetMorph();
  const p = sceneProgress(Math.max(0,Math.min(1,window.scrollY/morphGeometry.end)));
  if (p === 0 || p === 1) return resetMorph();
  resetHoverInk();
  // One decorative layer, two words: each reaches its real desktop/mobile destination.
  const {from,to} = morphGeometry;
  const initialOverlap = Math.max(0,from[0].x+from[0].width-from[1].x);
  const arc = initialOverlap*2*p*(1-p);
  const secondWidth = from[1].width+(to[1].width-from[1].width)*p;
  const secondX = from[1].x+(to[1].x-from[1].x)*p;
  const room = Math.max(0,from[1].x+from[1].width-secondX-secondWidth);
  // A rounded minimum bends around the first word without crossing the native right edge.
  const rounding = Math.min(12,arc,room);
  const blend = Math.max(0,rounding-Math.abs(arc-room));
  const clearance = Math.min(arc,room)-(rounding ? blend*blend/(4*rounding) : 0);
  const finalGap = to[1].x-to[0].x-to[0].width;
  const verticalArc = Math.min(18,Math.max(12,finalGap*1.5))*4*p*(1-p);
  morphWords.forEach((word,i) => {
    const x = from[i].x + (to[i].x-from[i].x)*p + (i ? clearance : 0);
    const y = from[i].y + (to[i].y-from[i].y)*p - window.scrollY + (i ? verticalArc : 0);
    const sx = 1 + (to[i].width/from[i].width-1)*p;
    const sy = 1 + (to[i].height/from[i].height-1)*p;
    word.style.transform = `translate3d(${x}px,${y}px,0) scale(${sx},${sy})`;
  });
  morph.style.visibility = 'visible';
  name.style.opacity = '0';
  signature.style.opacity = '0';
}

const copyControl = document.querySelector('.copy-control');
const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
if (copyControl && copyButton && copyStatus) {
  copyControl.hidden = false;
  let copyAttempt = 0, copyTimer = 0, copying = false;
  const finishCopy = message => {
    clearTimeout(copyTimer);
    copyTimer = 0;
    copying = false;
    copyButton.removeAttribute('aria-busy');
    copyStatus.textContent = message;
  };
  copyButton.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    const attempt = ++copyAttempt;
    copyButton.setAttribute('aria-busy','true');
    copyStatus.textContent = 'Copiando…';
    const failed = 'No se pudo copiar. Usa el enlace del correo.';
    copyTimer = setTimeout(() => {
      if (attempt !== copyAttempt) return;
      copyAttempt++;
      finishCopy(failed);
    },5000);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      const address = document.querySelector('.email').getAttribute('href').slice(7);
      await navigator.clipboard.writeText(address);
      if (attempt === copyAttempt) finishCopy('Correo copiado');
    } catch {
      if (attempt === copyAttempt) finishCopy(failed);
    }
  });
  window.addEventListener('pagehide', () => { copyAttempt++; finishCopy(''); });
}

function settleHeadingInk() {
  if (personalWorld) return;
  if (presenceInk) presenceInk.style.clipPath = 'inset(0 0% 0 0)';
}
function measureHeadingInk() {
  if (personalWorld) return;
  headingInkTop = null;
  if (!presenceSystem || !fontsReady || document.hidden) return;
  const rect = aboutFrame?.getBoundingClientRect();
  if (rect && Number.isFinite(rect.top) && rect.width > 0 && rect.height > 0) headingInkTop = rect.top + window.scrollY;
}
function updateHeadingInk() {
  if (personalWorld) return;
  if (!presenceInk) return;
  if (headingInkTop === null || reduced.matches || keyboard || document.hidden) return settleHeadingInk();
  const top = headingInkTop-window.scrollY;
  const p = Math.max(0,Math.min(1,(window.innerHeight*.9-top)/(window.innerHeight*.6)));
  presenceInk.style.clipPath = `inset(0 ${100*(1-p)}% 0 0)`;
}
document.querySelector('.about-example')?.addEventListener('toggle',queuePanelProgress);

function hoverInkAllowed() {
  const focused = typeof document.hasFocus !== 'function' || document.hasFocus();
  return hoverInk && finePointer.matches && fontsReady && !reduced.matches && !keyboard && !introActive && !document.hidden && focused && window.scrollY <= 1 && morph.style.visibility !== 'visible';
}
function resetHoverInk() {
  cancelAnimationFrame(hoverFrame);
  hoverFrame = 0;
  hoverRadius = hoverTargetRadius = 0;
  if (hoverInk) {
    hoverInk.style.opacity = '0';
    hoverInk.style.clipPath = 'circle(0px at 0px 0px)';
  }
}
function drawHoverInk() {
  hoverFrame = 0;
  if (!hoverInkAllowed()) return resetHoverInk();
  hoverX += (hoverTargetX-hoverX)*.3;
  hoverY += (hoverTargetY-hoverY)*.3;
  hoverRadius += (hoverTargetRadius-hoverRadius)*.3;
  const unsettled = Math.abs(hoverTargetX-hoverX)+Math.abs(hoverTargetY-hoverY)+Math.abs(hoverTargetRadius-hoverRadius) > .4;
  if (!unsettled) { hoverX=hoverTargetX; hoverY=hoverTargetY; hoverRadius=hoverTargetRadius; }
  hoverInk.style.clipPath = `circle(${hoverRadius.toFixed(2)}px at ${hoverX.toFixed(2)}px ${hoverY.toFixed(2)}px)`;
  hoverInk.style.opacity = hoverRadius > 0 ? '1' : '0';
  if (unsettled) hoverFrame = requestAnimationFrame(drawHoverInk);
}
function moveHoverInk(event) {
  if (!hoverInkAllowed() || event.pointerType === 'touch') return resetHoverInk();
  const bounds = name.getBoundingClientRect();
  if (![bounds.left,bounds.top,bounds.width,bounds.height,event.clientX,event.clientY].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0) return resetHoverInk();
  const x=event.clientX-bounds.left, y=event.clientY-bounds.top, radius=Math.min(bounds.width*.16,190);
  if (x===hoverTargetX && y===hoverTargetY && radius===hoverTargetRadius && hoverRadius===radius) return;
  hoverTargetX=x; hoverTargetY=y; hoverTargetRadius=radius;
  if (!hoverRadius) { hoverX=x; hoverY=y; }
  if (!hoverFrame) hoverFrame=requestAnimationFrame(drawHoverInk);
}
finePointer.addEventListener('change',resetHoverInk);
name.addEventListener('pointerenter',moveHoverInk);
name.addEventListener('pointermove',moveHoverInk);
name.addEventListener('pointerleave',() => {
  hoverTargetRadius=0;
  if (!hoverInkAllowed()) return resetHoverInk();
  if (!hoverFrame && hoverRadius) hoverFrame=requestAnimationFrame(drawHoverInk);
});

// Shared circular scenes: event-driven through the existing progress frame.
function settleScenes() {
  if (personalWorld) return;
  if (heroCopy) { heroCopy.style.opacity = ''; heroCopy.style.transform = ''; heroCopy.style.pointerEvents = ''; }
  if (proofImage) { proofImage.style.clipPath = 'none'; proofImage.style.transform = 'none'; }
  [...posterLines,...contactLines].forEach(line => { line.style.transform = 'none'; line.style.clipPath = 'none'; });
  if (aboutPoster) { aboutPoster.style.transform = 'none'; aboutPoster.style.transformOrigin = ''; }
  if (workWash) workWash.style.clipPath = 'none';
  if (contactWash) { contactWash.style.clipPath = 'none'; contactWash.style.opacity = ''; }
  if (contactSheet) contactSheet.style.transform = 'none';
  sceneHeadlines.forEach(target => { target.style.clipPath = 'none'; target.style.transform = 'none'; target.style.transformOrigin = ''; });
}
function updateScenes() {
  if (personalWorld) return;
  if (reduced.matches || keyboard || document.hidden) {
    resetMorph();
    settleScenes();
    return;
  }
  // Snap the completed endpoint despite floating-point division (e.g. .55 × 900).
  const clamp = value => value >= 1-1e-9 ? 1 : Math.max(0,value);
  const viewport = window.innerHeight;
  // Arrival is a function of the current position, with a quiet reading band.
  // Only untransformed wrappers are measured, so reversing scroll retraces the same pose.
  const atEnd = window.scrollY >= document.documentElement.scrollHeight-viewport-1;
  const lineArrival = (rect,index = 0) => atEnd ? 1 : sceneProgress(clamp((viewport-rect.top-index*viewport*.06)/Math.max(1,viewport*.40)));
  const poster = window.innerWidth >= 1200 && viewport >= 760 && window.innerWidth/viewport >= 1.4;
  const copyFocused = heroCopy?.contains?.(document.activeElement);
  if (heroCopy) {
    if (!poster || copyFocused) {
      heroCopy.style.opacity = ''; heroCopy.style.transform = ''; heroCopy.style.pointerEvents = '';
      if (poster && copyFocused) resetMorph();
    } else {
      const exit = clamp(window.scrollY/120);
      heroCopy.style.opacity = `${1-exit}`;
      heroCopy.style.transform = `translate3d(0,${-8*exit}px,0)`;
      heroCopy.style.pointerEvents = exit === 1 ? 'none' : '';
    }
  }
  const aboutStatic = proofRegion?.contains?.(document.activeElement) || document.querySelector('#sobre-mi')?.contains?.(document.activeElement);
  if (aboutPoster && aboutFrame) {
    const rect = aboutFrame.getBoundingClientRect();
    aboutPoster.style.transformOrigin = '';
    aboutPoster.style.transform = 'none';
    posterLines.forEach((line,index) => {
      const p = aboutStatic || rect.width <= 0 || rect.height <= 0 ? 1 : lineArrival(rect,index);
      const travel = window.innerWidth <= 899 ? 24+index*6 : 40+index*10;
      line.style.transform = p >= 1 ? 'none' : `translate3d(0,${travel*(1-p)}px,0)`;
      line.style.clipPath = p >= 1 ? 'none' : `inset(-.2em -.08em calc(${80*(1-p)}% - .2em) -.08em)`;
    });
  }
  if (proofImage && proofFrame) {
    const rect = proofFrame.getBoundingClientRect();
    const p = clamp((viewport-rect.top)/(viewport*.55));
    const amount = aboutStatic || rect.width <= 0 || rect.height <= 0 ? 0 : 1-p;
    proofImage.style.clipPath = 'none';
    proofImage.style.transform = amount ? `translate3d(${(window.innerWidth <= 899 ? 16 : -32)*amount}px,0,0)` : 'none';
  }
  const headlines = sceneHeadlines.map(target => {
    const wrapper = target.closest?.('.work-heading, .contact-intro') || (target.id === 'contact-title' ? contactRegion : workRegion);
    return {target,wrapper,rect:wrapper?.getBoundingClientRect()};
  });
  const surfaces = [[workRegion,workWash],[contactRegion,contactWash]].flatMap(([region,wash]) => {
    if (!region || !wash) return [];
    return [{region,wash,rect:region.getBoundingClientRect(),style:getComputedStyle(region)}];
  });
  headlines.forEach(({target,wrapper,rect}) => {
    const focused = wrapper?.contains?.(document.activeElement);
    if (target.id === 'contact-title') {
      target.style.clipPath = 'none'; target.style.transform = 'none'; target.style.transformOrigin = '';
      contactLines.forEach((line,index) => {
        const p = !rect || focused || contactRegion?.contains?.(document.activeElement) || rect.width <= 0 || rect.height <= 0 ? 1 : lineArrival(rect,index);
        const travel = window.innerWidth <= 899 ? 24+index*6 : 40+index*10;
        line.style.transform = p >= 1 ? 'none' : `translate3d(0,${travel*(1-p)}px,0)`;
        line.style.clipPath = p >= 1 ? 'none' : `inset(-.2em -.08em calc(${80*(1-p)}% - .2em) -.08em)`;
      });
      return;
    }
    const p = !rect || focused || rect.width <= 0 || rect.height <= 0 ? 1 : lineArrival(rect);
    target.style.clipPath = p >= 1 ? 'none' : `inset(-.2em -.08em calc(${80*(1-p)}% - .2em) -.08em)`;
    target.style.transformOrigin = '';
    target.style.transform = p >= 1 ? 'none' : `translate3d(0,${(window.innerWidth <= 899 ? 28 : 48)*(1-p)}px,0)`;
  });
  surfaces.forEach(({region,wash,rect,style}) => {
    const padding = [style.paddingLeft,style.paddingRight,style.paddingTop].map(value => Math.max(0,parseFloat(value)));
    const valid = [rect.top,rect.width,rect.height,...padding].every(Number.isFinite) && rect.width > 0 && rect.height > 0;
    const p = atEnd || region.contains?.(document.activeElement) || !valid ? 1 : sceneProgress(clamp((viewport-rect.top)/Math.max(1,viewport*.45)));
    if (region === contactRegion) {
      wash.style.opacity = '';
      if (contactSheet) contactSheet.style.transform = 'none';
    }
    if (p >= 1) { wash.style.clipPath = 'none'; return; }
    const amount = 1-p;
    const side = Math.min(40,padding[0]*.45,padding[1]*.45)*amount;
    const ry = Math.min(padding[2]*.65,64)*amount;
    const rx = (rect.width-2*side)*.5*amount;
    wash.style.clipPath = `inset(0 ${side}px 0 ${side}px round ${rx}px ${rx}px 0 0 / ${ry}px ${ry}px 0 0)`;
  });
}

document.addEventListener('focusin',updateProgress);
document.addEventListener('focusout',queueProgress);
// End shared circular scenes.
