const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  vm.runInNewContext(compiled.outputText, {
    exports,
    require(name) {
      if (name in mocks) return mocks[name];
      throw new Error(name);
    },
  });
  return exports;
}

test('a live REST offer opens the driver screen without receiving a push', () => {
  const navigated = [];
  const refs = [];
  let refIndex = 0;
  let pathname = '/notifications';
  let driver = { id: 7, status: 'ONLINE' };
  const serverTime = 123_000;
  let appState = { currentState: 'active' };
  let pending = null;
  const router = {
    navigate(destination) { navigated.push(destination.params.rideId); pathname = destination.pathname; },
    setParams(params) { navigated.push(params.rideId); },
  };
  const timing = load('apps/driver/src/lib/offerTiming.ts', {});
  const { PushBridge } = load('apps/driver/src/components/PushBridge.tsx', {
    '@/lib/offerTiming': timing,
    '@/lib/driverOffer': {
      usePendingOffer(ready, poll) {
        assert.ok(ready && poll, 'check for live offers while online outside Home');
        return { data: pending, dataUpdatedAt: Date.now() };
      },
    },
    '@/lib/logger': {},
    '@/lib/notificationDestination': {},
    '@/lib/push': {},
    '@/lib/store': { useSessionStore: select => select({ user: driver }) },
    '@/lib/realtime': {},
    '@datxe/shared': {},
    '@tanstack/react-query': { useQueryClient: () => ({}) },
    'react-native': { AppState: appState },
    'expo-router': {
      useRouter: () => router,
      usePathname: () => pathname,
      useSegments: () => ['(tabs)'],
      useRootNavigationState: () => ({ key: 'ready' }),
    },
    react: {
      useRef(initial) {
        const index = refIndex++;
        return refs[index] ??= { current: initial };
      },
      useEffect(callback) {
        // Only the REST-driven navigation effect, with no FCM or STOMP callbacks.
        if (refIndex === 2) callback();
      },
    },
  });
  function render() { refIndex = 0; PushBridge(); }
  function offer(rideId, clientExpiresAt) {
    return { rideId, offerId: 'offer-' + rideId, serverTime, expiresAt: serverTime + 27000, clientExpiresAt };
  }
  render();
  pending = offer(10, serverTime + 25000);
  appState.currentState = 'background';
  render();
  assert.deepEqual(navigated, []);
  appState.currentState = 'active';
  render();
  render();
  assert.deepEqual(navigated, ['10']);
  pending = offer(11, serverTime - 1);
  render();
  assert.deepEqual(navigated, ['10']);
  pending = offer(12, serverTime + 25000);
  render();
  assert.deepEqual(navigated, ['10', '12']);
});
