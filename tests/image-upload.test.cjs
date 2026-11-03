const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

for (const app of ['driver', 'customer']) {
  function setup({ missing = false, offline = false, rejected = false } = {}) {
    const calls = [];
    class File extends Blob {
      constructor(uri) { super(['real image bytes'], { type: 'image/png' }); this.uri = uri; this.name = 'picked.png'; this.exists = !missing; }
    }
    class AuthApiError extends Error { constructor(message, code) { super(message); this.code = code; } }
    const exports = {};
    const mocks = {
      '@/lib/api': { request: async () => ({ signature: 'signed', timestamp: 123, apiKey: 'public', cloudName: 'test', folder: 'owned', allowedFormats: ['png'] }) },
      '@datxe/shared': { AuthApiError, translate: text => text },
      'react-native': { Platform: { OS: 'android' } },
      'expo-file-system': { File },
      'expo/fetch': { fetch: async (url, options) => {
        calls.push({ url, options });
        if (offline) throw new TypeError('Network request failed');
        return { ok: !rejected, json: async () => rejected ? { error: { message: 'Invalid signature' } } : { secure_url: 'https://images.test/real.png', public_id: 'owned/real' } };
      } },
    };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(`apps/${app}/src/lib/uploadImage.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => mocks[name], FormData, URLSearchParams, Date });
    return { calls, upload: exports[app === 'driver' ? 'uploadDriverImage' : 'uploadCustomerImage'] };
  }
  test(`${app}: native upload contains actual image bytes and signed fields`, async () => {
    const { calls, upload } = setup();
    await upload({ uri: 'file:///picked.png' }, 'DRIVER_DOCUMENT');
    const form = calls[0].options.body;
    assert.equal(await form.get('file').text(), 'real image bytes');
    assert.equal(form.get('file').name, 'picked.png');
    assert.equal(form.get('file').type, 'image/png');
    assert.equal(form.get('folder'), 'owned');
    assert.equal(form.get('signature'), 'signed');
    assert.equal(form.get('allowed_formats'), 'png');
    assert.equal(calls[0].options.headers, undefined);
  });
  test(`${app}: missing local image does not send upload or report a network error`, async () => {
    const { calls, upload } = setup({ missing: true });
    await assert.rejects(upload({ uri: 'file:///missing.png' }), { code: 'UPLOAD_FILE_MISSING' });
    assert.equal(calls.length, 0);
  });
  test(`${app}: network and server rejection remain distinct`, async () => {
    await assert.rejects(setup({ offline: true }).upload({ uri: 'file:///picked.png' }), { code: 'UPLOAD_NETWORK_ERROR' });
    await assert.rejects(setup({ rejected: true }).upload({ uri: 'file:///picked.png' }), { code: 'UPLOAD_FAILED', message: 'Invalid signature' });
  });
}
