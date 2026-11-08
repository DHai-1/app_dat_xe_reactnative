const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function setup(lookup) {
  let clock = 0;
  let timerId = 0;
  const timers = new Map();
  const exports = {};
  const cache = new Map();
  const states = [];
  const calls = [];
  vm.runInNewContext(ts.transpileModule(
    fs.readFileSync('apps/customer/src/features/booking/mapPinResolver.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText, {
    exports, AbortController,
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, at: clock + delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  const place = point => ({ id: 'provider-place', name: 'Street', address: 'Street, District', coordinate: point });
  const resolver = new exports.MapPinResolver(async (point, signal) => {
    calls.push({ point, signal });
    return lookup ? lookup(point, signal) : place(point);
  }, cache, state => states.push(state));
  const advance = async ms => {
    clock += ms;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= clock) { timers.delete(id); timer.fn(); }
    }
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };
  return { ...exports, resolver, cache, calls, states, advance, place, latest: () => states.at(-1) };
}

const a = { lat: 21.03, lng: 105.84 };
const b = { lat: 21.031, lng: 105.841 };

test('reverse lookup waits for a full 800 ms of idle and dragging cancels the pending debounce', async () => {
  const h = setup();
  h.resolver.idle(a);
  await h.advance(799);
  assert.equal(h.calls.length, 0);
  h.resolver.moving();
  await h.advance(2000);
  assert.equal(h.calls.length, 0);
  h.resolver.idle(b);
  await h.advance(800);
  assert.equal(h.calls.length, 1);
  assert.equal(h.latest().phase, 'ready');
});

test('small drags reuse the resolved address but retain the exact pin and a fixed distance anchor', async () => {
  const h = setup();
  h.resolver.idle(a);
  await h.advance(800);
  const fourteenMeters = { ...a, lat: a.lat + 14 / 111195 };
  h.resolver.idle(fourteenMeters);
  await h.advance(800);
  assert.equal(h.calls.length, 1);
  assert.equal(h.latest().place.coordinate.lat, fourteenMeters.lat);
  const sixteenMeters = { ...a, lat: a.lat + 16 / 111195 };
  h.resolver.idle(sixteenMeters);
  await h.advance(800);
  assert.equal(h.calls.length, 2);
});

test('returning to a cached four-decimal cell reuses its address while preserving exact coordinates', async () => {
  const h = setup();
  h.resolver.idle(a);
  await h.advance(800);
  h.resolver.idle(b);
  await h.advance(800);
  const returned = { lat: 21.03001, lng: 105.84001 };
  h.resolver.idle(returned);
  await h.advance(800);
  assert.equal(h.calls.length, 2);
  assert.equal(h.cache.size, 2);
  assert.equal(h.pinCacheKey(returned), '21.0300,105.8400');
  assert.equal(h.latest().place.coordinate.lng, returned.lng);
});

test('dragging aborts in-flight lookup and an ignored abort cannot publish or cache a stale response', async () => {
  const pending = [];
  const h = setup(point => new Promise(resolve => pending.push({ point, resolve })));
  h.resolver.idle(a);
  await h.advance(800);
  h.resolver.moving();
  assert.equal(h.calls[0].signal.aborted, true);
  h.resolver.idle(b);
  await h.advance(800);
  pending[1].resolve(h.place(b));
  await h.advance(0);
  pending[0].resolve(h.place(a));
  await h.advance(0);
  assert.equal(h.latest().place.coordinate.lat, b.lat);
  assert.equal(h.cache.has(h.pinCacheKey(a)), false);
});

test('failed lookups stay out of cache and can be retried at the same coordinate', async () => {
  let attempts = 0;
  const h = setup(point => {
    if (++attempts === 1) throw new Error('Network unavailable');
    return { name: 'Street', address: 'Street, District', coordinate: point };
  });
  h.resolver.idle(a);
  await h.advance(800);
  assert.equal(h.latest().phase, 'error');
  assert.equal(h.cache.size, 0);
  h.resolver.cancel();
  h.resolver.idle(a);
  await h.advance(800);
  assert.equal(h.latest().phase, 'ready');
  assert.equal(h.calls.length, 2);
});

test('repeated idle events cannot starve debounce or restart a completed lookup', async () => {
  const h = setup();
  h.resolver.idle(a);
  for (let i = 0; i < 8; i++) {
    await h.advance(100);
    h.resolver.idle({ ...a });
  }
  assert.equal(h.calls.length, 1);
  assert.equal(h.latest().phase, 'ready');
  const count = h.states.length;
  for (let i = 0; i < 10; i++) {
    h.resolver.idle({ ...a });
    await h.advance(800);
  }
  assert.equal(h.states.length, count);
  assert.equal(h.calls.length, 1);
});

test('sheet padding events preserve the address while map gestures and explicit recentering select a new point', async () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    fs.readFileSync('packages/ui/src/maps/MapCameraSelection.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, { exports });
  const events = new exports.MapCameraSelection();
  const h = setup();
  const begin = gesture => { if (events.begin(gesture)) h.resolver.moving(); };
  const idle = (gesture, point) => { if (events.idle(gesture)) h.resolver.idle(point); };

  idle(false, a);
  await h.advance(800);
  assert.equal(h.calls.length, 1);
  const count = h.states.length;
  for (let i = 0; i < 5; i++) {
    begin(false);
    idle(false, b);
    await h.advance(800);
  }
  assert.equal(h.calls.length, 1);
  assert.equal(h.states.length, count);
  assert.equal(h.latest().place.coordinate.lat, a.lat);

  begin(true);
  idle(false, b);
  await h.advance(800);
  assert.equal(h.calls.length, 2);
  assert.equal(h.latest().place.coordinate.lat, b.lat);

  events.request();
  begin(false);
  idle(false, { lat: 21.032, lng: 105.842 });
  await h.advance(800);
  assert.equal(h.calls.length, 3);
});
