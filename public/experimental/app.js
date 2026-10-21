'use strict';
(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let keyboard = false;
let navigationFrame = 0, endTimer = 0, navigationTarget = null;

function finishNavigation(completed = false) {
  cancelAnimationFrame(navigationFrame);
  clearTimeout(endTimer);
  navigationFrame = endTimer = 0;
  const target = navigationTarget;
  navigationTarget = null;
  if (!target) return;
  if (completed) {
    const temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0;
    if (temporary) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    if (temporary) target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once: true});
  }
  document.dispatchEvent(new CustomEvent('navegacion-fin', {detail: {completed}}));
}
function cancelNavigation() { finishNavigation(false); }
function navigate(target, hash) {
  const from = window.scrollY;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const to = Math.min(max, Math.max(0, from + target.getBoundingClientRect().top - margin));
  const distance = to - from;
  // Port de src/lib/smoothScroll.js: misma curva y duración, solo para anclas.
  const duration = Math.min(900, Math.max(420, Math.abs(distance) * .32));
  const start = performance.now();
  navigationTarget = target;
  if (location.hash !== hash) history.pushState(null, '', hash);
  document.dispatchEvent(new CustomEvent('navegacion-inicio', {detail: {target}}));
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const progress = t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    window.scrollTo({top: from + distance * progress, behavior: 'instant'});
    if (t < 1) navigationFrame = requestAnimationFrame(step);
    else finishNavigation(true);
  };
  navigationFrame = requestAnimationFrame(step);
  endTimer = setTimeout(cancelNavigation, 1500);
}
document.addEventListener('keydown', event => {
  if (event.altKey || event.metaKey || event.ctrlKey) return;
  if (!['Tab', ' ', 'Enter', 'Escape', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
  keyboard = true;
  document.documentElement.classList.add('keyboard');
  cancelNavigation();
});
document.addEventListener('pointerdown', () => {
  keyboard = false;
  document.documentElement.classList.remove('keyboard');
});
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented || link.hasAttribute('download')) return;
    cancelNavigation();
    if (link.target && link.target !== '_self') return;
    let id;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    // Teclado y movimiento reducido conservan el salto y foco nativos instantáneos.
    if (target && !reduced.matches && !keyboard && event.detail > 0) {
      event.preventDefault();
      navigate(target, link.hash);
    }
  });
});
reduced.addEventListener('change', () => { if (reduced.matches) cancelNavigation(); });
window.addEventListener('wheel', cancelNavigation, {passive: true});
window.addEventListener('touchstart', cancelNavigation, {passive: true});
// scrollend también llega entre escrituras instantáneas: solo el rAF decide el final.
window.addEventListener('popstate', cancelNavigation);
window.addEventListener('pagehide', cancelNavigation);

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

})();
