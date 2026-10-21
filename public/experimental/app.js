'use strict';
(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let keyboard = false;
let smoothActive = false;
let restoreTimer = 0;
let endTimer = 0;

function finishNavigation() {
  clearTimeout(restoreTimer);
  clearTimeout(endTimer);
  document.documentElement.style.scrollBehavior = '';
  smoothActive = false;
}
function cancelNavigation() {
  const active = smoothActive;
  finishNavigation();
  if (active) window.scrollTo({top: window.scrollY, behavior: 'instant'});
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
    // Keep native hash history and focus behavior; CSS offsets the fixed capsule.
    if (!reduced.matches && !keyboard && event.detail > 0) {
      smoothActive = true;
      document.documentElement.style.scrollBehavior = 'smooth';
      restoreTimer = setTimeout(() => { document.documentElement.style.scrollBehavior = ''; }, 0);
      endTimer = setTimeout(finishNavigation, 1500);
    }
  });
});
reduced.addEventListener('change', () => { if (reduced.matches) cancelNavigation(); });
window.addEventListener('wheel', cancelNavigation, {passive: true});
window.addEventListener('touchstart', cancelNavigation, {passive: true});
window.addEventListener('scrollend', finishNavigation);
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
