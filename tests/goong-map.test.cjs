const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const geometry = {};
const source = fs.readFileSync(path.join(__dirname, '../packages/ui/src/maps/geometry.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: geometry });

test('map style uses only the public Goong key and encodes it as one query value', () => {
  assert.equal(geometry.goongStyleUrl(), undefined);
  const style = new URL(geometry.goongStyleUrl('test&key=with spaces'));
  assert.equal(style.origin, 'https://tiles.goong.io');
  assert.equal(style.pathname, '/assets/goong_map_web.json');
  assert.equal(style.searchParams.get('api_key'), 'test&key=with spaces');
  assert.equal([...style.searchParams].length, 1);
});

test('Home viewport centers on the customer and frames roughly 1 km in each direction', () => {
  const viewport = {};
  const file = path.join(__dirname, '../apps/customer/src/components/map/homeMapViewport.ts');
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: viewport });

  const center = { lat: 20.958, lng: 105.803 };
  const { sw, ne } = viewport.homeMapBounds(center);
  assert.ok(ne[1] - center.lat < 1.1 / 110.5);
  assert.ok(ne[1] - center.lat > 0.9 / 110.5);
  assert.ok(Math.abs((ne[0] + sw[0]) / 2 - center.lng) < 0.000001);
  for (const point of [
    { lat: 20.966, lng: 105.803 },
    { lat: 20.950, lng: 105.803 },
    { lat: 20.958, lng: 105.811 },
    { lat: 20.958, lng: 105.795 },
  ]) {
    assert.ok(sw[0] < point.lng && point.lng < ne[0]);
    assert.ok(sw[1] < point.lat && point.lat < ne[1]);
  }
});
