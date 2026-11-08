const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const exportsObject = {};
const opened = [];
const source = fs.readFileSync(path.join(__dirname, '../apps/driver/src/lib/navigation.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, URLSearchParams, require: () => ({ router: { push: route => opened.push(route) } }) });

test('driver opens an in-app route for the selected pickup or dropoff, only with valid coordinates', () => {
  const pickup = { lat: null, lng: 105.84 };
  const dropoff = { lat: 21.030123456, lng: 105.840567891 };
  const ride = { id: 42, pickup, dropoff };
  exportsObject.openRideDirections(ride, 'pickup');
  exportsObject.openRideDirections(ride, 'dropoff');
  assert.equal(opened.length, 1);
  assert.equal(opened[0].pathname, '/ride/directions');
  assert.equal(opened[0].params.rideId, '42');
  assert.equal(opened[0].params.stop, 'dropoff');
});

test('driver directions request keeps precision and motorcycle profile without a service key', () => {
  const query = exportsObject.directionsQuery({ lat: 21.03, lng: 105.84 }, {
    lat: 21.030123456, lng: 105.840567891,
  }, 'MOTORCYCLE');
  assert.equal(query.get('origin'), '105.84,21.03');
  assert.equal(query.get('destination'), '105.840567891,21.030123456');
  assert.equal(query.get('vehicleType'), 'MOTORCYCLE');
  assert.equal(query.has('api_key'), false);
});
