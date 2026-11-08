const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const exportsObject = {};
const source = fs.readFileSync(path.join(__dirname, '../apps/customer/src/lib/initializeMapbox.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const { initializeMapbox } = exportsObject;

test('missing, secret and malformed tokens never call the native SDK', async () => {
  const sdk = { setAccessToken: () => assert.fail('native token setter called'), setTelemetryEnabled: () => assert.fail('native telemetry called') };
  for (const token of [undefined, '', '  ', 'sk.secret.token', 'pk.', 'placeholder']) {
    assert.equal(await initializeMapbox(sdk, token), false);
  }
});

test('telemetry waits until native access-token assignment has completed', async () => {
  let releaseToken;
  const calls = [];
  const pending = new Promise(resolve => { releaseToken = resolve; });
  const initializing = initializeMapbox({
    setAccessToken: token => { calls.push(['token', token]); return pending; },
    setTelemetryEnabled: value => calls.push(['telemetry', value]),
  }, '  pk.test.signature  ');
  assert.deepEqual(calls, [['token', 'pk.test.signature']]);
  releaseToken();
  assert.equal(await initializing, true);
  assert.deepEqual(calls, [['token', 'pk.test.signature'], ['telemetry', false]]);
});

test('failed native token assignment never creates the telemetry MapView', async () => {
  let telemetryCalled = false;
  await assert.rejects(initializeMapbox({
    setAccessToken: async () => { throw new Error('native token assignment failed'); },
    setTelemetryEnabled: () => { telemetryCalled = true; },
  }, 'pk.test.signature'), /native token assignment failed/);
  assert.equal(telemetryCalled, false);
});

test('Home viewport covers the 5 km nearby search radius and rounded GPS markers', () => {
  const viewport = {};
  const file = path.join(__dirname, '../apps/customer/src/components/map/homeMapViewport.ts');
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: viewport });

  const center = { lat: 20.958, lng: 105.803 };
  const { sw, ne } = viewport.homeMapBounds(center);
  for (const point of [
    { lat: 21.0035, lng: 105.803 },
    { lat: 20.9125, lng: 105.803 },
    { lat: 20.958, lng: 105.8515 },
    { lat: 20.958, lng: 105.7545 },
  ]) {
    assert.ok(sw[0] < point.lng && point.lng < ne[0]);
    assert.ok(sw[1] < point.lat && point.lat < ne[1]);
  }
});
