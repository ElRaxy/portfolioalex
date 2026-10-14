import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/experimental/index.html', import.meta.url), 'utf8');
const bootstrap = source.match(/<script>([\s\S]*?)<\/script>/)[1];
// A unit event host exercises policy and deadlines. It does not claim rendered-browser QA.
function harness({ hash = '', restored = false, hidden = false, reduced = false, scroll = 0 } = {}) {
  const windowEvents = new Map(), documentEvents = new Map(), mediaEvents = new Map();
  const attributes = new Map(), timers = new Map();
  const on = table => (name, callback) => table.set(name, [...(table.get(name) || []), callback]);
  const emit = (table, name, event = {}) => (table.get(name) || []).forEach(callback => callback(event));
  const root = { setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) };
  const media = { matches: reduced, addEventListener: on(mediaEvents) };
  const document = { hidden, documentElement: root, addEventListener: on(documentEvents) };
  // Neither late font readiness nor a previous paint should suppress an already-armed entrance.
  Object.defineProperty(document, 'fonts', { get() { throw new Error('Bootstrap must not wait for fonts'); } });
  const window = { addEventListener: on(windowEvents), dispatchEvent: event => emit(windowEvents, event.type, event) };
  const context = { window, document, location: { hash }, scrollY: scroll, matchMedia: () => media,
    performance: { getEntriesByType: type => {
      assert.equal(type, 'navigation', 'Entrance policy must not depend on paint timing');
      return [{ type: restored ? 'back_forward' : 'navigate' }];
    } }, Event: class { constructor(type) { this.type = type; } },
    setTimeout: (callback, delay) => { const id = timers.size + 1; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id) };
  vm.runInNewContext(bootstrap, context);
  return { window, document, context, media, attributes, timers,
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
    host.documentEvent('animationend', { animationName: 'personalCaptionEntry' });
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
  for (const name of ['blur', 'resize', 'pagehide', 'hashchange']) {
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
  assert.equal(deadline.delay, 4000);
  deadline.callback();
  assert.equal(host.attributes.size, 0);
  assert.equal(host.window.portfolioEntry.active, false);
  host.window.portfolioEntry.finish();
  assert.equal(host.attributes.size, 0);
});
