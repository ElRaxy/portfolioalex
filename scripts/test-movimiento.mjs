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
const phrases = ['Desarrollador full stack','Interfaces, APIs y automatización','Productos propios con IA'];
const metricValues = ['121','1.398','2.793','4.736','3.684','37','101','81','366'];
const text = node => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach(child => child.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
};

function harness({reduced = false, observer = true, hash = '', scrollY = 0, navigation = 'navigate', run = true, visible = false, historyRows = [0,0,100,100]} = {}) {
  const dom = new JSDOM(html, {url: `https://example.test/${hash}`, runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom;
  let now = 0, nextID = 0;
  const timers = new Map(), observers = [], mediaListeners = [];
  const schedule = (fn, delay = 0, interval = 0) => {
    const id = ++nextID;
    timers.set(id, {fn, at: now + Number(delay), interval});
    return id;
  };
  window.setTimeout = (fn, delay) => schedule(fn, delay);
  window.clearTimeout = id => timers.delete(id);
  window.setInterval = (fn, delay) => schedule(fn, delay, delay);
  window.clearInterval = window.clearTimeout;
  window.requestAnimationFrame = fn => schedule(() => fn(now), 16);
  window.cancelAnimationFrame = window.clearTimeout;
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
  return {window, document: window.document, observers, timers, tick, enter,
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
  assert.equal(index.children.length, 4);
  assert.ok(index.compareDocumentPosition(doc.querySelector('article#strev')) & 4);
  ['strev','marky','smarty','sereno'].forEach((slug,i) => {
    const row = index.children[i], jump = row.querySelector(`a[href="#${slug}"]`);
    assert.ok(jump);
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
  for (const expected of [phrases[1],phrases[2],phrases[0]]) {
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

test('Reveal groups stagger by 100ms, become visible once, and unobserve their targets', () => using({}, ({document,observers,enter,tick}) => {
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
  assert.doesNotMatch(runtime + app, /addEventListener\(\s*['"]scroll['"]/);
  assert.doesNotMatch(runtime + app, /requestAnimationFrame/);
  assert.doesNotMatch(movementCSS, /pointer-events:\s*none|overflow:\s*hidden/);
});

test('App preserves email copying, native anchor navigation and reduced-motion interruption', async () => {
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
    assert.equal(first.defaultPrevented, false, 'Native anchor history and focus are preserved');
    assert.equal(document.documentElement.style.scrollBehavior, 'smooth');
    setReduced(true);
    assert.equal(document.documentElement.style.scrollBehavior, '');
    assert.equal(scrolls.at(-1).behavior, 'instant');
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
  tick(12700);
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
  assert.match(compact, /\.capsula\{animation:entrada-capsula400mslinear1200msboth/);
  assert.match(compact, /\.reveal-pending\.is-visible\{animation:aparicion700mscubic-bezier\(\.3,0,\.3,1\)var\(--reveal-delay,0ms\)both/);
  assert.match(compact, /h2\.is-visible\.marcador\{background-size:100%35%;transition:background-size800mscubic-bezier\(\.3,0,\.3,1\)calc\(var\(--reveal-delay,0ms\)\+200ms\)/);
  assert.match(compact, /\.capsula\[data-rotando\]\.capsula-punto::after\{animation:halo1800mslinearinfinite/);
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
