const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function fixture() {
  const source = fs.readFileSync('apps/customer/src/lib/useRideCompletion.ts', 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  const states = [];
  const refs = [];
  const effects = [];
  const listeners = new Set();
  const routes = [];
  let stateIndex, refIndex, effectIndex, dirty;
  let active = null;
  let params = {};
  let pathname = '/home';
  let detailId;
  const rides = new Map();
  const AppState = {
    currentState: 'active',
    addEventListener(_, listener) { listeners.add(listener); return { remove: () => listeners.delete(listener) }; },
  };
  const router = {
    replace: route => routes.push(['replace', route.params.rideId]),
    navigate: route => routes.push(['navigate', route.params.rideId]),
  };
  const store = selector => selector({ activeRide: null });
  store.getState = () => ({ user: { id: 7 } });
  const mocks = {
    '@datxe/shared': { positiveId: value => Number(value) || null },
    '@tanstack/react-query': {
      useQueryClient: () => ({ fetchQuery: ({ queryFn }) => queryFn() }),
      useQuery: ({ queryKey }) => {
        if (queryKey[1] === 'getActiveCustomerRide') return { data: active };
        detailId = queryKey[2];
        return { data: rides.get(detailId) };
      },
    },
    'expo-router': { useRouter: () => router, useGlobalSearchParams: () => params },
    'react-native': { AppState },
    './store': { useSessionStore: store },
    './customerApi': { customerApi: { getCustomerRide: async id => rides.get(id) } },
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; dirty = true; }];
      },
      useRef(initial) {
        const index = refIndex++;
        return refs[index] ??= { current: initial };
      },
      useEffect(effect, deps) {
        const index = effectIndex++;
        const previous = effects[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          effects[index] = { effect, deps };
        }
      },
      useCallback: callback => callback,
    },
  };
  vm.runInNewContext(outputText, { exports, require: id => mocks[id] });
  return {
    rides, routes,
    render() {
      let verify;
      do {
        dirty = false;
        stateIndex = refIndex = effectIndex = 0;
        verify = exports.useRideCompletion(7, true, pathname);
      } while (dirty);
      for (const entry of effects) {
        entry.effect?.();
        entry.effect = null;
      }
      return verify;
    },
    focus(state) { AppState.currentState = state; listeners.forEach(listener => listener(state)); },
    screen(path, rideId) { pathname = path; params = { rideId }; },
    setActive(ride) { active = ride; },
    detail: () => detailId,
  };
}

test('customer opens completion once after active ride disappears, including while on the handover screen', () => {
  const f = fixture();
  const ride = { id: 42, customerId: 7, status: 'VEHICLE_RETURNED' };
  f.setActive(ride);
  f.rides.set(42, ride);
  f.render();
  f.focus('background');
  f.setActive(null);
  f.rides.set(42, { ...ride, status: 'COMPLETED' });
  f.render();
  assert.equal(f.detail(), 42);
  assert.deepEqual(f.routes, []);
  f.screen('/vehicle-inspection', '42');
  f.focus('active');
  f.render();
  f.screen('/home');
  f.render();
  assert.deepEqual(f.routes, [['replace', '42']]);
});

test('completion push is verified against server status and the current customer', async () => {
  const f = fixture();
  const verify = f.render();
  f.rides.set(42, { id: 42, customerId: 8, status: 'COMPLETED' });
  await verify(42, 7);
  f.rides.set(43, { id: 43, customerId: 7, status: 'VEHICLE_RETURNED' });
  await verify(43, 7);
  f.render();
  assert.deepEqual(f.routes, []);
  f.rides.set(43, { id: 43, customerId: 7, status: 'COMPLETED' });
  await verify(43, 7);
  f.render();
  await verify(43, 7);
  f.render();
  assert.deepEqual(f.routes, [['navigate', '43']]);
});
