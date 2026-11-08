const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, setTimeout, clearTimeout, require: name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'), mocks);
    throw Error(name);
  } });
  return exports;
}
const contracts = load('packages/shared/src/notifications/contracts.ts');
const { createPushOpenCoordinator } = load('packages/shared/src/notifications/openCoordinator.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));
const offer = { type: 'RIDE_OFFER', messageId: 'event-1', recipientRole: 'DRIVER', recipientId: 7, payload: { rideId: 12, expiresAt: 2000 } };
const wire = event => ({ payload: JSON.stringify(event), recipientRole: 'DRIVER', recipientId: '7' });

test('push parser accepts server envelopes and rejects malformed IDs/roles/payloads', () => {
  const parsed = contracts.parsePushData(wire(offer));
  assert.equal(parsed.type, 'RIDE_OFFER');
  assert.equal(parsed.recipientId, 7);
  for (const data of [null, { payload: '{}' }, { payload: '{' }, { payload: 'null' }, { ...wire(offer), recipientRole: 'ADMIN' }, { ...wire(offer), recipientId: '-1' }]) assert.equal(contracts.parsePushData(data), null);
  assert.equal(contracts.isPushForAccount(parsed, 'DRIVER', 7), true);
  assert.equal(contracts.isPushForAccount(parsed, 'CUSTOMER', 7), false);
  assert.equal(contracts.isPushForAccount(parsed, 'DRIVER', 8), false);
});

test('expired offers/read events are silent, lock screen text excludes private payload', () => {
  assert.equal(contracts.pushPresentation(offer, 2000), null);
  assert.equal(contracts.pushPresentation({ ...offer, payload: {} }, 1000), null);
  assert.equal(contracts.pushPresentation({ type: 'CHAT_READ' }), null);
  assert.equal(contracts.pushPresentation(offer, 1000).channelId, contracts.OFFER_CHANNEL);
  assert.ok(!JSON.stringify(contracts.pushPresentation({ type: 'CHAT_MESSAGE', payload: { content: 'private address' } })).includes('private address'));
});

test('offer-close pushes route home and assigned push exposes plate and ETA', async () => {
  for (const type of ['OFFER_EXPIRED', 'OFFER_CANCELLED']) {
    const target = await contracts.resolvePushDestination({ type, payload: { rideId: 12 } }, 'DRIVER', {
      ride: async () => { throw new Error('must not fetch a ride'); },
    });
    assert.equal(target.pathname, '/(tabs)/home');
    assert.ok(target.notice);
  }
  assert.equal(contracts.pushPresentation({ type: 'OFFER_EXPIRED', payload: { rideId: 12 } }).title, 'Lời mời nhận chuyến đã hết hạn');
  assert.equal(contracts.pushPresentation({ type: 'OFFER_CANCELLED', payload: { rideId: 12 } }).title, 'Lời mời nhận chuyến đã hủy');
  const assigned = contracts.pushPresentation({ type: 'RIDE_ASSIGNED', payload: { rideId: 5, licensePlate: 'ABC-123', etaToPickupMin: 4 } });
  assert.equal(assigned.title, 'Đã có tài xế nhận chuyến');
  assert.ok(assigned.body.includes('ABC-123'));
  assert.ok(assigned.body.includes('4 phút'));
  const noDetails = contracts.pushPresentation({ type: 'RIDE_ASSIGNED', payload: { rideId: 5 } });
  assert.ok(!noDetails.body.includes('undefined'));
});

test('offer opens only the matching live server offer; does not open a different newer offer', async () => {
  const live = await contracts.resolvePushDestination(offer, 'DRIVER', { pendingOffer: async () => ({ rideId: 12, expiresAt: 3000 }) }, () => 1000);
  assert.equal(live.pathname, '/ride/accept');
  assert.equal(live.params.rideId, '12');
  for (const pending of [null, { rideId: 99, expiresAt: 3000 }, { rideId: 12, expiresAt: 500 }]) {
    const target = await contracts.resolvePushDestination(offer, 'DRIVER', { pendingOffer: async () => pending, activeRide: async () => null }, () => 1000);
    assert.equal(target.pathname, '/(tabs)/home');
    assert.ok(target.notice);
  }
  assert.equal(contracts.pushPresentation({ type: 'OFFER_EXPIRED', payload: { rideId: 12 } }).title, 'Lời mời nhận chuyến đã hết hạn');
  assert.equal(contracts.pushPresentation({ type: 'OFFER_CANCELLED', payload: { rideId: 12 } }).title, 'Lời mời nhận chuyến đã hủy');
});

test('offer accepted on another device goes to its active ride; payload status and URLs are ignored', async () => {
  const target = await contracts.resolvePushDestination(offer, 'DRIVER', { pendingOffer: async () => null, activeRide: async () => ({ id: 12, status: 'IN_PROGRESS' }) });
  assert.equal(target.pathname, '/ride/in-progress');
  let fetched;
  const completed = await contracts.resolvePushDestination({ type: 'RIDE_UPDATED', payload: { rideId: '12', status: 'SEARCHING', url: 'https://evil.test' } }, 'CUSTOMER', {
    ride: async id => { fetched = id; return { id, status: 'COMPLETED' }; },
  });
  assert.equal(fetched, 12);
  assert.equal(completed.pathname, '/ride/completed');
});

test('chat, review, cancelled and searching notifications use known routes', async () => {
  const api = { ride: async id => ({ id, status: 'CANCELLED' }) };
  assert.equal((await contracts.resolvePushDestination({ type: 'CHAT_MESSAGE', payload: { rideId: 3 } }, 'DRIVER', api)).pathname, '/chat');
  assert.equal((await contracts.resolvePushDestination({ type: 'RIDE_CANCELLED', payload: { rideId: 3 } }, 'CUSTOMER', api)).pathname, '/ride/[id]');
  assert.equal((await contracts.resolvePushDestination({ type: 'DRIVER_DOCUMENT_REVIEWED' }, 'DRIVER', api)).pathname, '/(auth)/approval-status');
  assert.equal((await contracts.resolvePushDestination({ type: 'RIDE_UPDATED', payload: { rideId: -1 } }, 'DRIVER', api)).pathname, '/(tabs)/notifications');
  assert.equal((await contracts.resolvePushDestination({ type: 'RIDE_UPDATED', payload: { rideId: 3 } }, 'CUSTOMER', { ride: async id => ({ id, status: 'SEARCHING' }) })).pathname, '/ride/find-driver');
});

test('cold-start tap waits for both restored account and mounted non-auth router', async () => {
  let session = null, ready = false, resolved = 0, navigated = 0, ack = 0;
  const coordinator = createPushOpenCoordinator({ session: () => session, ready: () => ready,
    resolve: async () => { resolved++; return { pathname: '/ride/accept' }; },
    navigate: () => navigated++, acknowledge: async () => { ack++; }, error: assert.fail });
  coordinator.enqueue(offer);
  await tick();
  assert.equal(resolved, 0);
  session = { id: 7, role: 'DRIVER' };
  await coordinator.drain();
  assert.equal(resolved, 0);
  ready = true;
  await coordinator.drain();
  assert.equal(navigated, 1);
  assert.equal(ack, 1);
  coordinator.enqueue({ ...offer });
  await tick();
  assert.equal(navigated, 1, 'FCM/Expo/STOMP duplicate must not navigate twice');
});

test('wrong-account notification is discarded without loading any trip', async () => {
  let acknowledged = false;
  const coordinator = createPushOpenCoordinator({ session: () => ({ id: 99, role: 'DRIVER' }), ready: () => true,
    resolve: assert.fail, navigate: assert.fail, acknowledge: async () => { acknowledged = true; }, error: assert.fail });
  coordinator.enqueue(offer);
  await tick();
  assert.equal(acknowledged, true);
});

test('network failure keeps the pending tap for retry rather than consuming it', async () => {
  let attempts = 0, navigated = 0, retry;
  const coordinator = createPushOpenCoordinator({ session: () => ({ id: 7, role: 'DRIVER' }), ready: () => true,
    resolve: async () => { if (++attempts === 1) throw Error('offline'); return { pathname: '/ride/accept' }; },
    navigate: () => navigated++, acknowledge: async () => {}, error: (_error, action) => { retry = action; } });
  coordinator.enqueue(offer);
  await tick();
  assert.equal(navigated, 0);
  retry();
  await tick();
  assert.equal(navigated, 1);
});

test('sign out during server validation cancels navigation even if the request later succeeds', async () => {
  let release, navigated = 0;
  const coordinator = createPushOpenCoordinator({ session: () => ({ id: 7, role: 'DRIVER' }), ready: () => true,
    resolve: () => new Promise(resolve => { release = resolve; }), navigate: () => navigated++, acknowledge: async () => {}, error: assert.fail });
  coordinator.enqueue(offer);
  coordinator.clear();
  release({ pathname: '/ride/accept' });
  await tick();
  assert.equal(navigated, 0);
});

test('background handler is installed before Router and only data-only messages get local presentation', async () => {
  let background;
  const displayed = [];
  const api = load('packages/shared/src/notifications/push.ts', {
    '@react-native-async-storage/async-storage': { default: {} },
    '@react-native-firebase/messaging': { getMessaging: () => ({}), setBackgroundMessageHandler: (_messaging, handler) => { background = handler; } },
    'react-native': { Platform: { OS: 'android' }, PermissionsAndroid: {} },
    './presentation': { presentPushNotification: async event => displayed.push(event) },
  });
  api.registerPushBackgroundHandler('DRIVER');
  await background({ data: wire({ ...offer, payload: { rideId: 12, expiresAt: Date.now() + 15000 } }) });
  await background({ data: wire(offer), notification: { title: 'OS handles this' } });
  await background({ data: { ...wire(offer), recipientRole: 'CUSTOMER' } });
  assert.equal(displayed.length, 1);
  for (const app of ['customer', 'driver']) {
    const entry = fs.readFileSync(`apps/${app}/index.js`, 'utf8');
    assert.ok(entry.indexOf('registerPushBackgroundHandler(') < entry.indexOf("require('expo-router/entry')"));
    assert.equal(JSON.parse(fs.readFileSync(`apps/${app}/package.json`)).main, 'index.js');
  }
});

function presentationFixture(platform = 'android') {
  const storage = new Map();
  const scheduled = [], channels = [];
  let responseListener, handler;
  const native = {
    AndroidImportance: { HIGH: 4, MAX: 5 }, AndroidNotificationVisibility: { PRIVATE: 0 }, AndroidNotificationPriority: { HIGH: 'high' },
    DEFAULT_ACTION_IDENTIFIER: 'tap',
    setNotificationHandler: value => { handler = value; },
    setNotificationChannelAsync: async (id, options) => channels.push({ id, options }),
    scheduleNotificationAsync: async request => { scheduled.push(request); return request.identifier; },
    addNotificationResponseReceivedListener: listener => { responseListener = listener; return { remove() {} }; },
    getLastNotificationResponseAsync: async () => null,
  };
  const api = load('packages/shared/src/notifications/presentation.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => { storage.set(key, value); }, removeItem: async key => storage.delete(key) } },
    'react-native': { Platform: { OS: platform } }, 'expo-notifications': native,
  });
  return { api, native, storage, scheduled, channels, getHandler: () => handler, respond: response => responseListener(response) };
}

test('Android uses system sound without a custom asset and deduplicates a foreground local banner', async () => {
  const f = presentationFixture();
  const current = { ...offer, payload: { rideId: 12, expiresAt: Date.now() + 15000 } };
  await Promise.all([f.api.presentPushNotification(current), f.api.presentPushNotification(current)]);
  assert.equal(f.channels.length, 2);
  for (const channel of f.channels) {
    // Expo treats every channel sound string (including "default") as a custom filename.
    // Explicit null silences the channel; omission selects the system notification sound.
    assert.equal(Object.hasOwn(channel.options, 'sound'), false);
  }
  assert.ok(f.channels.find(c => c.id === contracts.OFFER_CHANNEL).options.vibrationPattern.length > 0);
  assert.equal(f.scheduled.length, 1);
  assert.equal(f.scheduled[0].trigger.channelId, contracts.OFFER_CHANNEL);
  assert.equal((await f.getHandler().handleNotification({ request: { identifier: 'remote-fcm-id' } })).shouldShowBanner, false);
  assert.equal((await f.getHandler().handleNotification({ request: { identifier: f.scheduled[0].identifier } })).shouldShowBanner, true);
});

test('iOS local fallback schedules an immediate notification without Android channel APIs', async () => {
  const f = presentationFixture('ios');
  await f.api.presentPushNotification({ type: 'CHAT_MESSAGE', messageId: 'chat-1' });
  assert.equal(f.channels.length, 0);
  assert.equal(f.scheduled[0].trigger, null);
  assert.equal(f.scheduled[0].content.sound, 'default');
});

test('taps survive session restoration and an acknowledged tap is not replayed', async () => {
  const f = presentationFixture();
  const opened = [];
  await f.api.rememberPushOpen(offer, event => opened.push(event));
  await f.api.subscribeToLocalPushOpens(event => opened.push(event));
  assert.equal(opened.length, 2, 'persisted tap is available after mount');
  await f.api.acknowledgePushOpen(offer);
  await f.api.rememberPushOpen(offer, event => opened.push(event));
  assert.equal(opened.length, 2);
  f.respond({ actionIdentifier: 'dismiss', notification: { request: { content: { data: wire(offer) } } } });
  assert.equal(opened.length, 2, 'dismissing a notification must never open it');
});

test('notification plugin generates Android channel metadata and iOS APNs/background capability for both apps', async () => {
  const { withPlugins, compileModsAsync } = require('expo/config-plugins');
  for (const app of ['customer', 'driver']) {
    const projectRoot = path.resolve('apps', app);
    const base = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'))).expo;
    const config = require(path.join(projectRoot, 'app.config.js'))({ config: base });
    const plugins = config.plugins.filter(plugin => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
    assert.equal(plugins.length, 1);
    const result = await compileModsAsync(withPlugins({ ...base, plugins: [], _internal: { projectRoot } }, plugins), { projectRoot, platforms: ['ios', 'android'], introspect: true });
    const mods = result._internal.modResults;
    assert.ok(mods.ios.entitlements['aps-environment']);
    assert.ok(mods.ios.infoPlist.UIBackgroundModes.includes('remote-notification'));
    assert.ok(JSON.stringify(mods.android.manifest).includes(contracts.PUSH_CHANNEL));
    const firebase = JSON.parse(fs.readFileSync(path.join(projectRoot, 'firebase.json')))['react-native'];
    assert.equal(firebase.messaging_android_notification_delegation_enabled, false);
    assert.equal(firebase.messaging_android_notification_channel_id, contracts.PUSH_CHANNEL);
    assert.deepEqual(firebase.messaging_ios_foreground_presentation_options, []);
  }
});

test('driver trip notifications never open a different active trip', async () => {
  const notification = { type: 'RIDE_UPDATED', payload: { rideId: 3 } };
  const ride = async id => ({ id, status: 'DRIVER_ASSIGNED' });
  const historical = await contracts.resolvePushDestination(notification, 'DRIVER', {
    ride,
    activeRide: async () => ({ id: 4, status: 'DRIVER_ASSIGNED' }),
  });
  assert.equal(historical.pathname, '/ride/complete');
  assert.equal(historical.params.rideId, '3');

  const current = await contracts.resolvePushDestination(notification, 'DRIVER', {
    ride,
    activeRide: () => ride(3),
  });
  assert.equal(current.pathname, '/ride/in-progress');
});
