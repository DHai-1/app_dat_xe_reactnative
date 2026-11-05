const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const i18n = require('./i18n-loader.cjs');

function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { if (name in mocks) return mocks[name]; throw Error(name); } });
  return exports;
}
const helpers = load('apps/customer/src/features/tracking/driverProfile.ts');
const driver = { id: 7, fullName: 'Nguyễn Văn An', phoneNumber: '+84 912 345 678', avatarUrl: 'https://images.test/driver.jpg', averageRating: 4.7, yearsOfExperience: 8, licenseClass: 'B2', licenseVerified: true, profileVerified: true };

test('tracking uses only the assigned driver profile and tolerates an older server without it', () => {
  assert.equal(helpers.assignedDriver({ driverId: 7, driver }), driver);
  assert.equal(helpers.assignedDriver({ driverId: 8, driver }), null);
  assert.equal(helpers.assignedDriver({ driverId: null, driver }), null);
  assert.equal(helpers.assignedDriver({ driverId: 7 }), null);
});

test('dialer URL retains the actual local/international number and rejects schemes, USSD and extensions', () => {
  assert.equal(helpers.driverPhoneUrl('+84 (912) 345-678'), 'tel:+84912345678');
  assert.equal(helpers.driverPhoneUrl('0912.345.678'), 'tel:0912345678');
  for (const phone of [null, '', 'tel:0912345678', 'javascript:alert(1)', '*101#', '0912345678;123', '0912345678?x=1', '++84912345678', '123', '9'.repeat(16)]) assert.equal(helpers.driverPhoneUrl(phone), null, phone);
});

test('missing rating/experience never becomes five stars or fabricated years; zero years is valid', () => {
  for (const rating of [undefined, null, 0, -1, 6, NaN, Infinity]) assert.equal(helpers.driverRating(rating), null);
  assert.equal(helpers.driverRating(4.7), 4.7);
  for (const years of [undefined, null, -1, 1.5, Infinity]) assert.equal(helpers.driverExperience(years), null);
  assert.equal(helpers.driverExperience(0), 0);
  assert.equal(helpers.driverExperience(8), 8);
  assert.equal(helpers.driverInitials(' Nguyễn Văn An '), 'VA');
  assert.equal(helpers.driverInitials(null), '');
});

function fixture(props = {}, failPhone = false) {
  const state = [], refs = [], calls = [], alerts = [];
  let stateIndex = 0, refIndex = 0, messages = 0;
  const jsx = (type, props) => ({ type, props });
  const { DriverProfileCard } = load('apps/customer/src/features/tracking/components/DriverProfileCard.tsx', {
    '../driverProfile': helpers,
    react: {
      useState: initial => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
      useRef: initial => { const index = refIndex++; refs[index] ??= { current: initial }; return refs[index]; },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    '@datxe/shared': { ...i18n, getLocale: () => 'vi-VN' },
    '@datxe/ui': {
      Button: 'Button', Card: 'Card', MotionPressable: 'Pressable', ScreenWrapper: 'Screen', Typography: 'Text',
      useLanguage: () => {}, useThemeColors: () => ({}), useThemedStyles: factory => factory({}),
      localizedAlert: (...args) => alerts.push(args),
    },
    '@expo/vector-icons': { MaterialIcons: 'Icon' },
    'react-native': { Image: 'Image', Modal: 'Modal', View: 'View', ScrollView: 'Scroll',
      StyleSheet: { create: styles => styles, absoluteFill: {} },
      Linking: { openURL: async url => { calls.push(url); if (failPhone) throw Error('no dialer'); } },
    },
  });
  const render = () => {
    stateIndex = 0; refIndex = 0;
    return DriverProfileCard({ driver, contactEnabled: true, unreadCount: 2, onMessage: () => messages++, ...props });
  };
  return { render, calls, alerts, getMessages: () => messages };
}
function all(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(all);
  return [node, ...all(node.props?.children)];
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('card opens a dismissible detail modal with real identity, rating and experience', () => {
  const f = fixture();
  let tree = f.render();
  assert.equal(all(tree).find(node => node.type === 'Modal').props.visible, false);
  all(tree).find(node => node.type === 'Card').props.onPress();
  tree = f.render();
  const modal = all(tree).find(node => node.type === 'Modal');
  assert.equal(modal.props.visible, true);
  const texts = all(tree).filter(node => node.type === 'Text').map(node => node.props.children);
  assert.ok(texts.includes(driver.fullName));
  assert.ok(texts.includes('4,7/5'));
  assert.ok(texts.includes('8 năm kinh nghiệm'));
  assert.ok(texts.includes(driver.phoneNumber));
  modal.props.onRequestClose();
  assert.equal(all(f.render()).find(node => node.type === 'Modal').props.visible, false);
});

test('call hands only a sanitized tel URL to the OS and chat closes the modal before opening conversation', async () => {
  const f = fixture();
  all(f.render()).find(node => node.type === 'Card').props.onPress();
  const buttons = all(f.render()).filter(node => node.type === 'Button');
  buttons.find(node => node.props.label === 'Gọi điện').props.onPress();
  await tick();
  assert.equal(f.calls[0], 'tel:+84912345678');
  buttons.find(node => node.props.label === 'Nhắn tin · 2 chưa đọc').props.onPress();
  assert.equal(f.getMessages(), 1);
  assert.equal(all(f.render()).find(node => node.type === 'Modal').props.visible, false);
});

test('closed trip or missing phone disables contact safely; missing fields display honest placeholders', async () => {
  const f = fixture({ contactEnabled: false });
  for (const button of all(f.render()).filter(node => node.type === 'Button')) {
    assert.equal(button.props.disabled, true);
    button.props.onPress();
  }
  await tick();
  assert.equal(f.calls.length, 0);
  assert.equal(f.getMessages(), 0);
  const missing = fixture({ driver: { ...driver, fullName: null, phoneNumber: null, avatarUrl: null, averageRating: null, yearsOfExperience: null } });
  const nodes = all(missing.render());
  assert.equal(nodes.find(node => node.type === 'Button' && node.props.label === 'Gọi điện').props.disabled, true);
  const texts = nodes.filter(node => node.type === 'Text').map(node => node.props.children);
  assert.ok(texts.includes('Chưa có đánh giá'));
  assert.ok(texts.includes('Chưa cập nhật kinh nghiệm'));
});

test('phone handler failure is explained without starting another call', async () => {
  const f = fixture({}, true);
  all(f.render()).find(node => node.type === 'Button' && node.props.label === 'Gọi điện').props.onPress();
  await tick();
  assert.equal(f.calls.length, 1);
  assert.equal(f.alerts[0][0], 'Chưa mở được ứng dụng điện thoại');
});
