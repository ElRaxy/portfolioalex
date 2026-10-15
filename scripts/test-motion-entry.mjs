import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/experimental/index.html', import.meta.url), 'utf8');
const bootstrap = source.match(/<script>([\s\S]*?)<\/script>/)[1];
// A unit event host exercises policy and deadlines. It does not claim rendered-browser QA.
function harness({ hash = '', restored = false, hidden = false, reduced = false, scroll = 0, rectangles = null, fontReady = null, nodes = {} } = {}) {
  const windowEvents = new Map(), documentEvents = new Map(), mediaEvents = new Map();
  const attributes = new Map(), timers = new Map();
  const on = table => (name, callback) => table.set(name, [...(table.get(name) || []), callback]);
  const emit = (table, name, event = {}) => (table.get(name) || []).forEach(callback => callback(event));
  const root = { setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) };
  const media = { matches: reduced, addEventListener: on(mediaEvents) };
  const writes = new Map();
  let wallTime = 0, animationTime = 0;
  const document = { hidden, documentElement: root, addEventListener: on(documentEvents),
    querySelector: selector => nodes[selector] || (selector === '.intro-story' ? {
      getAnimations: () => [{ animationName: 'storyExit', currentTime: animationTime }]
    } : rectangles?.[selector] ? {
      getBoundingClientRect: () => rectangles[selector],
      querySelector: () => null,
      style: { setProperty: (name, value) => writes.set(selector + name, value) }
    } : null) };
  // Neither late font readiness nor a previous paint should suppress an already-armed entrance.
  Object.defineProperty(document, 'fonts', { get() {
    if (rectangles) return { ready: fontReady || Promise.resolve() };
    throw new Error('Bootstrap must not wait for fonts');
  } });
  const window = { addEventListener: on(windowEvents), dispatchEvent: event => emit(windowEvents, event.type, event) };
  const context = { window, document, location: { hash }, scrollY: scroll, matchMedia: () => media,
    performance: { now: () => wallTime, getEntriesByType: type => {
      assert.equal(type, 'navigation', 'Entrance policy must not depend on paint timing');
      return [{ type: restored ? 'back_forward' : 'navigate' }];
    } }, Event: class { constructor(type) { this.type = type; } },
    setTimeout: (callback, delay) => { const id = timers.size + 1; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id) };
  vm.runInNewContext(bootstrap, context);
  return { window, document, context, media, attributes, timers, writes,
    setWallTime: value => { wallTime = value; },
    setAnimationTime: value => { animationTime = value; },
    event: (name, event) => emit(windowEvents, name, event),
    documentEvent: (name, event) => emit(documentEvents, name, event),
    reduce: () => { media.matches = true; emit(mediaEvents, 'change'); } };
}

test('Root and #inicio arm once without font or first-paint assumptions', () => {
  for (const hash of ['', '#inicio']) {
    const host = harness({ hash });
    assert.equal(host.window.portfolioEntry.active, true);
    assert.equal(host.window.portfolioEntry.started, true);
    assert.equal(host.attributes.get('data-entry'), 'running');
    host.documentEvent('animationend', { animationName: 'storyExit', target: { classList: { contains: name => name === 'intro-story' } } });
    assert.equal(host.window.portfolioEntry.active, false);
    assert.equal(host.attributes.has('data-entry'), false);
    assert.equal(host.timers.size, 0);
    assert.equal(host.window.portfolioEntry.started, true, 'Late IO can consume the CSS-covered encounter without replay');
    host.event('focus');
    assert.equal(host.window.portfolioEntry.active, false, 'Focus must never replay entry');
  }
});

test('Deep links, restored history, reduced motion and restored scroll remain immediately readable', () => {
  for (const options of [{ hash: '#sobre-mi' }, { hash: '#strev' }, { restored: true }, { reduced: true }, { hidden: true }, { scroll: 100 }]) {
    const host = harness(options);
    assert.equal(host.window.portfolioEntry.active, false);
    assert.equal(host.attributes.size, 0);
    assert.equal(host.timers.size, 0);
  }
});

test('Trusted interaction finishes immediately and synthetic input cannot consume the entrance', () => {
  for (const name of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    const host = harness();
    host.event(name, { isTrusted: false });
    assert.equal(host.window.portfolioEntry.active, true);
    host.event(name, { isTrusted: true });
    assert.equal(host.window.portfolioEntry.active, false);
    assert.equal(host.attributes.size, 0);
  }
});

test('Interruption, accessibility changes and bfcache always reveal the final composition', () => {
  for (const name of ['blur', 'resize', 'pagehide', 'hashchange', 'focusin']) {
    const host = harness(); host.event(name);
    assert.equal(host.attributes.size, 0);
  }
  const scrolled = harness(); scrolled.context.scrollY = 12; scrolled.event('scroll');
  assert.equal(scrolled.attributes.size, 0);
  const restored = harness(); restored.event('pageshow', { persisted: true });
  assert.equal(restored.attributes.size, 0);
  const hidden = harness(); hidden.document.hidden = true; hidden.documentEvent('visibilitychange');
  assert.equal(hidden.attributes.size, 0);
  const reduced = harness(); reduced.reduce();
  assert.equal(reduced.attributes.size, 0);
});

test('Failed or absent stylesheet has a bounded release and completed entry is idempotent', () => {
  const host = harness();
  const deadline = [...host.timers.values()][0];
  assert.equal(deadline.delay, 5000);
  deadline.callback();
  assert.equal(host.attributes.size, 0);
  assert.equal(host.window.portfolioEntry.active, false);
  host.window.portfolioEntry.finish();
  assert.equal(host.attributes.size, 0);
});


test('Only the final story wrapper ends the scene; content and signature animation events cannot cut it short', () => {
  const host = harness();
  const target = { classList: { contains: name => name === 'intro-story' } };
  for (const animationName of ['personalCaptionEntry', 'storyLand', 'storyCharacterLand', 'storyRuleDraw', 'storyCursorBuild']) {
    host.documentEvent('animationend', { animationName, target });
    assert.equal(host.window.portfolioEntry.active, true);
  }
  host.documentEvent('animationend', { animationName: 'storyExit', target: { classList: { contains: () => false } } });
  assert.equal(host.window.portfolioEntry.active, true);
  host.documentEvent('animationend', { animationName: 'storyExit', target });
  assert.equal(host.window.portfolioEntry.active, false);
});


test('The assembled words and character land on their real responsive destinations without delaying the entrance', async () => {
  const rectangles = {
    '.story-word--alex': { left: 30, top: 100, width: 300 },
    '.hero-personal .name-word.first': { left: 24, top: 90, width: 100 },
    '.story-word--mico': { left: 60, top: 260, width: 320 },
    '.hero-personal .name-word.last': { left: 134, top: 90, width: 120 },
    '.story-character': { left: 110, top: 380, width: 260 },
    '.hero-personal .portrait-scene': { left: 55, top: 450, width: 280 }
  };
  const host = harness({ rectangles });
  assert.equal(host.window.portfolioEntry.active, true);
  host.documentEvent('DOMContentLoaded');
  assert.equal(host.writes.get('.story-word--alex--story-land'), 'translate(-6px,-10px) scale(0.3333333333333333)');
  assert.equal(host.writes.get('.story-word--mico--story-land'), 'translate(74px,-170px) scale(0.375)');
  assert.equal(host.writes.get('.story-character--story-land'), 'translate(-55px,70px) scale(1.0769230769230769)');
  await Promise.resolve();
  assert.equal(host.window.portfolioEntry.active, true, 'Font refinement must not restart or finish the scene');
  host.window.portfolioEntry.finish();
  host.documentEvent('DOMContentLoaded');
  assert.equal(host.window.portfolioEntry.active, false, 'Geometry readiness must never replay a cancelled scene');
});


test('Cold stylesheet load uses the CSS playhead even when DOMContentLoaded arrives after 1500 ms', async () => {
  const rectangles = {
    '.story-word--alex': { left: 30, top: 100, width: 300 },
    '.hero-personal .name-word.first': { left: 24, top: 90, width: 100 }
  };
  const host = harness({ rectangles });
  host.setWallTime(1800);
  host.setAnimationTime(180);
  host.documentEvent('DOMContentLoaded');
  assert.equal(host.writes.get('.story-word--alex--story-land'), 'translate(-6px,-10px) scale(0.3333333333333333)');
  await Promise.resolve();
  assert.equal(host.window.portfolioEntry.active, true);
});

test('Fonts resolving after the transfer starts cannot retarget the moving sketch', async () => {
  let resolveFonts;
  const fontReady = new Promise(resolve => { resolveFonts = resolve; });
  const rectangles = {
    '.story-word--alex': { left: 30, top: 100, width: 300 },
    '.hero-personal .name-word.first': { left: 24, top: 90, width: 100 }
  };
  const host = harness({ rectangles, fontReady });
  host.documentEvent('DOMContentLoaded');
  const original = host.writes.get('.story-word--alex--story-land');
  rectangles['.hero-personal .name-word.first'].width = 140;
  host.setAnimationTime(1700);
  resolveFonts();
  await Promise.resolve();
  assert.equal(host.writes.get('.story-word--alex--story-land'), original);
  assert.equal(host.window.portfolioEntry.active, true, 'A late refinement must leave the current film running');
});

test('An initial measurement arriving after transfer releases the hero instead of using an unmeasured flight', () => {
  const host = harness({ rectangles: {} });
  host.setAnimationTime(1700);
  host.documentEvent('DOMContentLoaded');
  assert.equal(host.window.portfolioEntry.active, false);
  assert.equal(host.writes.size, 0);
});


test('Intro eyes are armed only after their own portrait finishes decoding without gating the scene', async () => {
  let decodeImage;
  const decoded = new Promise(resolve => { decodeImage = resolve; });
  const classes = new Set();
  const character = { querySelector: selector => {
    assert.equal(selector, 'img');
    return { decode: () => decoded };
  }, classList: { add: value => classes.add(value) } };
  const host = harness({ rectangles: {}, nodes: { '.story-character': character } });
  host.documentEvent('DOMContentLoaded');
  assert.equal(classes.has('is-decoded'), false, 'Floating eyes must stay hidden while the portrait is undecoded');
  assert.equal(host.window.portfolioEntry.active, true, 'The scene must start without waiting for image decode');
  decodeImage();
  await Promise.resolve();
  assert.equal(classes.has('is-decoded'), true);
  assert.equal(host.window.portfolioEntry.active, true, 'Asset readiness cannot finish or restart the timeline');
});

test('A decoded portrait arriving after cancellation cannot rearm eyes or the entrance', async () => {
  let decodeImage;
  const decoded = new Promise(resolve => { decodeImage = resolve; });
  const classes = new Set();
  const character = { querySelector: () => ({ decode: () => decoded }), classList: { add: value => classes.add(value) } };
  const host = harness({ rectangles: {}, nodes: { '.story-character': character } });
  host.documentEvent('DOMContentLoaded');
  host.window.portfolioEntry.finish();
  decodeImage();
  await Promise.resolve();
  assert.equal(classes.size, 0);
  assert.equal(host.window.portfolioEntry.active, false);
  assert.equal(host.attributes.size, 0);
});

test('A portrait decode failure keeps intro eyes hidden and lets the existing timeline finish', async () => {
  const classes = new Set();
  const character = { querySelector: () => ({ decode: () => Promise.reject(new Error('Invalid image')) }), classList: { add: value => classes.add(value) } };
  const host = harness({ rectangles: {}, nodes: { '.story-character': character } });
  host.documentEvent('DOMContentLoaded');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(classes.size, 0);
  assert.equal(host.window.portfolioEntry.active, true);
  host.window.portfolioEntry.finish();
  assert.equal(host.window.portfolioEntry.active, false);
});
