const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, URLSearchParams, require: name => {
    if (name in mocks) return mocks[name];
    throw Error(name);
  } });
  return exports;
}
const availability = load('apps/driver/src/lib/chatAvailability.ts');
const { createChatSession } = load('apps/driver/src/features/chat/session.ts', { '@/lib/chatAvailability': availability });
const ride = { id: 12, driverId: 7, status: 'DRIVER_ASSIGNED' };
const message = (id, senderRole = 'CUSTOMER', extra = {}) => ({
  id, senderRole, clientMessageId: null, content: `Tin ${id}`, messageType: 'TEXT',
  attachmentUrl: null, createdAt: '2026-11-05T01:00:00Z', readAt: null, ...extra,
});
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(overrides = {}) {
  return createChatSession({ ride: async () => ride, messages: async () => ({ messages: [], hasMore: false }),
    send: async body => message(100, 'DRIVER', body), upload: async () => ({ secureUrl: 'https://images.test/chat.jpg', publicId: 'owned/chat' }),
    read: async () => {}, onRead: () => {}, ...overrides });
}

test('chat photo pinch caps zoom, drag stays within the image and double tap resets', () => {
  const element = (type, props) => ({ type, props });
  const states = [{ width: 300, height: 400 }, { width: 600, height: 400 }, false, 0];
  const gestures = {};
  let transform;
  const { ChatImageViewer } = load('packages/ui/src/chat/ChatImageViewer.tsx', {
    'react/jsx-runtime': { jsx: element, jsxs: element },
    '@datxe/shared': { translate: (text) => text },
    react: { useState: () => [states.shift(), () => {}] },
    'react-native': { StyleSheet: { create: (styles) => styles } },
    'react-native-gesture-handler': {
      usePinchGesture: (config) => { gestures.pinch = config; },
      usePanGesture: (config) => { gestures.pan = config; },
      useTapGesture: (config) => { gestures.tap = config; },
      useSimultaneousGestures() {},
    },
    'react-native-reanimated': {
      default: { View: 'Animated.View' },
      useAnimatedStyle: (callback) => { transform = () => callback().transform; },
      useSharedValue: (initial) => {
        let value = initial;
        return { get: () => value, set: (next) => { value = next; } };
      },
      withTiming: (target) => target,
    },
    'react-native-paper': {},
    '../components/Button': {},
    '../components/ScreenWrapper': {},
    '../components/Typography': {},
    '../theme/ThemeProvider': { useThemeColors: () => ({}) },
    '../useLanguage': { useLanguage() {} },
  });
  const canvas = ChatImageViewer({ uri: 'file://photo.jpg', onClose() {} }).props.children.props.children;
  canvas.type(canvas.props);
  const center = { focalX: 150, focalY: 200 };
  gestures.pinch.onActivate(center);
  gestures.pinch.onUpdate({ ...center, scale: 8 });
  gestures.pinch.onFinalize();
  gestures.pan.onActivate({ translationX: 0, translationY: 0 });
  gestures.pan.onUpdate({ translationX: 3000, translationY: -3000, numberOfPointers: 1 });
  assert.equal(JSON.stringify(transform()), '[{"translateX":600},{"translateY":-300},{"scale":5}]');
  gestures.tap.onActivate({ x: 150, y: 200 });
  assert.equal(JSON.stringify(transform()), '[{"translateX":0},{"translateY":0},{"scale":1}]');
});

test('chat API uses driver ride, chat cursors/read/send and signed CHAT image scope', async () => {
  const calls = [];
  const api = load('apps/driver/src/features/chat/api.ts', {
    '@/lib/api': { request: async (path, options) => { calls.push({ path, options }); return {}; } },
    '@/lib/driverApi': { driverApi: { ride: async id => ({ id }) } },
    '@/lib/uploadImage': { uploadDriverImage: async (file, purpose, rideId) => { calls.push({ file, purpose, rideId }); return {}; } },
  });
  assert.equal((await api.getChatRide(12)).id, 12);
  await api.getChatMessages(12, { beforeId: 40, size: 30 });
  await api.getChatMessages(12, { afterId: 80, size: 100 });
  await api.markChatRead(12, 90);
  await api.sendChatMessage(12, { clientMessageId: 'same-id', content: 'Đã tới' });
  await api.uploadChatImage(12, { uri: 'file://photo.jpg' });
  assert.equal(calls[0].path, '/chat/rides/12/messages?beforeId=40&size=30');
  assert.equal(calls[1].path, '/chat/rides/12/messages?afterId=80&size=100');
  assert.equal(calls[2].options.method, 'PUT');
  assert.equal(calls[2].options.body.upToMessageId, 90);
  assert.equal(calls[3].options.method, 'POST');
  assert.equal(calls[3].options.body.clientMessageId, 'same-id');
  assert.equal(calls[4].purpose, 'CHAT');
  assert.equal(calls[4].rideId, 12);
});

test('chat is writable only after assignment and before terminal status', () => {
  for (const status of ['PENDING', 'SEARCHING', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED']) {
    assert.equal(availability.canDriverChat({ driverId: 7, status }), false);
  }
  for (const status of ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'VEHICLE_HANDOVER', 'IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED']) {
    assert.equal(availability.canDriverChat({ driverId: 7, status }), true);
  }
  assert.equal(availability.canDriverChat({ driverId: null, status: 'DRIVER_ASSIGNED' }), false);
});

test('failed text remains visible and retry retains UUID even when response was lost', async () => {
  const bodies = [];
  const session = fixture({ send: async body => {
    bodies.push(body);
    if (bodies.length === 1) throw Error('Mất mạng');
    return message(100, 'DRIVER', body);
  } });
  await session.refresh();
  assert.equal(session.send('  Tôi đã tới  '), true);
  assert.equal(session.getSnapshot().outgoing[0].status, 'sending');
  await tick();
  const pending = session.getSnapshot().outgoing[0];
  assert.equal(pending.status, 'failed');
  assert.equal(pending.body.content, 'Tôi đã tới');
  await session.retry(pending.key);
  assert.equal(bodies[0].clientMessageId, bodies[1].clientMessageId);
  assert.match(bodies[0].clientMessageId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(session.getSnapshot().outgoing.length, 0);
  assert.equal(session.getSnapshot().messages.length, 1);
});

test('image send retry reuses uploaded owned asset and does not upload twice', async () => {
  let uploads = 0, sends = 0;
  const session = fixture({
    upload: async () => { uploads++; return { secureUrl: 'https://images.test/real.jpg', publicId: 'owned/real' }; },
    send: async body => { if (++sends === 1) throw Error('response lost'); return message(20, 'DRIVER', body); },
  });
  await session.refresh();
  session.send('Ảnh điểm đón', { uri: 'file://real.jpg' });
  await tick();
  const pending = session.getSnapshot().outgoing[0];
  assert.equal(pending.status, 'failed');
  assert.equal(pending.body.attachmentPublicId, 'owned/real');
  await session.retry(pending.key);
  assert.equal(uploads, 1);
  assert.equal(session.getSnapshot().messages[0].attachmentUrl, 'https://images.test/real.jpg');
});

test('upload failure keeps the selected image for retry; closed ride never uploads/sends', async () => {
  let uploads = 0, status = 'DRIVER_ASSIGNED', sends = 0;
  const session = fixture({ ride: async () => ({ ...ride, status }),
    upload: async () => { uploads++; throw Error('Upload lỗi'); },
    send: async () => { sends++; return message(100); } });
  await session.refresh();
  session.send('', { uri: 'file://selected.jpg' });
  await tick();
  const pending = session.getSnapshot().outgoing[0];
  assert.equal(pending.file.uri, 'file://selected.jpg');
  status = 'COMPLETED';
  await session.retry(pending.key);
  assert.equal(uploads, 1);
  assert.equal(sends, 0);
  assert.equal(session.send('Tin mới'), false);
});

test('paging catches up every afterId page, merges IDs and preserves older pagination', async () => {
  let initialized = false;
  const session = fixture({ messages: async options => {
    if (options.beforeId) return { messages: [message(1)], hasMore: false };
    if (options.afterId === 2) return { messages: [message(3)], hasMore: true };
    if (options.afterId === 3) return { messages: [message(4)], hasMore: false };
    if (initialized) return { messages: [message(4), message(3), message(2)], hasMore: true };
    initialized = true;
    return { messages: [message(2)], hasMore: true };
  } });
  await session.refresh();
  await session.refresh();
  assert.equal(JSON.stringify(session.getSnapshot().messages.map(m => m.id)), '[2,3,4]');
  assert.equal(session.getSnapshot().hasMore, true);
  await session.loadOlder();
  assert.equal(JSON.stringify(session.getSnapshot().messages.map(m => m.id)), '[1,2,3,4]');
  assert.equal(session.getSnapshot().hasMore, false);
});

test('unread is marked only while visible, retries read failures and refreshes badge on success', async () => {
  let reads = 0, badges = 0;
  const session = fixture({ messages: async () => ({ messages: [message(5), message(6, 'DRIVER')], hasMore: false }),
    read: async id => { assert.equal(id, 5); if (++reads === 1) throw Error('offline'); }, onRead: () => { badges++; } });
  await session.refresh();
  assert.equal(reads, 0);
  session.setVisible(true);
  await session.refresh();
  assert.equal(badges, 0);
  await session.refresh();
  assert.equal(badges, 1);
  await session.refresh();
  assert.equal(reads, 2);
  session.receivedReadReceipt(6);
  assert.ok(session.getSnapshot().messages.find(m => m.id === 6).readAt);
  assert.equal(session.getSnapshot().messages.find(m => m.id === 5).readAt, null);
  await session.refresh();
  assert.ok(session.getSnapshot().messages.find(m => m.id === 6).readAt, 'a stale poll cannot erase a realtime read receipt');
});

test('poll recovers a sent message with a lost response without duplicate pending bubble', async () => {
  let sent;
  const session = fixture({ messages: async () => ({ messages: sent ? [sent] : [], hasMore: false }),
    send: async body => { sent = message(10, 'DRIVER', body); throw Error('response lost'); } });
  await session.refresh();
  session.send('Xin chào');
  await tick();
  assert.equal(session.getSnapshot().outgoing.length, 1);
  await session.refresh();
  assert.equal(session.getSnapshot().outgoing.length, 0);
  assert.equal(session.getSnapshot().messages.length, 1);
});

test('a send response cannot advance the polling cursor past unseen incoming messages', async () => {
  let initial = true;
  const cursors = [];
  const session = fixture({ messages: async options => {
    if (initial) { initial = false; return { messages: [message(1)], hasMore: false }; }
    if (options.afterId) { cursors.push(options.afterId); return { messages: [message(2), message(100, 'DRIVER')], hasMore: false }; }
    return { messages: [message(100, 'DRIVER')], hasMore: false };
  } });
  await session.refresh();
  session.send('Tôi đã tới');
  await tick();
  await session.refresh();
  assert.equal(cursors[0], 1);
  assert.ok(session.getSnapshot().messages.some(m => m.id === 2));
});

test('an initially empty conversation enables older paging if a burst exceeds the latest page', async () => {
  let first = true;
  const session = fixture({ messages: async () => {
    if (first) { first = false; return { messages: [], hasMore: false }; }
    return { messages: [message(50), message(49)], hasMore: true };
  } });
  await session.refresh();
  await session.refresh();
  assert.equal(session.getSnapshot().hasMore, true);
});
