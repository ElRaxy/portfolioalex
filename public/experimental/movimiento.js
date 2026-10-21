'use strict';
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const capsule = document.querySelector('header.capsula');
  const line = capsule.querySelector('.capsula-linea');
  const phrases = [...document.querySelector('#capsula-frases').content.querySelectorAll('li')].map(item => item.textContent.trim());
  const menu = capsule.querySelector('.capsula-menu');
  const navLinks = [...capsule.querySelectorAll('nav a[href^="#"]')];
  const underline = capsule.querySelector('.capsula-subrayado');
  let entryTimer = 0;

  function finishEntry() {
    root.removeAttribute('data-entrada');
    clearTimeout(entryTimer);
  }
  if (root.hasAttribute('data-entrada')) entryTimer = setTimeout(finishEntry, 1600);
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

  let activeId = '';
  function markSection(id) {
    activeId = id;
    const active = navLinks.find(link => link.hash === `#${id}`);
    navLinks.forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (active) {
      const nav = active.closest('nav').getBoundingClientRect();
      const bounds = active.getBoundingClientRect();
      underline.style.transform = `translateX(${bounds.left - nav.left}px) scaleX(${bounds.width})`;
      underline.style.opacity = '1';
    } else {
      underline.style.transform = 'translateX(0px) scaleX(0)';
      underline.style.opacity = '0';
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
      if (current) markSection(current.id);
    }, {rootMargin: `-${Math.round(window.innerHeight * .15)}px 0px -${Math.round(window.innerHeight * .65)}px 0px`, threshold: 0});
    sections.forEach(section => sectionObserver.observe(section));
  }
  observeSections();
  navLinks.forEach(link => link.addEventListener('click', () => markSection(link.hash.slice(1))));
  window.addEventListener('hashchange', markHash);
  window.addEventListener('resize', () => { observeSections(); markSection(activeId); });
  document.fonts?.ready.then(() => markSection(activeId));
  markHash();

  let phraseIndex = 0;
  let rotationDone = reduced.matches;
  let hovering = false;
  let rotationTimer = 0;
  let changeTimer = 0;
  let rotationDue = 0;
  let changeDue = 0;
  let rotationRemaining = 4200;
  let changeRemaining = 0;
  const rotationPaused = () => reduced.matches || hovering || capsule.contains(document.activeElement) || document.hidden;

  function finishChange() {
    line.removeAttribute('data-cambio');
    changeTimer = 0;
    changeRemaining = 0;
  }
  function pauseRotation() {
    if (rotationTimer) rotationRemaining = Math.max(0, rotationDue - Date.now());
    if (changeTimer) changeRemaining = Math.max(0, changeDue - Date.now());
    clearTimeout(rotationTimer);
    clearTimeout(changeTimer);
    rotationTimer = changeTimer = 0;
    capsule.removeAttribute('data-rotando');
    line.style.animationPlayState = 'paused';
  }
  function resumeRotation() {
    if (rotationPaused()) return;
    line.style.animationPlayState = '';
    if (changeRemaining && !changeTimer) {
      changeDue = Date.now() + changeRemaining;
      changeTimer = setTimeout(finishChange, changeRemaining);
    }
    if (rotationDone) return;
    capsule.setAttribute('data-rotando', '');
    if (!rotationTimer) {
      rotationDue = Date.now() + rotationRemaining;
      rotationTimer = setTimeout(rotatePhrase, rotationRemaining);
    }
  }
  function rotatePhrase() {
    rotationTimer = 0;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    line.textContent = phrases[phraseIndex];
    line.setAttribute('data-cambio', '');
    changeRemaining = 550;
    changeDue = Date.now() + changeRemaining;
    changeTimer = setTimeout(finishChange, changeRemaining);
    rotationRemaining = 4200;
    if (phraseIndex === 0) {
      rotationDone = true;
      capsule.removeAttribute('data-rotando');
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
  const counted = new WeakSet();
  const counts = new Map();
  let revealObserver;
  let metricObserver;

  function show(element) {
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
      block.style.setProperty('--reveal-delay', '0ms');
      show(block);
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
      if (inViewport(element)) show(element);
    });
    metricObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) countMetric(entry.target); });
    }, {threshold: 0.2});
    document.querySelectorAll('[data-metric]').forEach(element => {
      metricObserver.observe(element);
      if (inViewport(element)) countMetric(element);
    });
  } else revealElements.forEach(show);

  function settleMotion() {
    finishEntry();
    pauseRotation();
    rotationDone = true;
    finishChange();
    line.textContent = phrases[0];
    revealObserver?.disconnect();
    metricObserver?.disconnect();
    revealElements.forEach(element => {
      element.classList.remove('reveal-pending');
      element.style.removeProperty('--reveal-delay');
      show(element);
    });
    [...counts.keys()].forEach(finishCount);
  }
  reduced.addEventListener('change', () => { if (reduced.matches) settleMotion(); });
  if (reduced.matches) settleMotion();
  window.addEventListener('pagehide', settleMotion);
})();
