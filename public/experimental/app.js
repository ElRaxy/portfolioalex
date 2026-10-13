'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const easeOut = 'cubic-bezier(.23,1,.32,1)';
const easeInOut = 'cubic-bezier(.77,0,.175,1)';
const detailsMotion = CSS.supports('selector(::details-content)') && CSS.supports('interpolate-size:allow-keywords') && CSS.supports('transition-behavior:allow-discrete');
const activeAnimations = new Set();
const seenImages = new WeakSet();
const imageAnimations = new Map();
let keyboard = false, introActive = false, introStarted = false, introTimer = 0, entryDismissed = false;
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
const layoutMotions = new Map();
let layoutCapture = null;
let archiveState = null;
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
const heroLettering = [...name.querySelectorAll('.name-lettering')];
const targetWords = [...signature.querySelectorAll('.signature-word')];
const morphWords = [...morph.querySelectorAll('.morph-word')];
const animate = (element, frames, options) => {
  if (reduced.matches || keyboard) return;
  const animation = element.animate(frames, options);
  activeAnimations.add(animation);
  animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  return animation;
};
const stopMotion = () => {
  entryDismissed = true;
  cancelLayoutMotion();
  resetHoverInk();
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations.clear();
  imageAnimations.clear();
  clearTimeout(introTimer);
  introTimer = 0;
  introActive = false;
  cancelSummaryAnchor();
};
document.addEventListener('keydown', event => {
  const pageNavigation = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End'].includes(event.key);
  if (event.altKey || (!pageNavigation && (event.metaKey || event.ctrlKey || !['Tab',' ','Enter','Escape'].includes(event.key)))) return;
  keyboard = true;
  document.documentElement.classList.add('keyboard');
  stopMotion(); cancelNativeScroll(); cancelPanelProgress(); updateProgress();
});
document.addEventListener('pointerdown', event => {
  // A held summary keeps its current pose; the click captures it before reflow.
  if (!event?.target?.closest?.('.project-heading')) cancelLayoutMotion();
  cancelSummaryAnchor();
  entryDismissed = true;
  if (introActive) stopMotion();
  keyboard = false;
  document.documentElement.classList.remove('keyboard');
  queueProgress();
});
reduced.addEventListener('change', () => {
  if (reduced.matches) { stopMotion(); cancelNativeScroll(); cancelPanelProgress(); }
  updateProgress();
});
// Start before first paint only: a title already seen must never disappear for an entrance.
function startIntro() {
  if (introStarted) return;
  if (!fontsReady) { document.fonts.ready.then(startIntro); return; }
  introStarted = true;
  const restored = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  const focused = typeof document.hasFocus !== 'function' || document.hasFocus();
  const painted = performance.getEntriesByType('paint').length > 0;
  if (painted || restored || entryDismissed || performance.now() > 700 || window.scrollY > 4 || (location.hash && location.hash !== '#inicio') || reduced.matches || keyboard || document.hidden || !focused) return;
  if (window.innerHeight < 480 && window.innerWidth > window.innerHeight) return;
  if (heroLettering.length !== 2) return;
  introActive = true;
  resetHoverInk();
  heroLettering.forEach((word,index) => {
    animate(word,[
      {transform:`translate3d(0,${window.innerWidth <= 650 ? 24 : 32}px,0)`,opacity:0},
      {transform:'translate3d(0,0,0)',opacity:1}
    ],{duration:800,delay:index*70,easing:easeOut,fill:'backwards'});
  });
  introTimer = setTimeout(() => { introActive = false; introTimer = 0; },870);
}
const navLinks = [...document.querySelectorAll('.index-bar a')];
const sections = navLinks.map(link => document.querySelector(link.hash));
const projectPanels = [...document.querySelectorAll('details.project')];
const caseLinks = [...document.querySelectorAll('.case-index a')];
function updateCaseIndex() {
  const open = projectPanels.find(panel => panel.open);
  caseLinks.forEach(link => {
    if (open && link.hash === `#${open.id}`) link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  });
}
let summaryAnchor = null;
let summaryFrame = 0;
let previousOverflowAnchor = '';
let caseNextFocus = null;
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
markSection(location.hash.slice(1) || 'inicio');
window.addEventListener('hashchange', () => {
  stopMotion();
  if (smoothHash !== location.hash) cancelNativeScroll();
  smoothHash = null;
  if (!openHashProject()) {
    markSection(location.hash.slice(1) || 'inicio');
    if (caseNextFocus === '#contacto' && location.hash === caseNextFocus) document.querySelector('.email').focus({preventScroll:true});
  }
  caseNextFocus = null;
  queueProgress();
});
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  stopMotion();
  cancelNativeScroll();
  const localActivation = event?.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  // Remember focus ownership before native exclusivity hides the current panel.
  caseNextFocus = localActivation && link.classList.contains('case-next') &&
    (document.activeElement === link || keyboard || event.detail === 0) ? link.hash : null;
  if (!reduced.matches && !keyboard && event?.detail > 0 && localActivation) {
    smoothHash = link.hash;
    smoothActive = true;
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothRestoreTimer = setTimeout(() => { document.documentElement.style.scrollBehavior = ''; },0);
    smoothEndTimer = setTimeout(finishNativeScroll,1500);
  }
  // An anchor to the current fragment emits no hashchange; still reopen its native case.
  if (localActivation && link.hash === location.hash && projectPanels.some(panel => `#${panel.id}` === link.hash)) openHashProject();
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
window.addEventListener('scroll', () => { if (window.scrollY > 4) entryDismissed = true; resetHoverInk(); if (introActive) stopMotion(); queueProgress(); }, {passive:true});
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

function openHashProject() {
  const panel = projectPanels.find(project => `#${project.id}` === location.hash);
  if (!panel) return false;
  cancelSummaryAnchor();
  cancelNativeScroll();
  cancelPanelProgress();
  document.documentElement.classList.add('settle-panels');
  const transferFocus = caseNextFocus === `#${panel.id}`;
  caseNextFocus = null;
  projectPanels.forEach(project => { project.open = project === panel; });
  if (transferFocus) panel.querySelector('summary').focus({preventScroll:true});
  markSection('trabajo');
  updateCaseIndex();
  const margin = (parseFloat(getComputedStyle(panel).scrollMarginTop) || 0) +
    (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  if (Math.abs(panel.getBoundingClientRect().top - margin) > 2) {
    panel.scrollIntoView({behavior:'instant',block:'start'});
  }
  document.documentElement.classList.remove('settle-panels');
  queueProgress();
  return true;
}
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
function cancelSummaryAnchor() {
  cancelAnimationFrame(summaryFrame);
  summaryFrame = 0;
  if (summaryAnchor?.animated) document.documentElement.style.overflowAnchor = previousOverflowAnchor;
  summaryAnchor = null;
}
function adjustSummaryAnchor() {
  if (!summaryAnchor) return;
  const shift = summaryAnchor.summary.getBoundingClientRect().top - summaryAnchor.top;
  if (Math.abs(shift) > .5) window.scrollBy({top:shift,behavior:'instant'});
}
function trackSummary(timestamp) {
  summaryFrame = 0;
  if (!summaryAnchor || timestamp > summaryAnchor.until) {
    cancelSummaryAnchor();
    queueProgress();
    return;
  }
  adjustSummaryAnchor();
  summaryFrame = requestAnimationFrame(trackSummary);
}
function interruptNavigation() {
  keyboard = false;
  document.documentElement.classList.remove('keyboard');
  cancelLayoutMotion();
  entryDismissed = true;
  if (introActive) stopMotion();
  cancelSummaryAnchor();
  cancelNativeScroll();
  queueProgress();
}
window.addEventListener('wheel', interruptNavigation, {passive:true});
window.addEventListener('touchstart', interruptNavigation, {passive:true});
window.addEventListener('scrollend', finishNativeScroll);
projectPanels.forEach(panel => {
  const summary = panel.querySelector('summary');
  summary.addEventListener('click', () => {
    captureLayoutShift(panel);
    cancelSummaryAnchor();
    cancelNativeScroll();
    const animated = detailsMotion && !keyboard && !reduced.matches;
    summaryAnchor = {panel,summary,top:Math.max(80,summary.getBoundingClientRect().top),animated,until:performance.now()+320};
    if (animated) {
      previousOverflowAnchor = document.documentElement.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = 'none';
      summaryFrame = requestAnimationFrame(trackSummary);
    }
  });
  panel.addEventListener('toggle', () => {
    syncArchiveSelection(panel);
    if (layoutCapture?.panel === panel) { adjustSummaryAnchor(); playLayoutShift(); }
    updateCaseIndex();
    if (summaryAnchor?.panel === panel && !summaryAnchor.animated) {
      adjustSummaryAnchor();
      cancelSummaryAnchor();
    }
    queuePanelProgress();
  });
  panel.addEventListener('transitionend', event => {
    if (event.pseudoElement !== '::details-content' || event.propertyName !== 'block-size') return;
    if (summaryAnchor?.panel === panel) {
      adjustSummaryAnchor();
      cancelSummaryAnchor();
    }
    queueProgress();
  });
});
openHashProject();
updateCaseIndex();
initArchive();

function syncHeader() {
  headerHeight = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height',`${headerHeight}px`);
  measureHeadingInk();
}
function resetMorph() {
  name.style.opacity = '';
  signature.style.opacity = '';
  morph.style.visibility = 'hidden';
}
function measureMorph() {
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

function showProjectImage(visual, motion) {
  const current = imageAnimations.get(visual);
  if (current && !motion) { current.cancel(); imageAnimations.delete(visual); }
  if (seenImages.has(visual)) return;
  seenImages.add(visual);
  imageObserver.unobserve(visual);
  if (!motion) return;
  const animation = animate(visual,[
    {clipPath:'inset(0 100% 0 0)'},
    {clipPath:'inset(0 0 0 0)'}
  ],{duration:600,easing:easeInOut});
  if (animation) {
    imageAnimations.set(visual,animation);
    animation.finished.catch(() => {}).finally(() => imageAnimations.delete(visual));
  }
}
const imageObserver = new IntersectionObserver(entries => {
  if (document.hidden) return;
  entries.forEach(entry => {
    const visual = entry.target;
    if (!entry.isIntersecting || entry.intersectionRatio < .001 || !visual.closest('details').open) return;
    const bounds = visual.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) showProjectImage(visual,true);
  });
},{threshold:.001,rootMargin:'0px 0px 32px 0px'});
document.querySelectorAll('.project-visual').forEach(visual => {
  imageObserver.observe(visual);
  visual.parentElement.addEventListener('focus', () => showProjectImage(visual,false));
});

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
  if (presenceInk) presenceInk.style.clipPath = 'inset(0 0% 0 0)';
}
function measureHeadingInk() {
  headingInkTop = null;
  if (!presenceSystem || !fontsReady || document.hidden) return;
  const rect = aboutFrame?.getBoundingClientRect();
  if (rect && Number.isFinite(rect.top) && rect.width > 0 && rect.height > 0) headingInkTop = rect.top + window.scrollY;
}
function updateHeadingInk() {
  if (!presenceInk) return;
  if (headingInkTop === null || reduced.matches || keyboard || document.hidden) return settleHeadingInk();
  const top = headingInkTop-window.scrollY;
  const p = Math.max(0,Math.min(1,(window.innerHeight*.9-top)/(window.innerHeight*.6)));
  presenceInk.style.clipPath = `inset(0 ${100*(1-p)}% 0 0)`;
}
const historyDisclosure = document.querySelector('.history-disclosure');
if (historyDisclosure) historyDisclosure.addEventListener('toggle',queueProgress);
// Personal1007: one native secondary disclosure shares the panel-height refresh.
document.querySelector('.about-example')?.addEventListener('toggle',queuePanelProgress);
document.querySelectorAll('.case-method')?.forEach(method => method.addEventListener('toggle',queueProgress));
// End Personal1007 disclosure.

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

// Releve1007 archive: decoration mirrors native cases, never moves their controls.
function archiveEnhanced() {
  return !!archiveState && window.innerWidth >= 1100 && window.innerHeight >= 720;
}
function syncArchiveMotion() {
  if (!archiveState) return;
  archiveState.stage.classList.toggle('archive-static',!layoutAllowed());
}
function selectArchive(panel) {
  if (!archiveState || !panel) return;
  syncArchiveMotion();
  const changed = archiveState.selected !== panel;
  archiveState.selected = panel;
  archiveState.stage.setAttribute('data-project',panel.id);
  archiveState.layers.forEach(({owner,layer}) => {
    const selected = owner === panel;
    layer.classList.toggle('is-active',selected);
    if (selected) owner.setAttribute('data-preview-selected','true');
    else owner.removeAttribute('data-preview-selected');
  });
  if (changed) queueProgress();
}
function syncArchiveSelection(preferred) {
  if (!archiveState) return;
  const opened = projectPanels.find(panel => panel.open);
  selectArchive(opened || preferred || archiveState.selected || projectPanels[0]);
}
function initArchive() {
  const layout = document.querySelector('.work-archive-layout');
  const stage = document.querySelector('.archive-stage');
  if (!layout || !stage) return;
  const layers = [];
  for (const owner of projectPanels) {
    const source = owner.querySelector('.summary-preview');
    if (!source) return;
    const layer = source.cloneNode(true);
    layer.removeAttribute('id');
    layer.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    layer.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(node => node.remove());
    layer.classList.add('archive-layer');
    layer.setAttribute('aria-hidden','true');
    layer.setAttribute('data-project',owner.id);
    layer.querySelectorAll('img').forEach(img => {
      const width = Number(img.getAttribute('width'));
      if (width > 0) img.style.maxWidth = `${width/2}px`;
      img.style.alignSelf = 'center';
    });
    layers.push({owner,layer});
  }
  layers.forEach(({layer}) => stage.appendChild(layer));
  archiveState = {layout,stage,layers,selected:null};
  projectPanels.forEach(panel => {
    const choose = () => {
      if (archiveEnhanced() && !projectPanels.some(owner => owner.open)) selectArchive(panel);
    };
    const summary = panel.querySelector('summary');
    summary.addEventListener('pointerenter',choose);
    summary.addEventListener('focus',choose);
  });
  syncArchiveSelection();
  layout.classList.add('archive-ready');
}
// End Releve1007 archive.

// Atlas reflow: only visible decorative children, never summaries or their hit areas.
function layoutAllowed() {
  return !keyboard && !reduced.matches && !document.hidden &&
    (typeof document.hasFocus !== 'function' || document.hasFocus());
}
function readLayoutFrames() {
  const frames = new Map();
  if (!layoutAllowed() || archiveEnhanced()) return frames;
  projectPanels.forEach(panel => {
    const summary = panel.querySelector('summary');
    const bounds = summary.getBoundingClientRect();
    if (!(bounds.width > 0 && bounds.height > 0) || bounds.top > window.innerHeight*.72 || bounds.top + bounds.height < headerHeight) return;
    summary.querySelectorAll('.project-title, .summary-preview').forEach((part,index) => {
      const rect = part.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) frames.set(part,{rect,index,summary,summaryTop:bounds.top});
    });
  });
  return frames;
}
function cancelLayoutMotion() {
  layoutCapture = null;
  layoutMotions.forEach((animation,part) => {
    animation.cancel();
    part.style.transform = 'none';
    part.style.transformOrigin = '';
  });
  layoutMotions.clear();
}
function captureLayoutShift(panel) {
  const frames = readLayoutFrames();
  cancelLayoutMotion();
  if (layoutAllowed() && frames.size) layoutCapture = {panel,frames};
}
function playLayoutShift() {
  const capture = layoutCapture;
  layoutCapture = null;
  if (!capture || !layoutAllowed()) return;
  // Reset scene offsets before measuring the final layout, then batch all reads.
  capture.frames.forEach((_,part) => { part.style.transform = 'none'; });
  const end = [...capture.frames].map(([part,first]) => ({part,first,last:part.getBoundingClientRect(),summary:first.summary.getBoundingClientRect()}));
  end.forEach(({part,first,last,summary}) => {
    if (!part.animate || last.width <= 0 || last.height <= 0 || summary.top > window.innerHeight*.72 || summary.top + summary.height < headerHeight) return;
    const dx = first.rect.left-last.left;
    // Native anchoring owns the summary position; animate only its internal reflow.
    const dy = (first.rect.top-first.summaryTop)-(last.top-summary.top);
    const sx = first.index ? first.rect.width/last.width : 1;
    const sy = first.index ? first.rect.height/last.height : 1;
    if (![dx,dy,sx,sy].every(Number.isFinite) || (Math.abs(dx)+Math.abs(dy) < .5 && Math.abs(sx-1)+Math.abs(sy-1) < .01)) return;
    part.style.transformOrigin = '0 0';
    const animation = part.animate([
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`},
      {transform:'translate3d(0,0,0) scale(1,1)'}
    ],{duration:280,easing:easeOut,fill:'both'});
    layoutMotions.set(part,animation);
    animation.finished.catch(() => {}).finally(() => {
      if (layoutMotions.get(part) !== animation) return;
      layoutMotions.delete(part);
      animation.cancel();
      part.style.transformOrigin = '';
      part.style.transform = 'none';
      queueProgress();
    });
  });
}

// Shared circular scenes: event-driven through the existing progress frame.
function settleScenes() {
  if (heroCopy) { heroCopy.style.opacity = ''; heroCopy.style.transform = ''; heroCopy.style.pointerEvents = ''; }
  if (proofImage) { proofImage.style.clipPath = 'none'; proofImage.style.transform = 'none'; }
  [...posterLines,...contactLines].forEach(line => { line.style.transform = 'none'; line.style.clipPath = 'none'; });
  if (aboutPoster) { aboutPoster.style.transform = 'none'; aboutPoster.style.transformOrigin = ''; }
  archiveState?.layers.forEach(({layer}) => { layer.style.transform = 'none'; layer.style.transformOrigin = ''; });
  if (workWash) workWash.style.clipPath = 'none';
  if (contactWash) { contactWash.style.clipPath = 'none'; contactWash.style.opacity = ''; }
  if (contactSheet) contactSheet.style.transform = 'none';
  syncArchiveMotion();
  sceneHeadlines.forEach(target => { target.style.clipPath = 'none'; target.style.transform = 'none'; target.style.transformOrigin = ''; });
  projectPanels.forEach(panel => panel.querySelector('summary').querySelectorAll('.project-title, .summary-preview').forEach(part => { part.style.transform = 'none'; part.style.transformOrigin = ''; }));
}
function updateScenes() {
  syncArchiveMotion();
  syncArchiveSelection();
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
  const rows = projectPanels.map((panel,index) => {
    const summary = panel.querySelector('summary');
    return {panel,index,summary,rect:summary.getBoundingClientRect(),parts:[...summary.querySelectorAll('.project-title, .summary-preview')]};
  });
  const headlines = sceneHeadlines.map(target => {
    const wrapper = target.closest?.('.work-heading, .contact-intro') || (target.id === 'contact-title' ? contactRegion : workRegion);
    return {target,wrapper,rect:wrapper?.getBoundingClientRect()};
  });
  const surfaces = [[workRegion,workWash],[contactRegion,contactWash]].flatMap(([region,wash]) => {
    if (!region || !wash) return [];
    return [{region,wash,rect:region.getBoundingClientRect(),style:getComputedStyle(region)}];
  });
  rows.forEach(({panel,summary,rect,parts}) => {
    parts.forEach((part,index) => {
      if (layoutMotions.has(part)) return;
      // offsetTop belongs to the stable positioned summary, not the transformed preview.
      const top = rect.top+(part.offsetTop || 0);
      const p = atEnd || archiveEnhanced() || panel.open || summary.contains?.(document.activeElement) ? 1 : sceneProgress(clamp((viewport-top)/Math.max(1,viewport*.38)));
      part.style.transformOrigin = p >= 1 ? '' : '50% 50%';
      part.style.transform = p >= 1 ? 'none' : `translate3d(0,${(index ? 24 : 10)*(1-p)}px,0)${index ? ` scale(${1-.06*(1-p)})` : ''}`;
    });
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
  if (archiveState) {
    const rect = archiveState.stage.getBoundingClientRect();
    const focused = workRegion?.contains?.(document.activeElement);
    const p = atEnd || !archiveEnhanced() || focused || projectPanels.some(panel => panel.open) || rect.width <= 0 || rect.height <= 0 ? 1 : sceneProgress(clamp((viewport-rect.top)/Math.max(1,viewport*.38)));
    archiveState.layers.forEach(({owner,layer}) => {
      const amount = owner === archiveState.selected ? 1-p : 0;
      layer.style.transformOrigin = amount ? '50% 50%' : '';
      layer.style.transform = amount ? `translate3d(0,${32*amount}px,0) scale(${1-.06*amount})` : 'none';
    });
  }
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

startIntro();
