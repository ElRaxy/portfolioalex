import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/experimental/index.html', root), 'utf8');
const runtime = await readFile(new URL('public/experimental/movimiento.js', root), 'utf8');
const app = await readFile(new URL('public/experimental/app.js', root), 'utf8');
const styles = await Promise.all(['styles.css','portada-personal.css','recorrido-personal.css','movimiento.css'].map(file => readFile(new URL(`public/experimental/${file}`, root), 'utf8')));
const css = styles.join('\n');
const movementCSS = styles.at(-1);
const doc = new JSDOM(html).window.document;
const phrases = ['Soy desarrollador de Alicante','Estoy puliendo Strev por dentro','Terminé DAW en junio de 2026','Con Smarty pruebo un año de mercado','Ya trabajo en Anuubis Solutions','Seguimos con Marky en simulación','También me gusta diseñar pantallas','Uso Claude Code y Codex a diario','Me fastidia que vuelva el mismo bug'];
const metricValues = ['121','1.398','2.793','4.736','3.684','37','101','81','366'];
const text = node => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach(child => child.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
};

function harness({reduced = false, observer = true, resizeObserver = false, hash = '', scrollY = 0, navigation = 'navigate', run = true, visible = false, historyRows = [0,0,100,100], sequenceTop = 3000, sequenceHeight = 300, scrollHeight = 4000, decoding = 'immediate', frameDuration = 16} = {}) {
  const dom = new JSDOM(html, {url: `https://example.test/${hash}`, runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom;
  let now = 0, nextID = 0;
  const timers = new Map(), observers = [], resizeObservers = [], mediaListeners = [], frames = new Set(), frameRequests = [], decodes = [], listeners = [];
  const addEventListener = window.addEventListener.bind(window);
  window.addEventListener = (type, fn, options) => {
    listeners.push({type, options});
    addEventListener(type, fn, options);
  };
  const schedule = (fn, delay = 0, interval = 0) => {
    const id = ++nextID;
    timers.set(id, {fn, at: now + Number(delay), interval});
    return id;
  };
  window.setTimeout = (fn, delay) => schedule(fn, delay);
  window.clearTimeout = id => timers.delete(id);
  window.setInterval = (fn, delay) => schedule(fn, delay, delay);
  window.clearInterval = window.clearTimeout;
  window.requestAnimationFrame = fn => {
    const id = schedule(() => { frames.delete(id); fn(now); }, frameDuration);
    frames.add(id);
    frameRequests.push(now);
    return id;
  };
  window.cancelAnimationFrame = id => { frames.delete(id); timers.delete(id); };
  window.Date.now = () => now;
  Object.defineProperty(window.performance, 'now', {value: () => now});
  Object.defineProperty(window.performance, 'getEntriesByType', {value: () => [{type: navigation}]});
  Object.defineProperty(window, 'scrollY', {value: scrollY, writable: true});
  Object.defineProperty(window, 'innerWidth', {value:1440,writable:true});
  Object.defineProperty(window, 'innerHeight', {value:900,writable:true});
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const top = visible ? 100 : 2000;
    return {top, bottom: top + 100, left: 0, right: 200, width: 200, height: 100};
  };
  const geometry = {top: sequenceTop, height: sequenceHeight, scrollHeight};
  const sequence = window.document.querySelector('[data-secuencia]');
  if (sequence) {
    sequence.getBoundingClientRect = () => ({top: geometry.top - window.scrollY});
    Object.defineProperty(sequence, 'offsetHeight', {get: () => geometry.height});
  }
  Object.defineProperty(window.document.documentElement, 'scrollHeight', {get: () => geometry.scrollHeight});
  window.HTMLImageElement.prototype.decode = function () {
    if (decoding === 'immediate') { decodes.push({image: this}); return Promise.resolve(); }
    return new Promise((resolve, reject) => decodes.push({image: this, resolve, reject}));
  };
  const history = [...window.document.querySelectorAll('.history-list > article')];
  history.forEach((node, index) => Object.defineProperty(node, 'offsetTop', {get: () => historyRows[index]}));
  const media = {matches: reduced, addEventListener: (_, fn) => mediaListeners.push(fn), removeEventListener() {}};
  window.matchMedia = () => media;
  if (observer) window.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.nodes = new Set(); this.unobserved = []; observers.push(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); this.unobserved.push(node); }
    disconnect() { this.nodes.clear(); }
  };
  else delete window.IntersectionObserver;
  if (resizeObserver) window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.nodes = new Set(); resizeObservers.push(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); }
    disconnect() { this.nodes.clear(); }
  };
  else delete window.ResizeObserver;
  const inline = [...window.document.querySelectorAll('head script:not([src])')].filter(node => node.type !== 'application/ld+json');
  inline.forEach(node => window.eval(node.textContent));
  if (run) window.eval(runtime);
  const tick = duration => {
    const end = now + duration;
    let count = 0;
    while (true) {
      const next = [...timers.entries()].filter(([, task]) => task.at <= end).sort((a,b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      assert.ok(++count < 10000, 'The fake clock cannot spin forever');
      const [id, task] = next;
      now = task.at;
      if (task.interval) task.at += task.interval;
      else timers.delete(id);
      task.fn();
    }
    now = end;
  };
  const enter = node => {
    observers.filter(item => item.nodes.has(node)).forEach(item => item.callback([{target: node, isIntersecting: true, intersectionRatio: 1, boundingClientRect: node.getBoundingClientRect()}]));
  };
  return {window, document: window.document, observers, resizeObservers, timers, tick, enter, geometry, decodes, frames, frameRequests, listeners,
    setReduced(value) { media.matches = value; mediaListeners.forEach(fn => fn({matches: value})); },
    close() { dom.window.close(); },
  };
}

function using(options, fn) {
  const host = harness(options);
  try { fn(host); } finally { host.close(); }
}

// Fragmented names keep the source inventory free of references to removed resources.
const removedClasses = [['intro','story'],['name','morph'],['personal','portrait'],['name','hover'],['sign','ature'],['reading','progress'],['index','bar'],['section','depth','paper'],['work','wash'],['contact','wash'],['contact','sheet'],['journey','accent']].map(parts => parts[0] === 'sign' ? parts.join('') : parts.join('-'));
const removedAttributes = [['data','parallax','scene'],['data','parallax','layer'],['data','journey','order'],['data','entry']].map(parts => parts.join('-'));
const removedFiles = [
  ['public/experimental/', 'recorrido', '-personal.js'], ['public/experimental/', 'character', '-rig.js'],
  ['public/experimental/', 'portrait', '-motion.js'], ['public/experimental/assets/', 'alex-illustration', '-eye-base-v4.png'],
  ['scripts/', 'test-motion', '-entry.mjs'], ['scripts/', 'test-character', '-rig.mjs'],
].map(parts => parts.join(''));

test('F1 structural order, labels, heading hierarchy and accessible links', () => {
  assert.deepEqual([...doc.querySelector('main').children].filter(node => node.tagName === 'SECTION').map(node => node.id), ['inicio','trabajo','sobre-mi','contacto']);
  for (const [id, label] of [['trabajo','01 / Trabajo'],['sobre-mi','02 / Sobre mí'],['contacto','03 / Contacto']]) {
    assert.ok(text(doc.getElementById(id)).includes(label));
    assert.equal(doc.querySelectorAll(`#${id} h2`).length, 1);
  }
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.equal(text(doc.querySelector('a.personal-next')), 'Mi trabajo');
  assert.equal(doc.querySelector('a.personal-next').getAttribute('href'), '#trabajo');
  for (const link of doc.querySelectorAll('a[aria-label]')) assert.ok(link.getAttribute('aria-label').startsWith(text(link)), text(link));
  for (const id of ['work-title','about-title','contact-title']) {
    const heading = doc.getElementById(id);
    assert.equal(heading.tagName, 'H2');
    assert.equal(heading.hasAttribute('aria-label'), false);
    assert.ok(heading.querySelector('.marcador'));
  }
  assert.match(text(doc.querySelector('#sobre-mi')), /Descargar CV/);
  assert.doesNotMatch(text(doc.querySelector('#sobre-mi')), /Explorar mis proyectos/);
});

test('Removed DOM, attributes, resource files and references remain absent', async () => {
  for (const name of removedClasses) {
    assert.equal(doc.querySelector(`.${name}`), null, name);
    assert.equal(css.includes(`.${name}`), false, name);
  }
  for (const name of removedAttributes) assert.equal(doc.querySelector(`[${name}]`), null, name);
  assert.equal((html + runtime + app).includes(['window.portfolio','Entry'].join('')), false);
  for (const file of removedFiles) await assert.rejects(access(new URL(file, root)), {code: 'ENOENT'});
  const files = [];
  async function collect(directory) {
    for (const entry of await readdir(new URL(directory, root), {withFileTypes: true})) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await collect(file);
      else if (/\.(?:html|css|js|mjs|md|json|svg|txt)$/.test(file)) files.push(file);
    }
  }
  for (const directory of ['public','scripts','docs']) await collect(directory);
  files.push('package.json');
  for (const file of files) {
    const source = await readFile(new URL(file, root), 'utf8');
    for (const old of removedFiles) assert.equal(source.includes(old.split('/').at(-1)), false, `${file} references ${old}`);
  }
});

test('Capsule serves its first phrase and a complete accessible navigation without JS', () => {
  const capsule = doc.querySelector('header.capsula');
  assert.ok(capsule);
  assert.equal(text(capsule.querySelector('a[href="#inicio"]')), 'Alex Micó');
  const line = capsule.querySelector('.capsula-linea');
  assert.equal(line.getAttribute('aria-hidden'), 'true');
  assert.equal(line.textContent.trim(), phrases[0]);
  assert.equal(line.hasAttribute('aria-live'), false);
  assert.deepEqual([...doc.querySelector('#capsula-frases').content.querySelectorAll('li')].map(text), phrases);
  const nav = capsule.querySelector('nav[aria-label="Principal"]');
  assert.deepEqual([...nav.querySelectorAll('a')].map(node => [text(node),node.getAttribute('href')]), [['Trabajo','#trabajo'],['Sobre mí','#sobre-mi'],['Contacto','#contacto']]);
  const button = capsule.querySelector('button.capsula-menu');
  assert.equal(text(button), 'Menú');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.ok(doc.getElementById(button.getAttribute('aria-controls')));
  assert.equal(nav.closest('[hidden]'), null);
  assert.equal(doc.documentElement.classList.contains('js'), false);
});

test('Project index has four literal summaries and only two separate case links', () => {
  const index = doc.querySelector('ol.work-index');
  assert.equal(doc.querySelectorAll('ol.work-index').length, 1);
  assert.equal(index.closest('section').id, 'inicio');
  assert.equal(index.parentElement, doc.querySelector('#inicio .personal-layout'));
  assert.equal(index.parentElement, doc.querySelector('.personal-copy').parentElement);
  assert.equal(doc.querySelector('#trabajo .work-index'), null);
  assert.equal(doc.querySelector('#trabajo .work-margin').nextElementSibling, doc.querySelector('article#strev'));
  const label = doc.getElementById(index.getAttribute('aria-labelledby'));
  assert.equal(text(label), 'Proyectos');
  assert.equal(label.closest('[hidden],[aria-hidden="true"]'), null);
  assert.equal(label.nextElementSibling, index);
  assert.ok(doc.querySelector('.personal-actions').compareDocumentPosition(index) & 4);
  assert.equal(index.children.length, 4);
  assert.ok(index.compareDocumentPosition(doc.querySelector('article#strev')) & 4);
  ['strev','marky','smarty','sereno'].forEach((slug,i) => {
    const row = index.children[i], jump = row.querySelector(`a[href="#${slug}"]`);
    assert.ok(jump);
    assert.equal(jump.className, 'work-index-target');
    assert.equal(text(jump.querySelector('span.work-index-estado')), ['En beta','En simulación','En simulación','Código abierto'][i]);
    assert.equal(text(jump.querySelector('.work-index-number')), `0${i + 1}`);
    assert.equal(text(jump.querySelector('.work-index-line')), text(doc.querySelector(`#${slug} .work-one-line`)));
    assert.ok(text(jump).includes(`0${i + 1}`));
    assert.ok(text(jump).includes(text(doc.querySelector(`#${slug} h3`))));
    assert.ok(text(jump).includes(text(doc.querySelector(`#${slug} .work-one-line`))));
    assert.equal(row.querySelector('a a'), null);
    const cases = [...row.querySelectorAll('a[href^="/proyectos/"]')];
    assert.equal(cases.length, ['strev','sereno'].includes(slug) ? 1 : 0);
    if (cases.length) {
      assert.equal(cases[0].getAttribute('href'), `/proyectos/${slug}/`);
      assert.equal(text(cases[0]), 'Ver caso');
      assert.equal(cases[0].getAttribute('aria-label'), `Ver caso de ${text(doc.querySelector(`#${slug} h3`))}`);
    }
  });
});

test('Nine metrics retain final HTML values and all runtime assets have the F1 version', () => {
  assert.deepEqual([...doc.querySelectorAll('span[data-metric]')].map(text), metricValues);
  assert.equal(doc.querySelector('.metric-copy'), null);
  assert.doesNotMatch(runtime, /toLocaleString/);
  for (const element of doc.querySelectorAll('script[src],link[rel="stylesheet"]')) assert.ok((element.getAttribute('src') || element.getAttribute('href')).endsWith('?v=f1-1021-01'));
});

test('Entry guards include deep links, restoration, reduced motion and scroll position', () => {
  for (const options of [{reduced:true},{hash:'#trabajo'},{hash:'#sobre-mi'},{navigation:'back_forward'},{scrollY:5},{scrollY:100}]) using({...options,run:false}, ({document}) => {
    assert.equal(document.documentElement.classList.contains('js'), true);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false, JSON.stringify(options));
  });
  for (const hash of ['', '#inicio']) using({hash,run:false}, ({document,tick}) => {
    assert.equal(document.documentElement.hasAttribute('data-entrada'), true);
    tick(1999); assert.equal(document.documentElement.hasAttribute('data-entrada'), true);
    tick(1); assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
  });
});

test('Entry completes at 1600ms or the final animation event', () => {
  using({}, ({document,tick}) => {
    tick(1599); assert.equal(document.documentElement.hasAttribute('data-entrada'), true);
    tick(1); assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
  });
  using({}, ({window,document}) => {
    const event = new window.Event('animationend', {bubbles:true});
    Object.defineProperty(event, 'animationName', {value:'entrada-capsula'});
    document.querySelector('.capsula').dispatchEvent(event);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
  });
});

test('Rotation changes at 4200ms with 550ms changes and stops after one complete cycle', () => using({}, ({document,tick}) => {
  const capsule = document.querySelector('.capsula'), line = capsule.querySelector('.capsula-linea');
  assert.equal(capsule.hasAttribute('data-rotando'), true);
  tick(4199); assert.equal(line.textContent.trim(), phrases[0]);
  for (const expected of [...phrases.slice(1),phrases[0]]) {
    tick(1); assert.equal(line.textContent.trim(), expected);
    assert.equal(line.hasAttribute('data-cambio'), true);
    tick(549); assert.equal(line.hasAttribute('data-cambio'), true);
    tick(1); assert.equal(line.hasAttribute('data-cambio'), false);
    if (expected !== phrases[0]) tick(3649);
  }
  assert.equal(capsule.hasAttribute('data-rotando'), false);
  tick(20000); assert.equal(line.textContent.trim(), phrases[0]);
}));

test('Hover and focus pause the rotation and halo, including overlapping pause reasons', () => using({}, ({window,document,tick}) => {
  const capsule = document.querySelector('.capsula'), line = capsule.querySelector('.capsula-linea'), link = capsule.querySelector('a');
  tick(1000);
  capsule.dispatchEvent(new window.MouseEvent('mouseenter'));
  assert.equal(capsule.hasAttribute('data-rotando'), false);
  tick(10000); assert.equal(line.textContent.trim(), phrases[0]);
  link.focus();
  capsule.dispatchEvent(new window.MouseEvent('mouseleave'));
  tick(10000); assert.equal(line.textContent.trim(), phrases[0]);
  assert.equal(capsule.hasAttribute('data-rotando'), false);
  link.blur(); tick(0);
  assert.equal(capsule.hasAttribute('data-rotando'), true);
  tick(3199); assert.equal(line.textContent.trim(), phrases[0]);
  tick(1); assert.equal(line.textContent.trim(), phrases[1]);
}));

test('Mobile menu toggles ARIA, closes on navigation and Escape restores focus', () => using({}, ({window,document}) => {
  const button = document.querySelector('.capsula-menu');
  button.click(); assert.equal(button.getAttribute('aria-expanded'), 'true');
  button.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape',bubbles:true}));
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, button);
  button.click();
  document.querySelector('.capsula nav a').click();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
}));

test('Active section is observed and its navigation link receives aria-current', () => using({}, ({document,enter}) => {
  for (const id of ['trabajo','sobre-mi','contacto']) {
    enter(document.getElementById(id));
    const active = [...document.querySelectorAll('.capsula nav a[aria-current="location"]')];
    assert.equal(active.length, 1);
    assert.equal(active[0].getAttribute('href'), `#${id}`);
    assert.match(document.querySelector('.capsula-subrayado').style.transform, /translate/);
  }
}));

test('Reveal groups stagger by 100ms, become visible once, and unobserve their targets', async () => usingSequence({}, async ({document,observers,enter,tick}) => {
  // The hero index now comes first in DOM order; this test exercises M2 after M1.
  tick(1600);
  const pending = [...document.querySelectorAll('.reveal-pending')];
  assert.ok(pending.length > 10);
  const delays = pending.map(node => node.style.getPropertyValue('--reveal-delay'));
  assert.ok(delays.includes('0ms'));
  assert.ok(delays.includes('100ms'));
  assert.ok(delays.includes('200ms'));
  for (const node of pending) {
    const owner = observers.find(item => item.nodes.has(node));
    assert.ok(owner);
    enter(node); tick(1000);
    await flushDecodes();
    assert.equal(node.classList.contains('is-visible'), true);
    assert.equal(owner.unobserved.filter(target => target === node).length, 1);
    enter(node); tick(1000);
    assert.equal(owner.unobserved.filter(target => target === node).length, 1);
  }
  for (const node of document.querySelectorAll('h2 .marcador')) assert.equal(node.closest('h2').classList.contains('is-visible'), true);
}));

test('After a jump that leaves two sections in the band, the later one stays active', () => using({}, ({document,observers}) => {
  const [trabajo, sobreMi, contacto] = ['trabajo','sobre-mi','contacto'].map(id => document.getElementById(id));
  const owner = observers.find(item => item.nodes.has(trabajo));
  const entry = (target, isIntersecting) => ({target, isIntersecting});
  owner.callback([entry(sobreMi, true), entry(contacto, true)]);
  owner.callback([entry(contacto, false), entry(trabajo, true)]);
  assert.equal(document.querySelector('.capsula nav a[aria-current="location"]').getAttribute('href'), '#sobre-mi');
}));

test('A played or focused reveal leaves the pending state, so losing focus cannot replay it', () => using({}, ({window,document,enter,tick}) => {
  // The first linked reveals now live in the hero and must wait for M1.
  tick(1600);
  const [played, focused] = [...document.querySelectorAll('.reveal-pending')].filter(node => node.querySelector('a'));
  enter(played); tick(1000);
  played.dispatchEvent(new window.Event('animationend', {bubbles:true}));
  assert.equal(played.classList.contains('reveal-pending'), false);
  focused.querySelector('a').focus();
  assert.equal(focused.classList.contains('reveal-pending'), false);
  assert.equal(focused.classList.contains('is-visible'), true);
}));

test('Each visual count uses an aria-hidden copy and completes exactly at 900ms', () => using({}, ({document,enter,tick}) => {
  for (const node of document.querySelectorAll('[data-metric]')) {
    const final = text(node);
    enter(node);
    const copy = node.querySelector('.metric-copy');
    assert.ok(copy);
    assert.equal(copy.getAttribute('aria-hidden'), 'true');
    assert.equal(copy.textContent, '0');
    assert.equal(text(node), final);
    tick(450);
    assert.ok(Number(copy.textContent.replaceAll('.','')) > 0);
    assert.ok(Number(copy.textContent.replaceAll('.','')) < Number(final.replaceAll('.','')));
    assert.equal(text(node), final);
    tick(449); assert.ok(node.querySelector('.metric-copy'));
    tick(1);
    assert.equal(copy.textContent, final, 'The last rendered value has exact Spanish grouping');
    assert.equal(node.querySelector('.metric-copy'), null);
    assert.equal(node.classList.contains('metric-counting'), false);
    assert.equal(text(node), final);
    enter(node); assert.equal(node.querySelector('.metric-copy'), null);
  }
}));

test('Reduced motion initially and dynamically makes all content visible and stops clocks', () => {
  using({reduced:true}, ({document,tick}) => {
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
    assert.equal(document.querySelector('.reveal-pending:not(.is-visible),.metric-copy,[data-rotando],[data-cambio]'), null);
    tick(30000);
    assert.equal(document.querySelector('.capsula-linea').textContent.trim(), phrases[0]);
    assert.deepEqual([...document.querySelectorAll('[data-metric]')].map(text), metricValues);
  });
  using({}, ({document,enter,tick,setReduced}) => {
    enter(document.querySelector('[data-metric]')); tick(400);
    assert.ok(document.querySelector('.metric-copy'));
    setReduced(true);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
    assert.equal(document.querySelector('.reveal-pending:not(.is-visible),.metric-copy,[data-rotando],[data-cambio]'), null);
    const phrase = document.querySelector('.capsula-linea').textContent;
    tick(30000); assert.equal(document.querySelector('.capsula-linea').textContent, phrase);
    assert.deepEqual([...document.querySelectorAll('[data-metric]')].map(text), metricValues);
  });
});

test('No IntersectionObserver leaves every block visible and avoids decorative counts', () => using({observer:false}, ({document,tick}) => {
  tick(2000);
  assert.equal(document.querySelector('.reveal-pending:not(.is-visible),.metric-copy'), null);
  assert.deepEqual([...document.querySelectorAll('[data-metric]')].map(text), metricValues);
}));

test('Already visible blocks settle on load without needing a scroll event', () => using({visible:true}, ({document,tick}) => {
  tick(2000);
  assert.equal(document.querySelector('.reveal-pending:not(.is-visible)'), null);
}));

test('CSS encodes approved timing, curves and distances, with progressive visibility', () => {
  const compact = movementCSS.replace(/\s+/g, '');
  for (const value of ['1000ms','1100ms','1200ms','400ms','700ms','800ms','200ms','550ms','1800ms','250ms','500ms','300ms','translateY(30px)','blur(9px)','translateY(20px)','translateY(3px)','blur(2px)','translateX(16px)','scale(1.67)','cubic-bezier(.15,.1,.3,1)','cubic-bezier(.2,1,.3,1)','cubic-bezier(.3,0,.3,1)','cubic-bezier(.33,.6,.67,1)','cubic-bezier(.52,0,.34,1)']) assert.ok(compact.includes(value), value);
  assert.match(compact, /prefers-reduced-motion:no-preference/);
  assert.match(compact, /html\.js[^{}]*\.reveal-pending/);
  assert.match(compact, /prefers-reduced-motion:reduce/);
  assert.match(compact, /background-size:0/);
  assert.match(compact, /background-size:100%/);
  assert.match(compact, /18%/);
  assert.match(compact, /5%/);
  assert.match(css, /box-decoration-break:\s*clone/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /scroll-margin-top:/);
  assert.doesNotMatch(css, /position:\s*sticky/);
  const sequenceModule = runtime.slice(runtime.indexOf('  function ventanaSecuencia('), runtime.indexOf('  function finishEntry('));
  const otherMotion = runtime.replace(sequenceModule, '') + app;
  assert.doesNotMatch(otherMotion, /addEventListener\(\s*['"]scroll['"]/);
  assert.doesNotMatch(runtime.replace(sequenceModule, ''), /requestAnimationFrame/);
  assert.match(app, /requestAnimationFrame\(step\)/);
  assert.match(sequenceModule, /addEventListener\('scroll', actualizar, \{passive: true\}\)/);
  assert.match(sequenceModule, /Math\.min\(t - ultimo, 50\) \/ 50/);
  assert.doesNotMatch(movementCSS, /pointer-events:\s*none|overflow:\s*hidden/);
});

test('App preserves email copying, custom pointer navigation and reduced-motion interruption', async () => {
  const host = harness({run:false});
  const {window,document,tick,setReduced} = host;
  try {
    const copies = [], scrolls = [];
    Object.defineProperty(window.navigator, 'clipboard', {value: {writeText: async value => { copies.push(value); }}});
    window.scrollTo = options => scrolls.push(options);
    window.eval(app);
    document.querySelector('.copy-email').click();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(copies, [document.querySelector('a.email').getAttribute('href').slice(7)]);
    assert.equal(document.querySelector('#copy-status').textContent, 'Correo copiado');
    assert.equal(document.querySelector('.copy-email').hasAttribute('aria-busy'), false);
    const link = document.querySelector('a.personal-next');
    const pointerClick = () => new window.MouseEvent('click', {bubbles:true,cancelable:true,button:0,detail:1});
    const first = pointerClick(); link.dispatchEvent(first);
    assert.equal(first.defaultPrevented, true, 'Pointer anchors use the ported curve');
    assert.equal(window.location.hash, '#trabajo');
    tick(100);
    const beforeReduction = scrolls.length;
    setReduced(true);
    assert.equal(document.documentElement.style.scrollBehavior, '');
    tick(100);
    assert.equal(scrolls.length, beforeReduction);
    link.dispatchEvent(pointerClick());
    assert.equal(document.documentElement.style.scrollBehavior, '');
    setReduced(false);
    document.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Tab',bubbles:true}));
    assert.equal(document.documentElement.classList.contains('keyboard'), true);
    link.dispatchEvent(pointerClick());
    assert.equal(document.documentElement.style.scrollBehavior, '');
    document.dispatchEvent(new window.Event('pointerdown', {bubbles:true}));
    assert.equal(document.documentElement.classList.contains('keyboard'), false);
    tick(2000);
  } finally { host.close(); }
});


test('Approved article, More work, contact and footer copy matches the approved baseline of 2026-10-21', () => {
  const hashes = {
    '#strev':'6b7d9f2b5bbcf0aa3aed30223a769f0a2cd296a63226eb3a6baf4dd336f5b354',
    '#marky':'56efd2261f6ce887dcc68156312fd8eaca524933148e7ba605c6f9a3668bd489',
    '#smarty':'9886b02c5dc8d4001fb228707eff96f7d960985b5bf63ef8501ca817762df80d',
    '#sereno':'03c2221389f715a43f77d90f69943adb69b1f53435a9d86066ca90154e44a4c9',
    '.work-more-list':'b7176a6b7f0e7c3d9b3b6a849c7615858a7bc81ea61b3eff5564298411d73847',
    '#contacto':'37a28f6cb6103dac89dd8d18706ed79b57a88397f67041c64a77b8d0c8f806cc',
    'footer':'ba5bf36ad9ab596b68e643545a4fcedf59259cce571a0263f08a3ad19388dc65',
  };
  for (const [selector,expected] of Object.entries(hashes)) {
    // The old contact heading used adjacent line wrappers without a DOM space.
    const copy = text(doc.querySelector(selector));
    assert.equal(createHash('sha256').update(selector === '#contacto' ? copy.replace(/\s+/g, '') : copy).digest('hex'), expected, selector);
  }
});

test('Section observation has a positive height-based reading band after resize', () => using({}, ({window,document,observers}) => {
  const initial = observers.find(item => item.nodes.has(document.getElementById('trabajo')));
  assert.equal(initial.options.rootMargin, '-135px 0px -585px 0px');
  assert.ok(window.innerHeight - 135 - 585 > 0);
  window.innerHeight = 390;
  window.dispatchEvent(new window.Event('resize'));
  const current = observers.find(item => item !== initial && item.nodes.has(document.getElementById('trabajo')));
  assert.equal(current.options.rootMargin, '-59px 0px -254px 0px');
  assert.equal(initial.nodes.size, 0);
}));

test('Pausing the final phrase transition preserves its remainder without restarting rotation', () => using({}, ({window,document,tick}) => {
  const capsule = document.querySelector('.capsula'), line = capsule.querySelector('.capsula-linea');
  tick(phrases.length * 4200 + 100);
  assert.equal(line.textContent.trim(), phrases[0]);
  assert.equal(line.hasAttribute('data-cambio'), true);
  capsule.dispatchEvent(new window.MouseEvent('mouseenter'));
  tick(10000);
  assert.equal(line.hasAttribute('data-cambio'), true);
  capsule.dispatchEvent(new window.MouseEvent('mouseleave'));
  assert.equal(capsule.hasAttribute('data-rotando'), false);
  tick(449); assert.equal(line.hasAttribute('data-cambio'), true);
  tick(1); assert.equal(line.hasAttribute('data-cambio'), false);
  tick(30000); assert.equal(line.textContent.trim(), phrases[0]);
}));


test('CSS associates each duration with its intended motion, not merely a shared constant', () => {
  const compact = movementCSS.replace(/\s+/g, '');
  assert.match(compact, /\.name-word\{animation:entrada-nombre1000mscubic-bezier\(\.15,\.1,\.3,1\)both/);
  assert.match(compact, /\.name-word\.last\{animation-delay:100ms/);
  assert.match(compact, /\.hero-acento\{animation:entrada-acento1100mscubic-bezier\(\.2,1,\.3,1\)400msboth/);
  assert.match(compact, /\.capsula\{animation:entrada-capsula400msvar\(--ease-out\)1200msboth/);
  assert.match(compact, /\.reveal-pending\.is-visible\{animation:aparicion700msvar\(--ease-out\)var\(--reveal-delay,0ms\)both/);
  assert.match(compact, /h2\.is-visible\.marcador\{background-size:100%35%;transition:background-size800mscubic-bezier\(\.3,0,\.3,1\)calc\(var\(--reveal-delay,0ms\)\+200ms\)/);
  assert.match(compact, /\.capsula\[data-halo\]\.capsula-punto::after\{animation:halo1800mslinearinfinite/);
  assert.match(compact, /\.capsula-linea\[data-cambio\]\{animation:capsula-cambio550mscubic-bezier\(\.33,\.6,\.67,1\)both/);
  assert.match(compact, /\.capsula-subrayado\{[^}]*transition:transform250ms/);
  assert.match(compact, /\.work-indexli::before\{[^}]*background:color-mix\(insrgb,var\(--blue\)5%,transparent\);opacity:0;transition:opacity400mscubic-bezier\(\.52,0,\.34,1\)/);
  assert.match(compact, /transform:translateX\(16px\);transition-duration:500ms/);
  assert.match(compact, /a,button,summary\{transition:opacity300ms/);
});


test('History stagger uses visual rows on desktop and reading order on mobile', () => {
  for (const [historyRows, expected] of [
    [[0,0,100,100], ['0ms','0ms','100ms','100ms']],
    [[0,100,200,300], ['0ms','100ms','200ms','300ms']],
  ]) using({historyRows}, ({document}) => {
    assert.deepEqual([...document.querySelectorAll('.history-list > article')].map(node => node.style.getPropertyValue('--reveal-delay')), expected);
  });
});


test('Hero C: visible and intersecting index rows wait until the name lands at 1100ms, then reveal once with M2', () => {
  for (const visible of [false,true]) using({visible}, ({window,document,observers,enter,tick}) => {
    const rows = [...document.querySelectorAll('.work-index > li')];
    const owner = observers.find(item => item.nodes.has(rows[0]));
    assert.deepEqual(rows.map(row => row.style.getPropertyValue('--reveal-delay')), ['0ms','100ms','200ms','300ms']);
    rows.forEach(enter);
    tick(1099);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), true);
    for (const row of rows) {
      assert.equal(row.classList.contains('is-visible'), false);
      assert.equal(row.classList.contains('reveal-pending'), true);
      assert.equal(owner.unobserved.includes(row), false);
    }
    tick(1);
    const landed = new window.Event('animationend', {bubbles:true});
    Object.defineProperty(landed, 'animationName', {value:'entrada-nombre'});
    document.querySelector('.name-word.last').dispatchEvent(landed);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), true, 'M1 itself still ends at 1600ms');
    for (const row of rows) {
      assert.equal(row.classList.contains('is-visible'), true);
      assert.equal(owner.unobserved.filter(node => node === row).length, 1);
      enter(row);
    }
    tick(5000);
    for (const row of rows) assert.equal(owner.unobserved.filter(node => node === row).length, 1);
  });
});

test('Hero C: only the last name animation releases rows; capsule completion remains the safety net', () => {
  for (const source of ['name','capsule']) using({visible:true}, ({window,document,tick,observers}) => {
    const rows = [...document.querySelectorAll('.work-index > li')];
    const owner = observers.find(item => item.nodes.has(rows[0]));
    tick(1100);
    const complete = (target, name) => {
      const event = new window.Event('animationend', {bubbles:true});
      Object.defineProperty(event, 'animationName', {value:name});
      target.dispatchEvent(event);
    };
    complete(document.querySelector('.name-word'), 'entrada-nombre');
    complete(document.querySelector('.name-word.last'), 'aparicion');
    assert.equal(rows.some(row => row.classList.contains('is-visible')), false);
    if (source === 'name') complete(document.querySelector('.name-word.last'), 'entrada-nombre');
    else complete(document.querySelector('.capsula'), 'entrada-capsula');
    assert.equal(document.documentElement.hasAttribute('data-entrada'), source === 'name');
    assert.equal(rows.every(row => row.classList.contains('is-visible')), true);
    tick(5000);
    for (const row of rows) assert.equal(owner.unobserved.filter(node => node === row).length, 1);
  });
});

test('Hero C: skipped entry shows viewport rows immediately for reduced motion, history, hash and initial scroll', () => {
  for (const options of [{reduced:true},{navigation:'back_forward'},{hash:'#strev'},{hash:'#trabajo'},{scrollY:5},{scrollY:100}]) using({...options,visible:true}, ({document}) => {
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
    for (const row of document.querySelectorAll('.work-index > li')) assert.equal(row.classList.contains('is-visible'), true, JSON.stringify(options));
  });
  for (const row of doc.querySelectorAll('.work-index > li')) {
    assert.equal(row.closest('[hidden],[aria-hidden="true"]'), null);
    assert.equal(row.classList.contains('reveal-pending'), false);
  }
});

test('Hero C: focusing an index link finishes M1 before revealing it and cannot replay the row', () => using({visible:true}, ({window,document,observers,tick}) => {
  const row = document.querySelectorAll('.work-index > li')[2];
  const owner = observers.find(item => item.nodes.has(row));
  tick(300);
  row.querySelector('a').focus();
  assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
  assert.equal(document.activeElement, row.querySelector('a'));
  assert.equal(row.classList.contains('is-visible'), true);
  assert.equal(row.classList.contains('reveal-pending'), false);
  assert.equal(row.style.getPropertyValue('--reveal-delay'), '0ms');
  row.querySelector('a').blur();
  row.dispatchEvent(new window.Event('animationend', {bubbles:true}));
  tick(5000);
  assert.equal(owner.unobserved.filter(node => node === row).length, 1);
}));

test('Hero C: the inline fallback releases queued rows even if the controller starts late', async () => {
  const host = harness({run:false,visible:true});
  const {window,document,tick,observers} = host;
  try {
    tick(1000);
    window.eval(runtime);
    const rows = [...document.querySelectorAll('.work-index > li')];
    const owner = observers.find(item => item.nodes.has(rows[0]));
    tick(999);
    assert.equal(rows.some(row => row.classList.contains('is-visible')), false);
    tick(1);
    await Promise.resolve();
    assert.equal(document.documentElement.hasAttribute('data-entrada'), false);
    assert.equal(rows.every(row => row.classList.contains('is-visible')), true);
    tick(5000);
    for (const row of rows) assert.equal(owner.unobserved.filter(node => node === row).length, 1);
  } finally { host.close(); }
});

test('Hero C: custom index clicks reach each article, transfer focus and mark Trabajo', () => using({visible:true}, ({window,document,tick}) => {
  const scrolls = [];
  window.scrollTo = options => { scrolls.push(options); window.scrollY = options.top; };
  window.eval(app);
  tick(1600);
  for (const slug of ['strev','marky','smarty','sereno']) {
    const event = new window.MouseEvent('click', {bubbles:true,cancelable:true,button:0,detail:1});
    document.querySelector(`.work-index-target[href="#${slug}"]`).dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(window.location.hash, `#${slug}`);
    assert.equal(document.getElementById(slug).tagName, 'ARTICLE');
    const active = document.querySelectorAll('.capsula nav a[aria-current="location"]');
    assert.equal(active.length, 1);
    assert.equal(active[0].getAttribute('href'), '#trabajo');
    assert.equal(text(active[0]), 'Trabajo');
    tick(1000);
    assert.equal(document.activeElement, document.getElementById(slug));
  }
  assert.ok(scrolls.length > 4);
  assert.ok(scrolls.every(options => options.behavior === 'instant'));
}));

test('Hero C: CSS keeps fluid columns, the 1024px breakpoint, visible fallbacks and the hover contract', () => {
  const personal = styles[1].replace(/\s+/g, '');
  const movement = movementCSS.replace(/\s+/g, '');
  assert.match(personal, /\.personal-layout\{display:block;/);
  assert.match(personal, /@media\(min-width:1024px\)\{\.personal-layout\{display:grid;flex:none;grid-template-columns:minmax\(0,1\.05fr\)minmax\(0,1fr\)/);
  assert.match(personal, /\.personal-copy\{grid-column:1;grid-row:1\/3/);
  assert.match(personal, /\.personal-layout>\.work-index\{grid-column:2;grid-row:2/);
  assert.match(personal, /\.work-index-title\{font-size:12px;font-weight:450;letter-spacing:\.025em;color:#686f76/);
  assert.match(movement, /\.work-index-target\{[^}]*grid-template-columns:30pxminmax\(0,1fr\)auto/);
  assert.match(movement, /\.work-index-estado\{[^}]*grid-column:3;grid-row:1;font-size:13px;line-height:1\.3;color:var\(--blue\)/);
  assert.match(movement, /@media\(prefers-reduced-motion:no-preference\)\{html\.js\[data-entrada\]\.work-index>li:not\(\.is-visible\)\{opacity:0;transform:translateY\(20px\)/);
  assert.match(movement, /@media\(prefers-reduced-motion:reduce\)\{[^}]*animation:none!important/);
  const indexRules = [...movement.matchAll(/([^{}]*\.work-index[^{}]*)\{([^{}]*)\}/g)];
  for (const [rule,selector,declarations] of indexRules) {
    assert.doesNotMatch(declarations, /(?:^|;)(?:width|min-width):[1-9][\d.]*px/, rule);
    if (/hover|focus-within/.test(selector) && /transform:/.test(declarations)) assert.match(selector, /work-index-arrow|work-index-target::after/);
  }
  assert.doesNotMatch(css, /(?:#trabajo|\.work\s|\.work-margin|\.work-heading)[^{}]*\.work-index/);
});

const visibleSequenceFrames = document => [...document.querySelectorAll('[data-secuencia] img')]
  .flatMap((image, index) => image.style.opacity === '1' ? [index + 1] : []);
const flushDecodes = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const sequenceObserver = host => host.observers.find(observer => /^\d+(?:\.\d+)?px 0px \d+(?:\.\d+)?px 0px$/.test(observer.options.rootMargin || '') && observer.nodes.has(host.document.getElementById('contacto')));
const scrollSequence = (host, y) => {
  host.window.scrollY = y;
  host.window.dispatchEvent(new host.window.Event('scroll'));
};

async function usingSequence(options, fn) {
  const host = harness(options);
  try { await fn(host); } finally { host.close(); }
}

function sequenceComputedFrames(host, reduced = false) {
  const sheet = host.document.createElement('style');
  const base = movementCSS.slice(0, movementCSS.indexOf('.capsula{'));
  const quiet = movementCSS.match(/@media\(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/)[1];
  sheet.textContent = base + (reduced ? quiet : '');
  host.document.head.append(sheet);
  const visible = [...host.document.querySelectorAll('[data-secuencia] img')]
    .flatMap((image, index) => host.window.getComputedStyle(image).opacity === '1' ? [index + 1] : []);
  sheet.remove();
  return visible;
}

test('Sequence window is pure: whole box, capsule offset, scroll limit and clamped rounded target', () => {
  const source = runtime.slice(runtime.indexOf('  function ventanaSecuencia('), runtime.indexOf('  function iniciarSecuencia('));
  const calculate = new Function(`${source}; return ventanaSecuencia;`)();
  const geometry = {cajaTopAbs: 3000, alto: 300, innerHeight: 900, scrollMax: 3100, N:56};
  assert.deepEqual(calculate({...geometry, scrollY: 2400}), {a:2400, b:2924, p:0, objetivo:0});
  assert.deepEqual(calculate({...geometry, scrollY: 2662}), {a:2400, b:2924, p:.5, objetivo:28});
  assert.deepEqual(calculate({...geometry, scrollY: 2924}), {a:2400, b:2924, p:1, objetivo:55});
  assert.equal(calculate({...geometry, scrollY: -100}).objetivo, 0);
  assert.equal(calculate({...geometry, scrollY: 5000}).objetivo, 55);
  assert.deepEqual(calculate({...geometry, scrollMax: 2700, scrollY: 2550}), {a:2400, b:2700, p:.5, objetivo:28});
  assert.deepEqual(calculate({...geometry, scrollMax:2400.5, scrollY:2400.25}), {a:2400, b:2400.5, p:.5, objetivo:28});
  assert.deepEqual(calculate({...geometry, alto:232, innerHeight:600, scrollY:2632}), {a:2632, b:2924, p:0, objetivo:0});
  assert.equal(calculate({...geometry, N:10, scrollY:2924}).objetivo, 9);
  assert.equal(calculate({...geometry, N:10, scrollY:2662}).objetivo, 5);
  const degenerate = calculate({...geometry, innerHeight:300, scrollMax:3000, scrollY:3000});
  assert.deepEqual(degenerate, {a:3000, b:2924, p:0, objetivo:0});
});

test('Sequence loads only at the height-based observer threshold and waits for every decode', async () => usingSequence({decoding:'pending'}, async host => {
  const {document, decodes, frames, tick, enter} = host;
  const images = [...document.querySelectorAll('[data-secuencia] img')];
  const observer = sequenceObserver(host);
  assert.ok(observer);
  assert.equal(observer.options.rootMargin, '1350px 0px 1350px 0px');
  assert.equal(images.filter(image => image.hasAttribute('data-src')).length, 54);
  assert.equal(images.filter(image => image.hasAttribute('src')).length, 2);
  assert.equal(decodes.length, 0);
  assert.deepEqual(visibleSequenceFrames(document), [1]);
  scrollSequence(host, 3100);
  tick(1000);
  assert.equal(frames.size, 0);
  assert.equal(decodes.length, 0);
  observer.callback([{target:document.getElementById('contacto'), isIntersecting:false}]);
  assert.equal(decodes.length, 0);
  enter(document.getElementById('contacto'));
  assert.equal(images.filter(image => image.hasAttribute('src')).length, 56);
  assert.equal(images.filter(image => image.hasAttribute('data-src')).length, 0);
  assert.ok(images.every(image => image.loading === 'eager'));
  assert.equal(decodes.length, 56);
  assert.equal(observer.nodes.size, 0);
  decodes.slice(0,-1).forEach(decode => decode.resolve());
  await flushDecodes();
  tick(5000);
  assert.deepEqual(visibleSequenceFrames(document), [1]);
  assert.equal(frames.size, 0);
  decodes.at(-1).resolve();
  await flushDecodes();
  assert.equal(frames.size, 1);
  tick(16);
  assert.deepEqual(visibleSequenceFrames(document), [1]);
  tick(32);
  assert.deepEqual(visibleSequenceFrames(document), [2]);
}));

test('Sequence decode failure leaves the first frame still and never enables its clock', async () => usingSequence({decoding:'pending'}, async host => {
  scrollSequence(host, 3100);
  host.enter(host.document.getElementById('contacto'));
  host.decodes.forEach((decode, index) => index === 18 ? decode.reject(new Error('SVG decode failed')) : decode.resolve());
  await flushDecodes();
  host.tick(10000);
  assert.deepEqual(visibleSequenceFrames(host.document), [1]);
  assert.equal(host.frames.size, 0);
  assert.equal(host.frameRequests.length, 0);
}));

test('Sequence visits all 56 frames in both directions, changing every 3 refreshes at 60Hz, and stops', async () => usingSequence({frameDuration:1000/60}, async host => {
  assert.equal('ResizeObserver' in host.window, false);
  assert.deepEqual(visibleSequenceFrames(host.document), [1]);
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  assert.equal(host.frames.size, 0);
  function travel(y, expected) {
    const visited = [visibleSequenceFrames(host.document)[0]];
    let previousRefresh = 0;
    scrollSequence(host, y);
    assert.equal(host.frames.size, 1);
    for (let refresh = 1; refresh <= 167; refresh++) {
      host.tick(1000/60);
      const visible = visibleSequenceFrames(host.document);
      assert.equal(visible.length, 1);
      if (visible[0] !== visited.at(-1)) {
        assert.equal(refresh - previousRefresh, 3, `Frame ${visible[0]} cadence`);
        assert.equal(Math.abs(visible[0] - visited.at(-1)), 1);
        visited.push(visible[0]);
        previousRefresh = refresh;
      }
    }
    assert.deepEqual(visited, expected);
    assert.equal(previousRefresh, 55 * 3);
    assert.equal(host.frames.size, 0);
    const requests = host.frameRequests.length;
    host.tick(1000);
    assert.equal(host.frameRequests.length, requests);
    assert.deepEqual(visibleSequenceFrames(host.document), [expected.at(-1)]);
  }
  travel(3100, Array.from({length:56}, (_, i) => i + 1));
  travel(0, Array.from({length:56}, (_, i) => 56 - i));
}));

test('Sequence reversals retain the continuous position and delayed frames cap dt at 50ms without skipping', async () => usingSequence({frameDuration:1000/60}, async host => {
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 3100);
  host.tick(3 * 1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [2]);
  scrollSequence(host, 0);
  host.tick(1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [1]);
  host.tick(2 * 1000/60);
  assert.equal(host.frames.size, 0);
  scrollSequence(host, 3100);
  host.tick(3 * 1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [2]);
  const [id] = host.frames;
  const delayed = host.timers.get(id);
  delayed.at += 3000;
  host.tick(delayed.at - host.window.performance.now());
  assert.deepEqual(visibleSequenceFrames(host.document), [3]);
  host.tick(1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [3], 'No catch-up burst after suspension');
  host.tick(1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [3]);
  host.tick(1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [4]);
}));

test('Sequence growth is geometric at half a walking step, cuts at .5 and removes unit transforms', async () => usingSequence({frameDuration:25}, async host => {
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 3100);
  host.tick(25 + 33 * 50);
  const images = [...host.document.querySelectorAll('[data-secuencia] img')];
  assert.deepEqual(visibleSequenceFrames(host.document), [34]);
  assert.equal(images[33].style.transform, '');
  host.tick(25);
  assert.deepEqual(visibleSequenceFrames(host.document), [35], 'At f=.5 the upper frame alone is visible');
  const expected = Math.sqrt(1.033 * 1.067) / 1.067;
  const scale = Number(images[34].style.transform.match(/^scale\(([^)]+)\)$/)[1]);
  assert.ok(Math.abs(scale - expected) <= .00005, `${scale} represents the geometric midpoint`);
  assert.ok(images.filter(image => image !== images[34]).every(image => image.style.transform === ''));
  // The visible frame already equals the target, but growth must finish at the integer position.
  scrollSequence(host, 2400 + 524 * 34 / 55);
  assert.equal(host.frames.size, 1);
  host.tick(25);
  assert.deepEqual(visibleSequenceFrames(host.document), [35]);
  assert.equal(images[34].style.transform, '');
  assert.equal(host.frames.size, 0);
}));

test('Sequence scales on every 60Hz refresh and uses the lower frame below the half-step', async () => usingSequence({frameDuration:1000/60}, async host => {
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 3100);
  for (let refresh = 0; refresh < 101; refresh++) host.tick(1000/60);
  const images = [...host.document.querySelectorAll('[data-secuencia] img')];
  assert.deepEqual(visibleSequenceFrames(host.document), [34]);
  const expected = Math.pow(1.067 / 1.033, 1/3);
  assert.ok(Math.abs(Number(images[33].style.transform.match(/scale\(([^)]+)\)/)[1]) - expected) <= .00005);
  host.tick(1000/60);
  assert.deepEqual(visibleSequenceFrames(host.document), [35]);
  const next = 1.033 * Math.pow(1.067 / 1.033, 2/3) / 1.067;
  assert.ok(Math.abs(Number(images[34].style.transform.match(/scale\(([^)]+)\)/)[1]) - next) <= .00005);
}));

test('Sequence quieto clears every transform on reduced motion and pagehide, and pageshow resumes', async () => {
  for (const reason of ['reduced','pagehide']) await usingSequence({frameDuration:25}, async host => {
    host.enter(host.document.getElementById('contacto'));
    await flushDecodes();
    scrollSequence(host, 3100);
    host.tick(25 + 33.5 * 50);
    const images = [...host.document.querySelectorAll('[data-secuencia] img')];
    assert.ok(images.some(image => image.style.transform !== ''));
    if (reason === 'reduced') host.setReduced(true);
    else host.window.dispatchEvent(new host.window.PageTransitionEvent('pagehide', {persisted:true}));
    assert.equal(host.document.querySelector('[data-secuencia]').classList.contains('viva'), false);
    assert.ok(images.every(image => image.style.transform === '' && image.style.opacity === ''));
    assert.equal(host.frames.size, 0);
    const requests = host.frameRequests.length;
    scrollSequence(host, 0);
    host.tick(5000);
    assert.equal(host.frameRequests.length, requests);
    assert.ok(images.every(image => image.style.transform === ''));
    if (reason === 'reduced') host.setReduced(false);
    else host.window.dispatchEvent(new host.window.PageTransitionEvent('pageshow', {persisted:true}));
    assert.deepEqual(visibleSequenceFrames(host.document), [1]);
    assert.ok(images.every(image => image.style.transform === ''));
    scrollSequence(host, 3100);
    host.tick(25 + 33.5 * 50);
    assert.ok(images.some(image => image.style.transform !== ''));
  });
});

test('Sequence CSS anchors growth and clips the nested group; JS and viva reach both levels', () => using({run:false}, host => {
  const sheet = host.document.createElement('style');
  sheet.textContent = styles[0];
  host.document.head.append(sheet);
  const rules = [...sheet.sheet.cssRules];
  const images = [...host.document.querySelectorAll('[data-secuencia] img')];
  const origin = rules.find(rule => rule.style?.getPropertyValue('transform-origin') === '50% var(--sec-oy,10%)');
  assert.ok(origin);
  assert.ok(images.every(image => image.matches(origin.selectorText)));
  const clip = rules.find(rule => rule.selectorText === '.sec-cerca').style;
  for (const [property, value] of Object.entries({position:'absolute',inset:'0',overflow:'hidden','mask-image':'linear-gradient(to bottom,#000 92.5%,transparent)','-webkit-mask-image':'linear-gradient(to bottom,#000 92.5%,transparent)'})) {
    assert.equal(clip.getPropertyValue(property), value);
  }
  assert.deepEqual(sequenceComputedFrames(host), [1], 'JS before its controller shows only the first');
  host.document.querySelector('[data-secuencia]').classList.add('viva');
  assert.deepEqual(sequenceComputedFrames(host), [], 'Viva hides both image levels until painted');
  host.document.querySelector('[data-secuencia]').classList.remove('viva');
  assert.deepEqual(sequenceComputedFrames(host, true), [56]);
}));

test('Sequence resize remeasures its window and rebuilds the preload margin using viewport height', async () => usingSequence({}, async host => {
  const oldObserver = sequenceObserver(host);
  host.window.innerHeight = 600;
  host.window.dispatchEvent(new host.window.Event('resize'));
  assert.equal(oldObserver.nodes.size, 0);
  assert.equal(sequenceObserver(host).options.rootMargin, '900px 0px 900px 0px');
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 2750);
  host.tick(3000);
  // a=2700, b=2924, target=round(50/224*55)=12 -> frame 13.
  assert.deepEqual(visibleSequenceFrames(host.document), [13]);
  host.geometry.top = 3200;
  host.geometry.height = 232;
  host.geometry.scrollHeight = 3400;
  host.window.innerHeight = 900;
  host.window.dispatchEvent(new host.window.Event('resize'));
  host.tick(3000);
  // a=2532, b=min(2500,3124)=2500: degenerate window clamps safely to the last frame.
  assert.deepEqual(visibleSequenceFrames(host.document), [56]);
  assert.deepEqual(host.listeners.filter(listener => listener.type === 'scroll').map(listener => listener.options.passive), [true]);
}));

test('Sequence remeasures when content height changes after decode, without a window resize', async () => usingSequence({resizeObserver:true}, async host => {
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 3000);
  host.tick(3000);
  assert.deepEqual(visibleSequenceFrames(host.document), [56]);
  host.geometry.top = 3600;
  host.geometry.scrollHeight = 4600;
  const observer = host.resizeObservers.find(observer => observer.nodes.has(host.document.body));
  assert.ok(observer, 'ResizeObserver observes document.body');
  observer.callback([{target:host.document.body}]);
  host.tick(3000);
  assert.deepEqual(visibleSequenceFrames(host.document), [1]);
}));

test('Sequence reduced motion starts on frame 56 without its observer, image requests or rAF', async () => usingSequence({reduced:true}, async host => {
  assert.equal(sequenceObserver(host), undefined);
  assert.deepEqual(sequenceComputedFrames(host, true), [56]);
  assert.equal(host.document.querySelectorAll('[data-secuencia] img[data-src]').length, 54);
  host.enter(host.document.getElementById('contacto'));
  scrollSequence(host, 3100);
  host.window.dispatchEvent(new host.window.Event('resize'));
  host.tick(10000);
  assert.equal(host.decodes.length, 0);
  assert.equal(host.frameRequests.length, 0);
  assert.deepEqual(sequenceComputedFrames(host, true), [56]);
}));

test('Sequence reduction cancels queued motion and pending decode cannot restart it; restoring motion works', async () => usingSequence({decoding:'pending'}, async host => {
  scrollSequence(host, 3100);
  host.enter(host.document.getElementById('contacto'));
  host.setReduced(true);
  host.decodes.forEach(decode => decode.resolve());
  await flushDecodes();
  host.tick(5000);
  assert.equal(host.frameRequests.length, 0);
  assert.deepEqual(sequenceComputedFrames(host, true), [56]);
  host.setReduced(false);
  host.tick(80);
  assert.deepEqual(visibleSequenceFrames(host.document), [2]);
  assert.equal(host.frames.size, 1);
  host.setReduced(true);
  const requests = host.frameRequests.length;
  host.tick(5000);
  assert.equal(host.frames.size, 0);
  assert.equal(host.frameRequests.length, requests);
  assert.deepEqual(sequenceComputedFrames(host, true), [56]);
}));

test('Sequence reduction before loading disconnects preloading, and no-JS CSS shows only frame 56', async () => {
  await usingSequence({}, async host => {
    const observer = sequenceObserver(host);
    host.setReduced(true);
    assert.equal(observer.nodes.size, 0);
    observer.callback([{isIntersecting:true}]);
    host.window.dispatchEvent(new host.window.Event('resize'));
    assert.equal(host.decodes.length, 0);
    assert.equal(host.frameRequests.length, 0);
    assert.equal(host.document.querySelectorAll('[data-secuencia] img[data-src]').length, 54);
    assert.deepEqual(sequenceComputedFrames(host, true), [56]);
  });
  const dom = new JSDOM(html);
  try {
    assert.equal(dom.window.document.documentElement.classList.contains('js'), false);
    assert.deepEqual(sequenceComputedFrames({window:dom.window, document:dom.window.document}), [56]);
  } finally { dom.window.close(); }
});

test('Sequence history restoration restarts only its controller without replaying M1 or capsule rotation', async () => usingSequence({navigation:'back_forward'}, async host => {
  assert.equal(host.document.documentElement.hasAttribute('data-entrada'), false);
  host.enter(host.document.getElementById('contacto'));
  await flushDecodes();
  scrollSequence(host, 3100);
  host.tick(80);
  host.window.dispatchEvent(new host.window.PageTransitionEvent('pagehide', {persisted:true}));
  assert.equal(host.frames.size, 0);
  host.tick(5000);
  host.window.dispatchEvent(new host.window.PageTransitionEvent('pageshow', {persisted:true}));
  host.tick(80);
  assert.deepEqual(visibleSequenceFrames(host.document), [2]);
  assert.equal(host.document.documentElement.hasAttribute('data-entrada'), false);
  assert.equal(host.document.querySelector('.capsula').hasAttribute('data-rotando'), false);
}));

test('Sequence uses fixed cuts without prototype parameters, blend modes or debug globals', () => {
  assert.doesNotMatch(runtime + app, /URLSearchParams|location\.search|data-trans|__secuencia/);
  assert.doesNotMatch(html + runtime + app, /[?&](?:debug|modo|ms|fundido|fundidoms|escala|movil)=/);
  const sequenceCSS = [...movementCSS.matchAll(/([^{}]*\.secuencia[^{}]*)\{([^{}]*)\}/g)];
  for (const [, , declarations] of sequenceCSS) assert.doesNotMatch(declarations, /transition|animation/);
});

test('Fluidez AC1: copy, M2 and capsule use the shared ease-out while marker and signature stay unchanged', () => {
  const compact = movementCSS.replace(/\s+/g, '');
  assert.match(styles[0], /--ease-out:cubic-bezier\(\.23,1,\.32,1\)/);
  assert.match(compact, /:is\(\.personal-role,\.personal-statement,\.personal-description,\.personal-actions\)\{animation:aparicion700msvar\(--ease-out\)both/);
  assert.match(compact, /@keyframesentrada-capsula\{from\{opacity:0;translate:0-6px\}to\{opacity:1;translate:00\}\}/);
  assert.match(compact, /\.capsula\{[^}]*transform:translateX\(-50%\)/);
});

const pointerAnchor = (host, href) => {
  const event = new host.window.MouseEvent('click', {bubbles:true,cancelable:true,button:0,detail:1});
  host.document.querySelector(`a[href="${href}"]`).dispatchEvent(event);
  return event;
};
const installScroll = host => {
  const scrolls = [];
  host.window.scrollTo = options => { scrolls.push({top:options.top, at:host.window.performance.now()}); host.window.scrollY = options.top; };
  host.window.eval(app);
  return scrolls;
};

test('Fluidez AC2: anchor lock ignores intermediate sections and scrollend, releases on completion or cancellation', () => {
  for (const stop of ['complete','wheel','touchstart','keydown','timeout']) using({}, host => {
    const {window,document,observers,tick} = host;
    installScroll(host);
    const owner = observers.find(item => item.nodes.has(document.getElementById('trabajo')));
    pointerAnchor(host, '#contacto');
    const current = () => document.querySelector('.capsula nav a[aria-current]').hash;
    assert.equal(current(), '#contacto');
    for (const id of ['trabajo','sobre-mi']) {
      owner.callback([{target:document.getElementById(id),isIntersecting:true}]);
      window.dispatchEvent(new window.Event('scrollend'));
      assert.equal(current(), '#contacto');
    }
    if (stop === 'complete') {
      tick(1000);
      assert.equal(current(), '#contacto', 'Stale observer batch does not displace arrival');
    } else if (stop === 'timeout') {
      for (const id of host.frames) host.timers.delete(id);
      tick(1500);
      assert.equal(current(), '#sobre-mi');
    } else {
      const event = stop === 'keydown' ? new window.KeyboardEvent(stop, {key:'ArrowDown',bubbles:true}) : new window.Event(stop);
      (stop === 'keydown' ? document : window).dispatchEvent(event);
      assert.equal(current(), '#sobre-mi');
    }
    owner.callback([{target:document.getElementById('contacto'),isIntersecting:true}]);
    assert.equal(current(), '#contacto');
  });
});

test('Fluidez AC2: underline grows and shrinks at its link and resize measures without transition', () => using({}, ({window,document,enter}) => {
  const underline = document.querySelector('.capsula-subrayado');
  const link = document.querySelector('.capsula nav a[href="#contacto"]');
  link.closest('nav').getBoundingClientRect = () => ({left:300});
  link.getBoundingClientRect = () => ({left:500,width:80});
  const measured = [];
  underline.getBoundingClientRect = () => { measured.push([underline.style.transform,underline.style.transition]); return {}; };
  enter(document.getElementById('contacto'));
  assert.deepEqual(measured.at(-1), ['translateX(200px) scaleX(0)','none']);
  assert.equal(underline.style.transform, 'translateX(200px) scaleX(80)');
  assert.equal(underline.style.opacity, '1');
  link.getBoundingClientRect = () => ({left:520,width:90});
  window.dispatchEvent(new window.Event('resize'));
  assert.deepEqual(measured.at(-1), ['translateX(220px) scaleX(90)','none']);
  assert.equal(underline.style.transition, '');
  window.history.replaceState(null, '', '#inicio');
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(underline.style.transform, 'translateX(220px) scaleX(0)');
  assert.equal(underline.style.opacity, '0');
  assert.match(movementCSS, /transition:transform 250ms var\(--ease-out\),opacity 150ms var\(--ease-out\)/);
  assert.match(movementCSS, /\.capsula nav a\{transition:opacity 300ms,color 250ms var\(--ease-out\)/);
}));

test('Fluidez AC3: outgoing phrase overlaps 200ms, shares pauses and clears at 550ms without changing cadence', () => using({}, ({window,document,tick,setReduced}) => {
  const capsule = document.querySelector('.capsula'), line = capsule.querySelector('.capsula-linea');
  const outgoing = capsule.querySelector('.capsula-saliente');
  assert.equal(document.querySelectorAll('.capsula-saliente').length, 1);
  assert.equal(outgoing.getAttribute('aria-hidden'), 'true');
  tick(4200);
  assert.equal(outgoing.textContent.trim(), phrases[0]);
  assert.equal(line.textContent, phrases[1]);
  assert.equal(outgoing.hasAttribute('data-saliendo'), true);
  tick(100);
  capsule.dispatchEvent(new window.MouseEvent('mouseenter'));
  assert.equal(outgoing.style.animationPlayState, 'paused');
  assert.equal(line.style.animationPlayState, 'paused');
  tick(9000);
  assert.equal(outgoing.hasAttribute('data-saliendo'), true);
  capsule.dispatchEvent(new window.MouseEvent('mouseleave'));
  tick(449);
  assert.equal(outgoing.hasAttribute('data-saliendo'), true);
  tick(1);
  assert.equal(outgoing.textContent, '');
  assert.equal(outgoing.hasAttribute('data-saliendo'), false);
  assert.equal(line.textContent, phrases[1]);
  tick(3650);
  assert.equal(line.textContent, phrases[2]);
  setReduced(true);
  assert.equal(outgoing.textContent, '');
  tick(10000);
  assert.equal(outgoing.hasAttribute('data-saliendo'), false);
  assert.match(movementCSS, /capsula-salida 200ms var\(--ease-out\) both/);
  assert.match(movementCSS, /@keyframes capsula-salida\{to\{opacity:0;transform:translateY\(-3px\);filter:blur\(2px\)/);
}));

test('Fluidez AC5: anchor curve matches the port, clamps geometry, updates history and focuses without scroll', () => {
  for (const [top,margin,expected,duration] of [[1000,88,912,420],[2100,100,2000,640],[10000,0,3100,900],[-50,0,0,420]]) using({}, host => {
    const {window,document,tick} = host;
    const target = document.getElementById('trabajo');
    target.style.scrollMarginTop = `${margin}px`;
    target.getBoundingClientRect = () => ({top});
    const scrolls = installScroll(host);
    const focus = target.focus.bind(target);
    let focusOptions;
    target.focus = options => { focusOptions = options; focus(options); };
    assert.equal(pointerAnchor(host, '#trabajo').defaultPrevented, true);
    assert.equal(window.location.hash, '#trabajo');
    assert.equal(window.history.length, 2);
    assert.equal(scrolls.length, 0);
    tick(duration - 1);
    for (const sample of scrolls) {
      const t = sample.at / duration;
      const progress = t < .5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;
      assert.ok(Math.abs(sample.top - expected * progress) < 1e-8);
    }
    assert.notEqual(document.activeElement, target);
    tick(17);
    assert.equal(scrolls.at(-1).top, expected);
    assert.equal(document.activeElement, target);
    assert.equal(focusOptions.preventScroll, true);
    assert.equal(host.frames.size, 0);
    target.blur();
    assert.equal(target.hasAttribute('tabindex'), false);
  });
});

test('Fluidez AC5: history back restores the prior hash and cancels an ongoing anchor', {timeout:2000}, async () => usingSequence({}, async host => {
  const {window,tick} = host;
  const scrolls = installScroll(host);
  pointerAnchor(host, '#trabajo'); tick(1000);
  pointerAnchor(host, '#contacto'); tick(100);
  const restored = new Promise(resolve => window.addEventListener('popstate', resolve, {once:true}));
  window.history.back();
  tick(0);
  await restored;
  assert.equal(window.location.hash, '#trabajo');
  const count = scrolls.length;
  tick(1000);
  assert.equal(scrolls.length, count);
  assert.equal(host.frames.size, 0);
}));

test('Fluidez AC5: wheel and touch cancel without stealing focus; keyboard and reduced motion stay native', () => {
  for (const kind of ['wheel','touchstart','keydown','reduced']) using({}, host => {
    const {window,document,tick,setReduced} = host;
    const scrolls = installScroll(host);
    pointerAnchor(host, '#contacto'); tick(100);
    const count = scrolls.length;
    if (kind === 'reduced') setReduced(true);
    else if (kind === 'keydown') document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
    else window.dispatchEvent(new window.Event(kind));
    tick(2000);
    assert.equal(scrolls.length, count);
    assert.notEqual(document.activeElement, document.getElementById('contacto'));
    if (kind === 'keydown' || kind === 'reduced') assert.equal(pointerAnchor(host, '#trabajo').defaultPrevented, false);
  });
  using({}, host => {
    installScroll(host);
    const event = new host.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0,detail:0});
    host.document.querySelector('a.personal-next').dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(host.frames.size, 0);
  });
});

test('Fluidez AC6: viewport content and early restored intersections never enter M2; later content does', () => {
  for (const options of [{},{hash:'#contacto'},{navigation:'back_forward'},{scrollY:100}]) using({...options,visible:true}, ({document}) => {
    for (const node of document.querySelectorAll('.is-visible')) assert.equal(node.classList.contains('reveal-pending'), false);
    for (const node of document.querySelectorAll('.reveal-pending')) assert.ok(node.matches('.work-index > li'));
  });
  using({hash:'#contacto'}, host => {
    const early = host.document.querySelector('#about-title'), late = host.document.querySelector('#work-title');
    const rect = () => ({top:50,bottom:150,height:100});
    early.getBoundingClientRect = rect;
    host.tick(150); host.enter(early);
    assert.equal(early.classList.contains('reveal-pending'), false);
    late.getBoundingClientRect = rect;
    host.tick(1); host.enter(late);
    assert.equal(late.classList.contains('reveal-pending'), true);
    assert.equal(late.classList.contains('is-visible'), true);
  });
});

test('Fluidez AC6: Work images wait for decode once, recover at 400ms or rejection and cannot replay', async () => {
  for (const outcome of ['decoded','timeout','rejected','reduced']) await usingSequence({decoding:'pending'}, async host => {
    const image = host.document.querySelector('img.work-image');
    host.enter(image); host.enter(image);
    assert.equal(host.decodes.length, 1);
    assert.equal(image.classList.contains('is-visible'), false);
    host.tick(399); await flushDecodes();
    assert.equal(image.classList.contains('is-visible'), false);
    if (outcome === 'decoded') host.decodes[0].resolve();
    else if (outcome === 'rejected') host.decodes[0].reject(new Error('decode failed'));
    else if (outcome === 'reduced') host.setReduced(true);
    else host.tick(1);
    await flushDecodes();
    assert.equal(image.classList.contains('is-visible'), true);
    if (outcome === 'reduced') assert.equal(image.classList.contains('reveal-pending'), false);
    const owner = host.observers.find(item => item.unobserved.includes(image));
    assert.equal(owner.unobserved.filter(node => node === image).length, 1);
    host.decodes[0].resolve(); await flushDecodes();
    assert.equal(owner.unobserved.filter(node => node === image).length, 1);
  });
});

test('Fluidez AC7: menu visibility has asymmetric timings, all hover rules require hover, About has a desktop offset', () => {
  assert.match(movementCSS, /visibility:hidden;[^}]*transition:transform 200ms var\(--ease-out\),opacity 200ms var\(--ease-out\),visibility 200ms/);
  assert.match(movementCSS, /\[data-menu-abierto\] #capsula-panel\{[^}]*transition-duration:300ms/);
  assert.match(styles[0], /@media\(min-width:1024px\)\{\.about-sheet\{scroll-margin-top:16px\}\}/);
  const hoverBlock = movementCSS.match(/@media\(hover:hover\) and \(pointer:fine\)\{[\s\S]*?\n\}/)[0];
  assert.match(hoverBlock, /a:hover,button:hover,summary:hover/);
  assert.doesNotMatch(movementCSS.replace(hoverBlock,''), /:hover/);
});

test('Fluidez AC8: halo pauses in place and stops only at its final iteration or the 1800ms limit', () => {
  for (const ending of ['iteration','timeout','paused']) using({}, ({window,document,tick}) => {
    const capsule = document.querySelector('.capsula');
    assert.equal(capsule.hasAttribute('data-halo'), true);
    tick(1000);
    capsule.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.equal(capsule.hasAttribute('data-halo'), true);
    assert.equal(capsule.hasAttribute('data-pausa'), true);
    tick(5000);
    capsule.dispatchEvent(new window.MouseEvent('mouseleave'));
    assert.equal(capsule.hasAttribute('data-pausa'), false);
    tick(phrases.length * 4200 - 1000);
    assert.equal(capsule.hasAttribute('data-rotando'), false);
    assert.equal(capsule.hasAttribute('data-halo'), true);
    const iteration = name => {
      const event = new window.Event('animationiteration',{bubbles:true});
      Object.defineProperty(event,'animationName',{value:name});
      capsule.querySelector('.capsula-punto').dispatchEvent(event);
    };
    iteration('capsula-cambio');
    assert.equal(capsule.hasAttribute('data-halo'), true);
    if (ending === 'iteration') iteration('halo');
    else {
      tick(500);
      if (ending === 'paused') {
        capsule.dispatchEvent(new window.MouseEvent('mouseenter'));
        tick(5000); iteration('halo');
        assert.equal(capsule.hasAttribute('data-halo'), true);
        capsule.dispatchEvent(new window.MouseEvent('mouseleave'));
      }
      tick(1299);
      assert.equal(capsule.hasAttribute('data-halo'), true);
      tick(1);
    }
    assert.equal(capsule.hasAttribute('data-halo'), false);
  });
  assert.match(movementCSS, /\.capsula\[data-pausa\] \.capsula-punto::after\{animation-play-state:paused/);
});

test('Fluidez AC4: delayed name completion owns release and a missing event falls back only at 1600ms', () => {
  for (const eventArrives of [true,false]) using({visible:true}, ({window,document,tick}) => {
    const rows = [...document.querySelectorAll('.work-index > li')];
    tick(1200);
    assert.equal(rows.some(row => row.classList.contains('is-visible')), false, 'No independent 1100ms timer');
    if (eventArrives) {
      const event = new window.Event('animationend', {bubbles:true});
      Object.defineProperty(event,'animationName',{value:'entrada-nombre'});
      document.querySelector('.name-word.last').dispatchEvent(event);
    } else {
      tick(399);
      assert.equal(rows.some(row => row.classList.contains('is-visible')), false);
      tick(1);
    }
    assert.equal(rows.every(row => row.classList.contains('is-visible')), true);
    assert.equal(document.documentElement.hasAttribute('data-entrada'), eventArrives);
  });
});
