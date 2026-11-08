const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const jsx = (type, props) => ({ type, props });
const all = (node) =>
  !node || typeof node !== "object"
    ? []
    : Array.isArray(node)
      ? node.flatMap(all)
      : [node, ...all(node.props?.children)];
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      require: (name) => {
        assert.ok(name in mocks, `Missing mock ${name}`);
        return mocks[name];
      },
    },
  );
  return exports;
}
const native = {
  Platform: { OS: "android" },
  StyleSheet: { create: (value) => value },
  View: "View",
};
const tokens = load("packages/ui/src/theme/colors.ts", {
  "react-native": native,
});
const { getThemeColors } = load("packages/ui/src/theme/ThemeProvider.tsx", {
  react: { createContext: (value) => value },
  "react-native": native,
  "./colors": tokens,
  "react/jsx-runtime": { jsx, jsxs: jsx },
});
const shared = { getLocale: () => "vi-VN", translate: (value) => value };
function fixture(dark) {
  const colors = getThemeColors("customer", dark);
  const ui = {
    ...tokens,
    MotionPressable: "Pressable",
    Typography: "Text",
    useLanguage() {},
    useThemeColors: () => colors,
    useThemedStyles: (factory) => factory(colors),
  };
  return { colors, ui };
}

test("customer payment summary uses the persisted amount and distinguishes unpaid from collected cash", () => {
  const { ui } = fixture(true);
  const { CustomerPaymentSummary } = load(
    "apps/customer/src/components/CustomerPaymentSummary.tsx",
    {
      "@datxe/shared": shared,
      "@datxe/ui": { ...ui, Card: "Card" },
      "react-native": native,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "./CustomerRideUI": { customerType: {}, MoneyText: "MoneyText" },
    },
  );
  const ride = { status: "COMPLETED", estimatedFare: 120000, finalFare: 110000, discountAmount: null };
  const render = (status) => CustomerPaymentSummary({
    ride: { ...ride, payment: { method: "CASH", status, amount: 95000 } },
  });
  assert.equal(all(render("PENDING")).find((node) => node.type === "MoneyText").props.value, 95000);
  assert.match(JSON.stringify(render("PENDING")), /Tiền mặt cần trả/);
  assert.match(JSON.stringify(render("PAID")), /Tiền mặt đã thanh toán/);
  assert.doesNotMatch(JSON.stringify(render("PAID")), /Tiền mặt cần trả/);
  assert.equal(all(CustomerPaymentSummary({ ride })).find((node) => node.type === "MoneyText").props.value, 110000);
});

for (const dark of [false, true]) {
  test(`notification and history records retain borderless tonal surfaces and readable insets in ${dark ? "dark" : "light"} mode`, () => {
    const { colors, ui } = fixture(dark);
    const notificationParts = load(
      "apps/customer/src/features/notifications/components/NotificationScreenParts.tsx",
      { "@datxe/shared": shared, "@datxe/ui": ui, "react-native": native },
    );
    const historyParts = load(
      "apps/customer/src/features/history/components/TripHistoryScreenParts.tsx",
      { "@datxe/shared": shared, "@datxe/ui": ui, "react-native": native },
    );
    const notification = notificationParts.styles(colors),
      history = historyParts.styles(colors);
    for (const style of [notification.item, history.ride]) {
      assert.equal(style.paddingHorizontal, 16);
      assert.ok(style.paddingVertical >= 12);
      assert.equal(style.borderWidth ?? 0, 0);
      assert.equal(style.borderColor, undefined);
      assert.equal(style.backgroundColor, colors.cardSurface);
      assert.equal(style.borderRadius, 24);
    }
    assert.equal(notification.dot.width, 8);
    assert.equal(notification.dot.height, 8);
    assert.equal(notification.dot.flexShrink, 0);
    assert.equal(notification.itemTitle.minWidth, 0);
    assert.equal(history.address.flex, 1);
    assert.equal(history.rideHeader.flexWrap, "wrap");
    assert.equal(history.meta.color, colors.onSurfaceMuted);
    assert.equal(notification.time.color, colors.onSurfaceMuted);
  });
}

test("header uses one leading action and fluid title without empty mirrored action slots", () => {
  const { ui } = fixture(true);
  const { ScreenHeader } = load(
    "apps/customer/src/components/ScreenHeader.tsx",
    {
      "@datxe/shared": shared,
      "@datxe/ui": ui,
      "react-native": native,
      "react-native-paper": {
        Appbar: { Header: "Header", Content: "Content", Action: "Action" },
      },
      "@expo/vector-icons": { MaterialIcons: "Icon" },
      "react/jsx-runtime": { jsx, jsxs: jsx },
    },
  );
  const onBack = () => {};
  const back = ScreenHeader({ title: "An toàn chuyến đi", onBack });
  assert.equal(back.props.style.flexShrink, 0);
  assert.equal(all(back).filter((node) => node.type === "Action").length, 1);
  assert.equal(
    all(back).find((node) => node.type === "Action").props.onPress,
    onBack,
  );
  const content = all(back).find((node) => node.type === "Content");
  assert.equal(content.props.style.flex, 1);
  assert.equal(content.props.style.minWidth, 0);
  const tab = ScreenHeader({
    title: "Thông báo",
    rightContent: "Safety action",
  });
  assert.equal(all(tab).filter((node) => node.type === "Action").length, 0);
  assert.equal(
    all(tab).filter((node) => node.props?.children === "Safety action").length,
    1,
  );
});

function flatten(style) {
  return Array.isArray(style)
    ? Object.assign({}, ...style.map(flatten))
    : style || {};
}

test("fixed-height buttons do not gain an extra padding frame from legacy caller styles", () => {
  const { colors } = fixture(true);
  const { Button } = load("packages/ui/src/components/Button.tsx", {
    "@datxe/shared": shared,
    "@expo/vector-icons": { MaterialIcons: "Icon" },
    "react-native": {
      ...native,
      StyleSheet: { ...native.StyleSheet, flatten },
    },
    "react-native-paper": {
      Text: "Text",
      TouchableRipple: "Ripple",
      ActivityIndicator: "Spinner",
    },
    "../theme/colors": tokens,
    "../theme/surfaces": load("packages/ui/src/theme/surfaces.ts", {}),
    "../theme/ThemeProvider": { useThemeColors: () => colors },
    "../useLanguage": { useLanguage() {} },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });
  const onPress = () => {};
  const button = Button({
    label: "Tạm ngừng nhận chuyến",
    onPress,
    numberOfLines: 1,
    style: { height: 48, padding: 16, borderWidth: 4, borderLeftWidth: 7 },
  });
  const frame = flatten(button.props.style);
  const content = flatten(button.props.children.props.style);
  assert.equal(frame.borderWidth, 0);
  assert.equal(frame.borderLeftWidth, 0);
  assert.equal(frame.height, 48);
  assert.equal(frame.paddingVertical, 0);
  assert.equal(frame.paddingHorizontal, 0);
  assert.equal(content.height, 48);
  assert.equal(content.paddingVertical, 0);
  assert.equal(button.props.onPress, onPress);
  assert.equal(
    all(button).find((node) => node.type === "Text").props.numberOfLines,
    1,
  );
  const flexible = Button({
    label: "A long description that still needs to wrap",
  });
  assert.equal(flatten(flexible.props.style).height, undefined);
  assert.equal(flatten(flexible.props.children.props.style).minHeight, 48);
});

test("OTP keeps six rectangular cells and focus feedback while preserving digit sanitization", () => {
  const { colors, ui } = fixture(true);
  let code;
  const { OtpCodeInput } = load("packages/ui/src/auth/OtpCodeInput.tsx", {
    "@datxe/shared": shared,
    react: { useState: () => [true, () => {}] },
    "react-native": native,
    "../components": { Typography: "Text", ThemedTextInput: "Input" },
    "../theme/ThemeProvider": {
      useThemeColors: () => colors,
      useThemedStyles: ui.useThemedStyles,
    },
    "../useLanguage": { useLanguage() {} },
    "../theme/colors": tokens,
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });
  const tree = OtpCodeInput({
    value: "12",
    onChange: (value) => {
      code = value;
    },
  });
  const boxes = tree.props.children[0].props.children;
  assert.equal(boxes.length, 6);
  for (const box of boxes) {
    const style = flatten(box.props.style);
    assert.equal(style.width, 48);
    assert.equal(style.height, 56);
    assert.equal(style.borderRadius, 8);
    assert.equal(style.flexGrow, 0);
  }
  assert.equal(flatten(boxes[2].props.style).borderWidth, 2);
  assert.equal(flatten(boxes[2].props.style).borderColor, colors.primary);
  const input = all(tree).find((node) => node.type === "Input");
  input.props.onChangeText("1a2 3456789");
  assert.equal(code, "123456");
  assert.equal(input.props.autoComplete, "sms-otp");
});
