const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function load(name, mocks = {}, clock = Date) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../packages/shared/src/ws', name), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, Date: clock, require: id => mocks[id] ?? require(id) });
  return exports;
}
const util = load('location.ts');
function fix(time, lat = 21.03) { return { location: { lat, lng: 105.84 }, timestamp: new Date(time).toISOString(), accuracy: 12 }; }
test('driver throttle limits fast fixes but maintains a stationary heartbeat', () => {
  const now = Date.now();
  const previous = fix(now - 1000);
  assert.equal(util.shouldPublishLocation(previous, fix(now, 21.04)), false);
  assert.equal(util.shouldPublishLocation(fix(now - 4000), fix(now, 21.04)), true);
  assert.equal(util.shouldPublishLocation(fix(now - 4000), fix(now)), false);
  assert.equal(util.shouldPublishLocation(fix(now - 12000), fix(now)), true);
});
test('invalid accuracy, coordinates and stale samples are rejected', () => {
  const now = Date.now();
  assert.equal(util.validLocationUpdate({ ...fix(now), accuracy: null }), true);
  assert.equal(util.validLocationUpdate({ ...fix(now), accuracy: undefined }), false);
  assert.equal(util.validLocationUpdate({ ...fix(now), accuracy: -1 }), false);
  assert.equal(util.validLocationUpdate(fix(now, 200)), false);
  assert.equal(util.validLocationUpdate(fix(now - 121000)), false);
  assert.equal(util.validLocationUpdate(fix(now + 31000)), false);
});
test('loss timeout is configurable and broker URL retains server context', () => {
  assert.equal(util.locationSignalLost(1000, 0, 32000, 30000), true);
  assert.equal(util.locationSignalLost(1000, 0, 32000, 60000), false);
  assert.equal(util.stompBrokerUrl('https://example.test/api'), 'wss://example.test/ws-location');
});
test('STOMP fans out subscriptions and only retains the latest unexpired offline fix', async () => {
  let instance;
  class FakeClient {
    constructor() { instance = this; this.connected = false; this.sent = []; this.handlers = new Map(); }
    activate() { this.connected = true; this.onConnect(); }
    deactivate() { this.connected = false; }
    subscribe(dest, cb) { this.handlers.set(dest, cb); return { unsubscribe: () => this.handlers.delete(dest) }; }
    publish(value) { this.sent.push(value); }
  }
  const socket = load('index.ts', { '@stomp/stompjs': { Client: FakeClient }, '../firebase/authService': { getFirebaseUser: () => null }, './location': util }).createStompClient('ws://test', 'DRIVER');
  let first = 0, second = 0;
  const removeFirst = socket.subscribe('/user/queue/trip', () => first++);
  socket.subscribe('/user/queue/trip', () => second++);
  socket.publish('/app/location', { sequence: 1 }, 10000);
  socket.publish('/app/location', { sequence: 2 }, 10000);
  socket.connect();
  assert.equal(instance.sent.length, 1);
  assert.equal(JSON.parse(instance.sent[0].body).sequence, 2);
  instance.handlers.get('/user/queue/trip')({}); removeFirst(); instance.handlers.get('/user/queue/trip')({});
  assert.equal(first, 1); assert.equal(second, 2);
  socket.disconnect();
});
