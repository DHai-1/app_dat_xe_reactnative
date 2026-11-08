const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, setInterval, clearInterval, require: name => { if (name in mocks) return mocks[name]; throw Error(name); } });
  return exports;
}
for (const mode of ['pending', 'denied', 'unsupported']) {
  test(`foreground GPS starts while background permission is ${mode}`, async () => {
    const effects = [], published = [], updates = [];
    const sample = { timestamp: Date.now(), coords: { latitude: 21.03, longitude: 105.84, accuracy: 10 } };
    let callback, heartbeats = 0, removed = 0;
    const user = { id: 4, status: 'ONLINE' };
    const store = selector => selector({ user });
    store.getState = () => ({ setActiveRide() {} });
    const health = selector => selector({ retryVersion: 0 });
    health.getState = () => ({ update: value => updates.push(value), retry() {} });
    const api = load('apps/driver/src/components/DriverRealtimeBridge.tsx', {
      '@/config/env': { env: { locationIntervalMs: 4000 } }, '@/lib/api': {},
      '@/lib/backgroundLocation': {
        publishDriverLocation: point => published.push(point), restoreLastLocation: async () => {},
        startDriverBackgroundLocation: () => mode === 'pending' ? new Promise(() => {}) : mode === 'denied' ? Promise.resolve(false) : Promise.reject(Error('unsupported')),
        startDriverLocationHeartbeat: () => heartbeats++, stopDriverBackgroundLocation: async () => {},
      },
      '@/lib/realtime': { driverRealtime: {} }, '@/lib/store': { useSessionStore: store },
      '@/lib/driverHealth': { useDriverHealth: health },
      '@tanstack/react-query': { useQuery: () => ({ data: null }), useQueryClient: () => ({}) },
      'expo-location': {
        Accuracy: { High: 4 }, hasServicesEnabledAsync: async () => true,
        requestForegroundPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
        getForegroundPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
        getCurrentPositionAsync: async () => sample,
        watchPositionAsync: async (_options, handler) => { callback = handler; return { remove: () => removed++ }; },
        getBackgroundPermissionsAsync: async () => { throw Error('unsupported'); },
      },
      react: { useEffect: fn => effects.push(fn), useRef: initial => ({ current: initial }) },
      'react-native': { AppState: {} },
    });
    api.DriverRealtimeBridge();
    const cleanup = effects[3]();
    await tick();
    assert.equal(heartbeats, 1);
    assert.equal(published[0], sample);
    callback(sample);
    assert.equal(published.length, 2);
    assert.equal(removed, 0, 'foreground subscription stays alive without background service');
    cleanup();
    assert.equal(removed, 1);
    callback(sample);
    assert.equal(published.length, 2, 'old watcher cannot publish after cleanup');
  });
}
