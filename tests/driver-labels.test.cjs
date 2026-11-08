const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (name in mocks) return mocks[name];
    throw Error(name);
  } });
  return exports;
}
const labels = load('apps/driver/src/lib/displayLabels.ts');

test('every ride status in the shared API contract has a Vietnamese badge label', () => {
  const source = fs.readFileSync('packages/shared/src/types/index.ts', 'utf8');
  const contract = source.match(/export type RideStatus =([\s\S]*?);/)[1];
  const codes = [...contract.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.equal(codes.length, 14);
  for (const code of codes) {
    const status = labels.statusLabel('ride', code);
    assert.notEqual(status.label, code);
    assert.notEqual(status.label, 'Chưa xác định trạng thái');
    assert.ok(['neutral', 'pending', 'active', 'success', 'danger'].includes(status.tone));
  }
  assert.equal(labels.statusLabel('ride', 'VEHICLE_HANDOVER').label, 'Đang bàn giao xe');
  assert.equal(labels.statusLabel('ride', 'VEHICLE_RETURNED').label, 'Đang hoàn trả xe');
  assert.equal(labels.statusLabel('ride', 'COMPLETED').tone, 'success');
  assert.equal(labels.statusLabel('ride', 'CANCELLED').tone, 'danger');
});

test('review, availability and payment use their own meanings and never guess an unknown status', () => {
  assert.equal(labels.statusLabel('availability', 'OFFLINE').label, 'Tạm ngừng nhận chuyến');
  assert.equal(labels.statusLabel('availability', 'BUSY').label, 'Đang thực hiện chuyến');
  assert.equal(labels.statusLabel('payment', 'PENDING').label, 'Chờ thanh toán');
  assert.equal(labels.statusLabel('documentReview', 'PENDING').label, 'Chờ xét duyệt');
  assert.equal(labels.statusLabel('documentReview', 'REJECTED').label, 'Không được duyệt');
  assert.equal(labels.statusLabel('approval', 'REJECTED').label, 'Cần bổ sung hồ sơ');
  for (const kind of ['ride', 'availability', 'approval', 'documentReview', 'payment']) {
    for (const unknown of ['FUTURE_SERVER_CODE', '__proto__', 'constructor']) {
      const status = labels.statusLabel(kind, unknown);
      assert.equal(status.label, 'Chưa xác định trạng thái');
      assert.equal(status.tone, 'neutral');
    }
    assert.equal(labels.statusLabel(kind, null).tone, 'neutral');
  }
});

test('document, vehicle, gearbox, notification and wallet codes have readable labels and safe fallbacks', () => {
  assert.equal(labels.documentTypeLabel('CCCD_BACK'), 'Mặt sau căn cước công dân');
  assert.equal(labels.documentTypeLabel('DRIVER_LICENSE'), 'Mặt trước giấy phép lái xe');
  assert.equal(labels.vehicleTypeLabel('MOTORCYCLE'), 'Xe máy');
  assert.equal(labels.transmissionLabel('MANUAL'), 'Số sàn');
  assert.equal(labels.notificationTypeLabel('DRIVER_DOCUMENT_REVIEWED'), 'Kết quả kiểm tra giấy tờ');
  assert.equal(labels.walletTransactionLabel('TRIP_EARNING'), 'Thu nhập chuyến đi');
  assert.equal(labels.walletTransactionLabel('COMMISSION_FEE'), 'Phí dịch vụ');
  for (const name of ['documentTypeLabel', 'vehicleTypeLabel', 'transmissionLabel', 'notificationTypeLabel', 'walletTransactionLabel']) {
    assert.equal(typeof labels[name](undefined), 'string');
    assert.notEqual(labels[name]('UNKNOWN_CODE'), 'UNKNOWN_CODE');
    assert.equal(typeof labels[name]('__proto__'), 'string');
  }
});

const platform = { OS: 'android', select: options => options.android ?? options.default ?? {} };
const palette = load('packages/ui/src/theme/colors.ts', { 'react-native': { Platform: platform } });
const theme = load('packages/ui/src/theme/ThemeProvider.tsx', {
  './colors': palette, react: { createContext: value => value }, 'react-native': {}, 'react/jsx-runtime': {},
});
const jsx = (type, props) => ({ type, props });
const badge = load('apps/driver/src/components/StatusBadge.tsx', {
  '@/lib/displayLabels': labels,
  '@expo/vector-icons': { MaterialIcons: 'Icon' },
  '@datxe/ui': { Typography: 'Text', useThemedStyles: factory => factory(theme.getThemeColors('driver', false)) },
  'react-native': { View: 'View', StyleSheet: { create: styles => styles, hairlineWidth: 1 } },
  'react/jsx-runtime': { jsx, jsxs: jsx },
});
test('badges expose a readable accessibility label and allow long status text to wrap', () => {
  const rendered = badge.StatusBadge({ kind: 'ride', value: 'IN_PROGRESS', contextLabel: 'Trạng thái chuyến' });
  assert.equal(rendered.props.accessibilityLabel, 'Trạng thái chuyến: Đang thực hiện chuyến');
  assert.equal(rendered.props.accessibilityRole, 'text');
  const text = rendered.props.children.find(child => child.type === 'Text');
  assert.equal(text.props.children, 'Đang thực hiện chuyến');
  assert.equal(text.props.numberOfLines, undefined);
});

function rgb(value, background = [255, 255, 255]) {
  if (value.startsWith('#')) return value.slice(1).match(/../g).map(channel => parseInt(channel, 16));
  const [r, g, b, alpha = 1] = value.match(/[\d.]+/g).map(Number);
  return [r, g, b].map((channel, index) => channel * alpha + background[index] * (1 - alpha));
}
function luminance(channels) {
  const linear = channels.map(value => { value /= 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
test('all badge text has AA contrast on actual driver light and dark surfaces', () => {
  for (const dark of [false, true]) {
    const c = theme.getThemeColors('driver', dark);
    for (const [tone, pair] of Object.entries(badge.badgeColors(c))) {
      for (const surface of [c.background, c.surfaceContainerLowest]) {
        const background = rgb(pair.backgroundColor, rgb(surface));
        const a = luminance(rgb(pair.color, background)), b = luminance(background);
        const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        assert.ok(contrast >= 4.5, `${tone} ${dark ? 'dark' : 'light'}: ${contrast.toFixed(2)}:1`);
      }
    }
  }
});

test('handover directions use the address and coordinates of the current phase', () => {
  const element = (type, props) => ({ type, props });
  const directions = [];
  const { RideStopCard } = load('apps/driver/src/features/ride/components/RideStopCard.tsx', {
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'Fragment' },
    '@/components/rideStyles': { rideStyles: {} },
    '@/lib/navigation': { openRideDirections: (ride, phase) => directions.push(ride[phase]) },
    '@datxe/ui': { Button: 'Button', Card: 'Card', Typography: 'Text', useThemedStyles: styles => styles },
  });
  const ride = {
    id: 42,
    pickupAddress: 'Điểm A',
    dropoffAddress: 'Điểm B',
    pickup: { lat: 21, lng: 105 },
    dropoff: { lat: 22, lng: 106 },
    pickupNote: 'Gặp ở cổng',
  };

  const pickup = RideStopCard({ ride, phase: 'pickup' }).props.children;
  const dropoff = RideStopCard({ ride, phase: 'dropoff' }).props.children;
  assert.equal(pickup[1].props.children, ride.pickupAddress);
  assert.equal(dropoff[1].props.children, ride.dropoffAddress);
  assert.ok(pickup[2]);
  assert.equal(dropoff[2], null);
  pickup[3].props.onPress();
  dropoff[3].props.onPress();
  assert.deepEqual(directions, [ride.pickup, ride.dropoff]);
});

test('grouped ride route offers directions only for the current stop', () => {
  const jsx = (type, props) => ({ type, props });
  const directions = [];
  const { RideRouteCard } = load('apps/driver/src/features/ride/components/RideRouteCard.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/lib/navigation': { openRideDirections: (ride, phase) => directions.push(ride[phase]) },
    '@datxe/ui': { Card: 'Card', Typography: 'Text', useThemeColors: () => ({}) },
    'react-native': { StyleSheet: { create: value => value }, View: 'View' },
    'react-native-paper': { IconButton: 'IconButton' },
  });
  const ride = {
    pickupAddress: 'Điểm A',
    dropoffAddress: 'Điểm B',
    pickup: { lat: 21, lng: 105 },
    dropoff: { lat: 22, lng: 106 },
  };
  const buttons = (node) => {
    if (Array.isArray(node)) return node.flatMap(buttons);
    if (node?.type === 'IconButton') return [node.props];
    return node?.props?.children ? buttons(node.props.children) : [];
  };
  assert.equal(buttons(RideRouteCard({ ride })).length, 0);
  for (const stop of ['pickup', 'dropoff']) {
    const actions = buttons(RideRouteCard({ ride, navigationStop: stop }));
    assert.equal(actions.length, 1);
    actions[0].onPress();
  }
  assert.deepEqual(directions, [ride.pickup, ride.dropoff]);
});
