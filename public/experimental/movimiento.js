'use strict';
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const capsule = document.querySelector('header.capsula');
  const line = capsule.querySelector('.capsula-linea');
  const outgoing = document.createElement('span');
  outgoing.className = 'capsula-saliente';
  outgoing.setAttribute('aria-hidden', 'true');
  line.after(outgoing);
  const phrases = [...document.querySelector('#capsula-frases').content.querySelectorAll('li')].map(item => item.textContent.trim());
  const menu = capsule.querySelector('.capsula-menu');
  const navLinks = [...capsule.querySelectorAll('nav a[href^="#"]')];
  const underline = capsule.querySelector('.capsula-subrayado');
  let entryTimer = 0;
  let indexReleased = !root.hasAttribute('data-entrada');
  let entryObserver;
  const pendingIndex = new Set();

  function ventanaSecuencia({cajaTopAbs, alto, innerHeight, scrollMax, scrollY, N}) {
    const a = cajaTopAbs + alto - innerHeight;
    const b = Math.min(scrollMax, cajaTopAbs - 76);
    const p = Math.min(1, Math.max(0, (scrollY - a) / (b > a ? b - a : 1)));
    return {a, b, p, objetivo: Math.round(p * (N - 1))};
  }

  function iniciarSecuencia() {
    const caja = document.querySelector('[data-secuencia]');
    if (!caja) return;
    const fotos = [...caja.querySelectorAll('img')];
    const N = fotos.length;
    const G = fotos.map(img => parseFloat(img.dataset.g) || 1);
    const seccion = caja.closest('section');
    let medidas, observer, raf = 0, visible = 0, objetivo = 0, posicion = 0;
    let ultimo = null, listo = false, cargando = false, suspendida = false;

    function medir() {
      medidas = {
        cajaTopAbs: caja.getBoundingClientRect().top + window.scrollY,
        alto: caja.offsetHeight,
        innerHeight: window.innerHeight,
        scrollMax: Math.max(0, root.scrollHeight - window.innerHeight)
      };
    }
    function mostrar(indice) {
      fotos[visible].style.opacity = '0';
      fotos[visible].style.transform = '';
      visible = indice;
      fotos[visible].style.opacity = '1';
    }
    function pintar() {
      const i = Math.floor(posicion), f = posicion - i;
      mostrar(f < .5 ? i : Math.min(i + 1, N - 1));
      const g = G[i] * Math.pow(G[Math.min(i + 1, N - 1)] / G[i], f);
      const escala = g / G[visible];
      fotos[visible].style.transform = Math.abs(escala - 1) < 1e-4 ? '' : `scale(${escala.toFixed(4)})`;
    }
    function parar() {
      cancelAnimationFrame(raf);
      raf = 0;
      ultimo = null;
    }
    function bucle(t) {
      raf = 0;
      if (reduced.matches || suspendida) return;
      // El primer refresco fija el origen del reloj, sin acumular la espera de decode o reposo.
      const paso = ultimo === null ? 0 : Math.min(t - ultimo, 50) / 50;
      ultimo = t;
      const distancia = objetivo - posicion;
      posicion = Math.abs(distancia) <= paso ? objetivo : posicion + Math.sign(distancia) * paso;
      pintar();
      if (posicion !== objetivo) raf = requestAnimationFrame(bucle);
      else parar();
    }
    function actualizar() {
      if (reduced.matches || suspendida) return;
      objetivo = ventanaSecuencia({...medidas, scrollY: window.scrollY, N}).objetivo;
      if (!listo) return;
      if (posicion === objetivo) parar();
      else if (!raf) raf = requestAnimationFrame(bucle);
    }
    function cargar() {
      if (cargando || reduced.matches || suspendida) return;
      cargando = true;
      observer?.disconnect();
      const promesas = fotos.map(img => {
        img.loading = 'eager';
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        return img.decode();
      });
      Promise.all(promesas).then(() => {
        listo = true;
        medir();
        actualizar();
      }).catch(() => {
        // Un fotograma fallido conserva el primero, sin saltos sobre imágenes vacías.
      });
    }
    function observar() {
      observer?.disconnect();
      if (cargando || reduced.matches || suspendida || !('IntersectionObserver' in window)) return;
      // Los porcentajes de rootMargin dependen del ancho, no del alto de pantalla.
      const margen = window.innerHeight * 1.5;
      observer = new IntersectionObserver(entradas => {
        if (entradas.some(entrada => entrada.isIntersecting)) cargar();
      }, {rootMargin: `${margen}px 0px ${margen}px 0px`});
      observer.observe(seccion);
    }
    function quieto() {
      parar();
      observer?.disconnect();
      caja.classList.remove('viva');
      fotos.forEach(img => { img.style.opacity = ''; img.style.transform = ''; });
    }
    function iniciar() {
      if (reduced.matches || suspendida) { quieto(); return; }
      caja.classList.add('viva');
      fotos.forEach(img => { img.style.opacity = '0'; img.style.transform = ''; });
      posicion = 0;
      pintar();
      ultimo = null;
      medir();
      actualizar();
      observar();
    }
    window.addEventListener('scroll', actualizar, {passive: true});
    window.addEventListener('resize', () => {
      medir();
      actualizar();
      observar();
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => { medir(); actualizar(); }).observe(document.body);
    reduced.addEventListener('change', iniciar);
    window.addEventListener('pagehide', () => { suspendida = true; quieto(); });
    window.addEventListener('pageshow', event => {
      if (event.persisted) { suspendida = false; iniciar(); }
    });
    iniciar();
  }

  function releaseIndex() {
    indexReleased = true;
    pendingIndex.forEach(element => show(element));
    pendingIndex.clear();
  }
  function finishEntry() {
    entryObserver?.disconnect();
    root.removeAttribute('data-entrada');
    clearTimeout(entryTimer);
    releaseIndex();
  }
  if (root.hasAttribute('data-entrada')) {
    entryTimer = setTimeout(finishEntry, 1600);
    // The inline fallback can finish M1 before a late-loaded controller's timer.
    entryObserver = new MutationObserver(() => {
      if (!root.hasAttribute('data-entrada')) finishEntry();
    });
    entryObserver.observe(root, {attributes: true, attributeFilter: ['data-entrada']});
  }
  document.querySelector('.name-word.last')?.addEventListener('animationend', event => {
    if (event.animationName === 'entrada-nombre') releaseIndex();
  });
  capsule.addEventListener('animationend', event => {
    if (event.animationName === 'entrada-capsula') finishEntry();
  });

  function closeMenu(returnFocus = false) {
    capsule.removeAttribute('data-menu-abierto');
    menu.setAttribute('aria-expanded', 'false');
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    capsule.toggleAttribute('data-menu-abierto', open);
  });
  capsule.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      closeMenu(true);
    }
  });
  capsule.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));

  let activeId = '', navLock = '', underlineX = 0;
  function markSection(id, {instant = false} = {}) {
    activeId = id;
    const active = navLinks.find(link => link.hash === `#${id}`);
    navLinks.forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (instant) underline.style.transition = 'none';
    if (active) {
      const nav = active.closest('nav').getBoundingClientRect();
      const bounds = active.getBoundingClientRect();
      underlineX = bounds.left - nav.left;
      if (underline.style.opacity !== '1' && !instant) {
        underline.style.transition = 'none';
        underline.style.transform = `translateX(${underlineX}px) scaleX(0)`;
        underline.getBoundingClientRect();
        underline.style.transition = '';
      }
      underline.style.transform = `translateX(${underlineX}px) scaleX(${bounds.width})`;
      underline.style.opacity = '1';
    } else {
      underline.style.transform = `translateX(${underlineX}px) scaleX(0)`;
      underline.style.opacity = '0';
    }
    if (instant) {
      underline.getBoundingClientRect();
      underline.style.transition = '';
    }
  }
  function markHash() {
    const target = document.getElementById(location.hash.slice(1));
    markSection(target?.closest('main > section')?.id || 'inicio');
  }
  let sectionObserver;
  const sections = [...document.querySelectorAll('main > section')];
  // Two sections can share the band after a jump; the later one is the one being read.
  const inBand = new Set();
  function observeSections() {
    if (!('IntersectionObserver' in window)) return;
    sectionObserver?.disconnect();
    inBand.clear();
    sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? inBand.add(entry.target) : inBand.delete(entry.target));
      const current = sections.filter(section => inBand.has(section)).pop();
      if (current && !navLock) markSection(current.id);
    }, {rootMargin: `-${Math.round(window.innerHeight * .15)}px 0px -${Math.round(window.innerHeight * .65)}px 0px`, threshold: 0});
    sections.forEach(section => sectionObserver.observe(section));
  }
  observeSections();
  navLinks.forEach(link => link.addEventListener('click', () => markSection(link.hash.slice(1))));
  document.addEventListener('navegacion-inicio', event => {
    navLock = event.detail.target.closest('main > section')?.id || 'inicio';
    markSection(navLock);
  });
  document.addEventListener('navegacion-fin', event => {
    navLock = '';
    if (!event.detail.completed) {
      const current = sections.filter(section => inBand.has(section)).pop();
      if (current) markSection(current.id);
    }
  });
  window.addEventListener('hashchange', markHash);
  window.addEventListener('resize', () => { observeSections(); markSection(activeId, {instant: true}); });
  document.fonts?.ready.then(() => markSection(activeId, {instant: true}));
  markHash();

  let phraseIndex = 0;
  let rotationDone = reduced.matches;
  let hovering = false;
  let rotationTimer = 0;
  let changeTimer = 0, haloTimer = 0, haloDue = 0, haloRemaining = 1800;
  let rotationDue = 0;
  let changeDue = 0;
  let rotationRemaining = 4200;
  let changeRemaining = 0;
  const rotationPaused = () => reduced.matches || hovering || capsule.contains(document.activeElement) || document.hidden;

  function finishHalo() {
    clearTimeout(haloTimer);
    haloTimer = 0;
    capsule.removeAttribute('data-halo');
  }
  function scheduleHaloEnd() {
    if (!rotationDone || rotationPaused() || !capsule.hasAttribute('data-halo') || haloTimer) return;
    haloDue = Date.now() + haloRemaining;
    haloTimer = setTimeout(finishHalo, haloRemaining);
  }
  capsule.addEventListener('animationiteration', event => {
    if (event.animationName === 'halo' && rotationDone && !rotationPaused()) finishHalo();
  });
  function finishChange() {
    line.removeAttribute('data-cambio');
    outgoing.removeAttribute('data-saliendo');
    outgoing.textContent = '';
    changeTimer = 0;
    changeRemaining = 0;
  }
  function pauseRotation() {
    if (haloTimer) haloRemaining = Math.max(0, haloDue - Date.now());
    clearTimeout(haloTimer);
    haloTimer = 0;
    capsule.setAttribute('data-pausa', '');
    if (rotationTimer) rotationRemaining = Math.max(0, rotationDue - Date.now());
    if (changeTimer) changeRemaining = Math.max(0, changeDue - Date.now());
    clearTimeout(rotationTimer);
    clearTimeout(changeTimer);
    rotationTimer = changeTimer = 0;
    capsule.removeAttribute('data-rotando');
    line.style.animationPlayState = outgoing.style.animationPlayState = 'paused';
  }
  function resumeRotation() {
    if (rotationPaused()) return;
    capsule.removeAttribute('data-pausa');
    scheduleHaloEnd();
    line.style.animationPlayState = outgoing.style.animationPlayState = '';
    if (changeRemaining && !changeTimer) {
      changeDue = Date.now() + changeRemaining;
      changeTimer = setTimeout(finishChange, changeRemaining);
    }
    if (rotationDone) return;
    capsule.setAttribute('data-rotando', '');
    capsule.setAttribute('data-halo', '');
    if (!rotationTimer) {
      rotationDue = Date.now() + rotationRemaining;
      rotationTimer = setTimeout(rotatePhrase, rotationRemaining);
    }
  }
  function rotatePhrase() {
    rotationTimer = 0;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    outgoing.textContent = line.textContent;
    outgoing.setAttribute('data-saliendo', '');
    line.textContent = phrases[phraseIndex];
    line.setAttribute('data-cambio', '');
    changeRemaining = 550;
    changeDue = Date.now() + changeRemaining;
    changeTimer = setTimeout(finishChange, changeRemaining);
    rotationRemaining = 4200;
    if (phraseIndex === 0) {
      rotationDone = true;
      capsule.removeAttribute('data-rotando');
      scheduleHaloEnd();
    } else resumeRotation();
  }
  capsule.addEventListener('mouseenter', () => { hovering = true; pauseRotation(); });
  capsule.addEventListener('mouseleave', () => { hovering = false; resumeRotation(); });
  capsule.addEventListener('focusin', pauseRotation);
  capsule.addEventListener('focusout', event => {
    if (!capsule.contains(event.relatedTarget)) {
      // focusout precedes the browser updating activeElement.
      setTimeout(resumeRotation, 0);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseRotation();
    else resumeRotation();
  });
  resumeRotation();

  const revealSelectors = [
    '.work-heading .section-kicker', '#work-title', '.work-heading > p', '.work-index > li',
    '.work-project-heading > *', '.work-image', '.case-synthesis', '.project-facts > div', '.work-links',
    '.about-example', '.work-level', '.work-more-list > li', '.work-end',
    '.about-marker', '#about-title', '.about-relato > p', '.about-facts > div',
    '.about-methods > h3', '.about-method-grid > *', '.about-history > h3', '.history-list > article', '.about-utility',
    '.contact-marker', '#contact-title', '.contact-options > a', '.contact-address', '.social-links'
  ].join(', ');
  const revealElements = [...document.querySelectorAll(revealSelectors)];
  const revealed = new WeakSet();
  const decodingReveals = new WeakSet();
  const revealStarted = performance.now();
  const entryAtStart = root.hasAttribute('data-entrada');
  const counted = new WeakSet();
  const counts = new Map();
  let revealObserver;
  let metricObserver;

  function show(element, instant = false) {
    if (revealed.has(element)) return;
    if (!indexReleased && element.matches('.work-index > li')) {
      pendingIndex.add(element);
      return;
    }
    if (!instant && !entryAtStart && performance.now() - revealStarted <= 150 && inViewport(element)) instant = true;
    if (!instant && element.matches('img.work-image') && element.decode) {
      if (decodingReveals.has(element)) return;
      decodingReveals.add(element);
      let timer;
      const timeout = new Promise(resolve => { timer = setTimeout(resolve, 400); });
      Promise.race([element.decode(), timeout]).catch(() => {}).then(() => {
        clearTimeout(timer);
        reveal(element);
      });
      return;
    }
    if (instant) element.classList.remove('reveal-pending');
    reveal(element);
  }
  function reveal(element) {
    if (revealed.has(element)) return;
    revealed.add(element);
    element.classList.add('is-visible');
    revealObserver?.unobserve(element);
    // Once played, the block leaves the pending state so a later CSS match cannot replay it.
    element.addEventListener('animationend', event => {
      if (event.target === element) element.classList.remove('reveal-pending');
    });
  }
  document.addEventListener('focusin', event => {
    const block = event.target.closest('.reveal-pending');
    if (block) {
      if (block.matches('.work-index > li')) finishEntry();
      block.style.setProperty('--reveal-delay', '0ms');
      show(block, true);
      block.classList.remove('reveal-pending');
    }
  });
  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function finishCount(element) {
    const count = counts.get(element);
    if (!count) return;
    clearTimeout(count.timer);
    count.copy.remove();
    element.classList.remove('metric-counting');
    element.replaceChildren(document.createTextNode(count.final));
    counts.delete(element);
  }
  function countMetric(element) {
    if (reduced.matches || counted.has(element)) return;
    counted.add(element);
    metricObserver?.unobserve(element);
    const final = element.textContent.trim();
    const total = Number(final.replace(/\./g, ''));
    const real = document.createElement('span');
    real.className = 'metric-final';
    real.textContent = final;
    const copy = document.createElement('span');
    copy.className = 'metric-copy';
    copy.setAttribute('aria-hidden', 'true');
    copy.textContent = '0';
    element.replaceChildren(real, copy);
    element.classList.add('metric-counting');
    const count = {final, copy, timer: 0, started: Date.now()};
    counts.set(element, count);
    function tick() {
      const elapsed = Date.now() - count.started;
      if (elapsed >= 900) {
        copy.textContent = formatNumber(total);
        finishCount(element);
        return;
      }
      const progress = elapsed / 900;
      copy.textContent = formatNumber(Math.round(total * (1 - (1 - progress) ** 3)));
      count.timer = setTimeout(tick, Math.min(30, 900 - elapsed));
    }
    count.timer = setTimeout(tick, 30);
  }
  function inViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) show(entry.target); });
    }, {threshold: 0.08});
    const groupIndexes = new Map();
    const historyRows = new Map();
    document.querySelectorAll('.history-list').forEach(group => {
      const items = [...group.children];
      const tops = [...new Set(items.map(item => item.offsetTop))].sort((a, b) => a - b);
      items.forEach(item => historyRows.set(item, tops.indexOf(item.offsetTop)));
    });
    revealElements.forEach(element => {
      const group = element.closest('.work-heading') || element.parentElement;
      const index = historyRows.get(element) ?? (groupIndexes.get(group) || 0);
      groupIndexes.set(group, index + 1);
      element.style.setProperty('--reveal-delay', `${index * 100}ms`);
      element.classList.add('reveal-pending');
      revealObserver.observe(element);
      if (inViewport(element)) show(element, !element.matches('.work-index > li') || indexReleased);
    });
    metricObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) countMetric(entry.target); });
    }, {threshold: 0.2});
    document.querySelectorAll('[data-metric]').forEach(element => {
      metricObserver.observe(element);
      if (inViewport(element)) countMetric(element);
    });
  } else revealElements.forEach(element => show(element, true));

  function settleMotion() {
    finishEntry();
    pauseRotation();
    rotationDone = true;
    finishHalo();
    finishChange();
    line.textContent = phrases[0];
    revealObserver?.disconnect();
    metricObserver?.disconnect();
    revealElements.forEach(element => {
      element.classList.remove('reveal-pending');
      element.style.removeProperty('--reveal-delay');
      show(element, true);
    });
    [...counts.keys()].forEach(finishCount);
  }
  reduced.addEventListener('change', () => { if (reduced.matches) settleMotion(); });
  if (reduced.matches) settleMotion();
  window.addEventListener('pagehide', settleMotion);
  iniciarSecuencia();
})();
