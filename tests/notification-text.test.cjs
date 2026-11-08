const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const i18n = require("./i18n-loader.cjs");
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
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
const { getNotificationText } = load(
  "packages/shared/src/notifications/display.ts",
  { "../i18n": i18n },
);
const codes = [
  "RIDE_OFFER",
  "OFFER_EXPIRED",
  "OFFER_CANCELLED",
  "RIDE_UPDATED",
  "HANDOVER_CONFIRMED",
  "RIDE_CANCELLED",
  "RIDE_COMPLETED",
  "RIDE_NO_DRIVER",
  "RIDE_ASSIGNED",
  "DRIVER_DOCUMENT_REVIEWED",
  "DRIVER_VERIFICATION_UPDATED",
  "DRIVER_FORCE_OFFLINE",
  "CHAT_MESSAGE",
  "CHAT_READ",
];

test("ride titles and descriptions use the requested language instead of raw backend messages", () => {
  i18n.setLanguage("vi");
  let copy = getNotificationText("RIDE_COMPLETED", {
    message: "Ride completed",
    body: "RIDE_COMPLETED",
    finalFare: 34960,
  });
  assert.equal(copy.title, "Chuyến đi hoàn thành");
  assert.equal(copy.description, "Chuyến đi của bạn đã kết thúc thành công.");
  copy = getNotificationText("RIDE_UPDATED", { message: "RIDE_UPDATED" });
  assert.equal(copy.title, "Cập nhật chuyến đi");
  assert.equal(
    copy.description,
    "Thông tin chuyến đi của bạn vừa được cập nhật.",
  );
  i18n.setLanguage("en");
  copy = getNotificationText("RIDE_COMPLETED", { message: "RIDE_COMPLETED" });
  assert.equal(copy.title, "Ride completed");
  assert.equal(copy.description, "Your ride has been successfully completed.");
  copy = getNotificationText("RIDE_UPDATED", { message: "Ride updated" });
  assert.equal(copy.title, "Ride updated");
  assert.equal(copy.description, "Your ride details have been updated.");
  i18n.setLanguage("vi");
});

test("every delivered event and ride state has readable bilingual copy, including driver arrival", () => {
  const source = fs.readFileSync("packages/shared/src/types/index.ts", "utf8");
  const statuses = [
    ...source
      .match(/export type RideStatus =([\s\S]*?);/)[1]
      .matchAll(/'([^']+)'/g),
  ].map((match) => match[1]);
  for (const language of ["vi", "en"]) {
    i18n.setLanguage(language);
    for (const type of codes) {
      const copy = getNotificationText(type, {});
      assert.ok(copy.title.trim());
      assert.ok(copy.description.trim());
      assert.doesNotMatch(
        copy.title + copy.description,
        /\b[A-Z]+(?:_[A-Z]+)+\b/,
      );
      assert.notEqual(copy.title, type);
    }
    for (const status of statuses) {
      const copy = getNotificationText("RIDE_UPDATED", { status });
      assert.notEqual(
        copy.description,
        getNotificationText("RIDE_UPDATED").description,
        status,
      );
      assert.ok(!copy.title.includes(status), status);
    }
    const arrival = getNotificationText("RIDE_UPDATED", {
      status: "DRIVER_ARRIVED",
    });
    assert.equal(
      arrival.title,
      language === "vi" ? "Tài xế đã đến" : "Driver arrived",
    );
    assert.equal(
      arrival.description,
      language === "vi"
        ? "Tài xế đã đến điểm đón của bạn."
        : "Your driver has arrived at your pickup location.",
    );
  }
  i18n.setLanguage("vi");
});

test("unknown and malformed payloads never dump enum values or technical fields", () => {
  i18n.setLanguage("vi");
  for (const type of [
    "FUTURE_EVENT",
    "__proto__",
    "constructor",
    null,
    "",
    42,
  ]) {
    for (const payload of [
      null,
      [],
      7,
      "RIDE_COMPLETED",
      { status: "DRIVER_ARRIVED", rideId: 3 },
      { message: "FUTURE_EVENT" },
      { message: "state=RIDE_UPDATED" },
    ]) {
      const copy = getNotificationText(type, payload);
      assert.equal(copy.title, "Thông báo mới");
      assert.equal(copy.description, "Bạn có thông báo mới từ hệ thống.");
    }
  }
  const copy = getNotificationText("UNKNOWN", { message: "Ride completed" });
  assert.equal(copy.title, "Chuyến đi hoàn thành");
  assert.equal(
    getNotificationText("RIDE_UPDATED", { status: "RIDE_OFFER" }).title,
    "Cập nhật chuyến đi",
  );
  const custom = "Ưu đãi cho chuyến đi tới Nguyễn Văn An, 39 Ngõ 2 Cầu Bươu";
  for (const language of ["vi", "en"]) {
    i18n.setLanguage(language);
    assert.equal(
      getNotificationText("CUSTOM_NOTICE", { body: custom, secret: "internal" })
        .description,
      custom,
    );
  }
  i18n.setLanguage("vi");
});

const jsx = (type, props) => ({ type, props });
const all = (node) =>
  !node || typeof node !== "object"
    ? []
    : Array.isArray(node)
      ? node.flatMap(all)
      : [node, ...all(node.props?.children)];
test("a mounted notification consumer rerenders copy immediately when the language store changes", () => {
  let listener,
    renderCount = 0,
    tree;
  const { useTranslation } = load("packages/ui/src/useLanguage.ts", {
    "@datxe/shared": i18n,
    react: {
      useSyncExternalStore: (subscribe, getSnapshot) => {
        if (!listener) listener = subscribe(() => render());
        return getSnapshot();
      },
    },
  });
  const styles = new Proxy({}, { get: () => ({}) });
  const { NotificationListItem } = load(
    "apps/customer/src/features/notifications/components/NotificationListItem.tsx",
    {
      "@datxe/shared": { ...i18n, getNotificationText },
      "@datxe/ui": {
        MotionPressable: "Pressable",
        Typography: "Text",
        useTranslation,
        useThemeColors: () => ({}),
        useThemedStyles: () => styles,
      },
      "@expo/vector-icons": { MaterialIcons: "Icon" },
      "react-native": { View: "View" },
      "./NotificationScreenParts": {
        styles: () => styles,
        category: () => "trip",
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
    },
  );
  const onPress = () => {};
  function render() {
    renderCount++;
    tree = NotificationListItem({
      item: {
        id: 1,
        type: "RIDE_COMPLETED",
        payload: { message: "Ride completed" },
        createdAt: "2026-11-05T00:00:00Z",
        readAt: null,
      },
      onPress,
    });
  }
  const text = () =>
    all(tree)
      .filter((node) => node.type === "Text")
      .map((node) => node.props.children);
  i18n.setLanguage("vi");
  render();
  assert.ok(text().includes("Chuyến đi hoàn thành"));
  const count = renderCount;
  i18n.setLanguage("en");
  assert.equal(renderCount, count + 1);
  assert.ok(text().includes("Ride completed"));
  assert.ok(text().includes("Your ride has been successfully completed."));
  assert.equal(tree.props.onPress, onPress);
  i18n.setLanguage("vi");
  assert.ok(text().includes("Chuyến đi của bạn đã kết thúc thành công."));
  listener();
});
