const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks, globals = {}) {
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
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      Date,
      ...globals,
      require: (id) => {
        if (id in mocks) return mocks[id];
        throw Error(`Missing mock ${id}`);
      },
    },
  );
  return exports;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
function hooksFixture() {
  const values = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  return {
    reset: () => {
      stateIndex = 0;
      refIndex = 0;
    },
    hooks: {
      useState: (initial) => {
        const i = stateIndex++;
        if (!(i in values))
          values[i] = typeof initial === "function" ? initial() : initial;
        return [
          values[i],
          (value) => {
            values[i] = typeof value === "function" ? value(values[i]) : value;
          },
        ];
      },
      useRef: (initial) => {
        const i = refIndex++;
        refs[i] ??= { current: initial };
        return refs[i];
      },
      useEffect() {},
    },
  };
}
const jsx = (type, props) => ({ type, props });
function all(node) {
  if (!node || typeof node !== "object") return [];
  return Array.isArray(node)
    ? node.flatMap(all)
    : [node, ...all(node.props?.children)];
}

function supportFixture(h) {
  return load("packages/ui/src/SupportCenter.tsx", {
    react: h.hooks,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react-native-paper": {
      Divider: "Divider",
      List: { Item: "List.Item", Icon: "List.Icon" },
    },
    "react-native": {
      Image: "Image",
      Modal: "Modal",
      ScrollView: "ScrollView",
      View: "View",
      StyleSheet: { create: (value) => value },
    },
    "./components/Button": { Button: "Button" },
    "./components/Card": { Card: "Card" },
    "./components/Typography": { Typography: "Text" },
    "./components/ThemedTextInput": { ThemedTextInput: "TextInput" },
    "./components/ScreenWrapper": { ScreenWrapper: "ScreenWrapper" },
    "./theme/ThemeProvider": { useThemedStyles: (factory) => factory({}) },
  });
}

test("native draft input leaves composing text alone and clears only on reset", () => {
  const h = hooksFixture();
  let commit;
  const writes = [];
  const editor = {
    clear: () => writes.push(""),
    setNativeProps: ({ text }) => writes.push(text),
  };
  const { NativeDraftTextInput } = load("packages/ui/src/components/NativeDraftTextInput.tsx", {
    react: {
      ...h.hooks,
      forwardRef: (render) => render,
      useImperativeHandle() {},
      useLayoutEffect: (effect) => { commit = effect; },
    },
    "react/jsx-runtime": { jsx },
    "react-native": { Platform: { OS: "android" }, TextInput: "TextInput" },
  });
  let draftValue = "";
  const render = () => {
    h.reset();
    const { props } = NativeDraftTextInput({
      draftValue,
      onChangeText: (text) => { draftValue = text; },
    });
    props.ref.current = editor;
    commit();
    assert.equal(props.value, undefined);
    return props;
  };
  let input = render();
  for (const text of ["h", "he", "hê"]) {
    input.onChangeText(text);
    input = render();
  }
  assert.equal(draftValue, "hê");
  assert.deepEqual(writes, []);
  draftValue = "";
  render();
  render();
  assert.deepEqual(writes, [""]);
});

test("support retries reuse receipt key, retain description, and cannot submit before image upload finishes", async () => {
  const h = hooksFixture(),
    sent = [];
  let fail = true;
  const { SupportCenter, EvidenceEditor } = supportFixture(h);
  const render = () => {
    h.reset();
    return SupportCenter({
      rides: [],
      tickets: [],
      pending: false,
      pickImage: async () => null,
      send: async (body) => {
        sent.push(body);
        if (fail) throw Error("offline");
        return { code: "HT-42" };
      },
    });
  };
  const button = (tree) =>
    all(tree).find(
      (node) =>
        node.type === "Button" && node.props.label === "Gửi yêu cầu hỗ trợ",
    );
  let tree = render();
  all(tree)
    .find((node) => node.type === "TextInput")
    .props.onChangeText("Tôi không cập nhật được hồ sơ");
  tree = render();
  all(tree)
    .find((node) => node.type === EvidenceEditor)
    .props.onBusyChange(true);
  tree = render();
  assert.equal(button(tree).props.disabled, true);
  all(tree)
    .find((node) => node.type === EvidenceEditor)
    .props.onBusyChange(false);
  button(render()).props.onPress();
  await tick();
  tree = render();
  assert.equal(
    all(tree).find((node) => node.type === "TextInput").props.draftValue,
    "Tôi không cập nhật được hồ sơ",
  );
  assert.equal(sent.length, 1);
  fail = false;
  button(tree).props.onPress();
  await tick();
  assert.equal(sent.length, 2);
  assert.equal(sent[0].clientRequestId, sent[1].clientRequestId);
  assert.match(
    sent[0].clientRequestId,
    /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
  );
  tree = render();
  assert.equal(
    all(tree).find((node) => node.type === "TextInput").props.draftValue,
    "",
  );
  assert.ok(JSON.stringify(tree).includes("HT-42"));
});

test("driver online session alone never becomes a ready reception indicator", () => {
  const h = hooksFixture();
  const now = Date.now();
  const health = {
    connected: false,
    foregroundGranted: true,
    servicesEnabled: true,
    lastSampleAt: now,
    lastSentAt: null,
    backgroundGranted: false,
    backgroundRunning: false,
    retry() {},
  };
  const { DriverReceptionStatus } = load(
    "apps/driver/src/components/DriverReceptionStatus.tsx",
    {
      react: h.hooks,
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
      "@/lib/driverHealth": { useDriverHealth: () => health },
      "@/lib/store": {
        useSessionStore: (selector) =>
          selector({ user: { status: "ONLINE" }, activeRide: null }),
      },
      "@datxe/ui": { Card: "Card", Button: "Button", Typography: "Text" },
      "react-native": { Linking: {}, StyleSheet: { create: (value) => value } },
    },
  );
  const render = () => {
    h.reset();
    return DriverReceptionStatus();
  };
  assert.ok(JSON.stringify(render()).includes("Chưa đủ điều kiện"));
  health.lastSentAt = now;
  assert.ok(JSON.stringify(render()).includes("GPS sẵn sàng"));
  health.lastSampleAt = now - 40000;
  assert.ok(JSON.stringify(render()).includes("Chưa đủ điều kiện"));
  assert.ok(JSON.stringify(render()).includes("Giữ app mở"));
});

test("Home shows a single operational status and prioritizes an actionable GPS blocker", () => {
  const h = hooksFixture();
  const now = Date.now();
  const health = {
    connected: false,
    foregroundGranted: false,
    servicesEnabled: true,
    lastSampleAt: now,
    lastSentAt: null,
    retry() {},
  };
  const { HomeOperationalStatus } = load(
    "apps/driver/src/features/offers/components/HomeOperationalStatus.tsx",
    {
      react: h.hooks,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "@/lib/driverHealth": { useDriverHealth: () => health },
      "@expo/vector-icons": { MaterialIcons: "Icon" },
      "@datxe/ui": { Card: "Card", Button: "Button", Typography: "Text", useThemeColors: () => ({}) },
      "react-native": { View: "View", StyleSheet: { create: (styles) => styles } },
    },
  );
  const render = (props = {}) => {
    h.reset();
    return JSON.stringify(HomeOperationalStatus({ online: true, active: false, loading: false, onDiagnostics() {}, ...props }));
  };
  assert.match(render(), /Cần cấp quyền vị trí/);
  assert.doesNotMatch(render(), /Sẵn sàng nhận chuyến|Đang kết nối lại/);
  health.foregroundGranted = true;
  assert.match(render(), /Đang kết nối lại/);
  health.lastSentAt = now;
  assert.match(render(), /Sẵn sàng nhận chuyến/);
  health.connected = true;
  health.lastSentAt = now - 31_000;
  assert.match(render(), /Đang chờ vị trí GPS mới/);
  assert.match(render({ blocker: { title: "Hồ sơ chưa đủ điều kiện nhận chuyến" } }), /Hồ sơ chưa đủ điều kiện nhận chuyến/);
});

test("Home data retry refetches failed sources while retaining data and never invokes GPS", async () => {
  const calls = [],
    queries = [];
  const api = {};
  for (const key of [
    "getActiveCustomerRide",
    "getCustomerProfile",
    "getCustomerRides",
    "getCustomerVouchers",
    "getNearbyCustomerDrivers",
    "getUnreadNotificationCount",
  ])
    api[key] = () => {};
  const { useHome } = load(
    "apps/customer/src/features/booking/hooks/useHome.ts",
    {
      "@datxe/shared": { translate: (value) => value },
      "@/lib/customerName": { getCustomerDisplayName: () => "Khách" },
      "@/lib/useRefreshOnFocus": { useRefreshOnFocus() {} },
      react: {
        useState: (initial) => [
          typeof initial === "function" ? initial() : initial,
          () => {},
        ],
        useRef: (current) => ({ current }),
        useCallback: (value) => value,
      },
      "expo-location": {
        getCurrentPositionAsync: () => assert.fail("data retry requested GPS"),
      },
      "expo-router": { useRouter: () => ({}), useFocusEffect() {} },
      "react-native": {},
      "../api": api,
      "../components/HomeScreenParts": { getRecentDestinations: () => [] },
      "../bookingUtils": {},
      "@tanstack/react-query": {
        useQuery: (options) => {
          const index = queries.length;
          const query = {
            data: index === 0 ? { full_name: "Khách" } : undefined,
            isError: [0, 2, 3].includes(index),
            refetch: async () => {
              calls.push(index);
            },
            error: index === 0 ? Error("offline") : null,
          };
          queries.push(query);
          return query;
        },
      },
    },
  );
  const h = useHome();
  assert.equal(h.profile.full_name, "Khách");
  await h.retryData();
  assert.deepEqual(calls, [0, 2, 3]);
  assert.equal(h.profile.full_name, "Khách");
});

test("cash collection comes from the persisted ride and updates query cache before refetch", async () => {
  let ride = {
    id: 45,
    status: "COMPLETED",
    payment: {
      method: "CASH",
      status: "PAID",
      amount: 30000,
      paidAt: "2026-11-05T00:00:00Z",
    },
  };
  let mutation,
    confirmed = 0;
  const invalidated = [];
  const { useComplete } = load(
    "apps/driver/src/features/ride/hooks/useComplete.ts",
    {
      react: { useCallback: (value) => value },
      "expo-router": {
        useLocalSearchParams: () => ({ rideId: "45" }),
        useRouter: () => ({}),
      },
      "@/lib/useRefreshOnFocus": { useRefreshOnFocus() {} },
      "../api": {
        getDriverRide() {},
        confirmCashReceived: async () => {
          confirmed++;
          return {
            rideId: 45,
            amount: 30000,
            status: "PAID",
            paidAt: "2026-11-05T00:00:00Z",
          };
        },
      },
      "@tanstack/react-query": {
        useQuery: () => ({ data: ride, refetch() {} }),
        useMutation: (options) => {
          mutation = options;
          return {};
        },
        useQueryClient: () => ({
          setQueryData: (_key, update) => {
            ride = update(ride);
          },
          invalidateQueries: async ({ queryKey }) =>
            invalidated.push(queryKey.join("/")),
        }),
      },
    },
  );
  useComplete();
  assert.throws(() => mutation.mutationFn(), /không còn chờ/);
  assert.equal(
    confirmed,
    0,
    "reopening a paid trip must not ask for cash again",
  );
  ride.payment.status = "PENDING";
  useComplete();
  const paid = await mutation.mutationFn();
  await mutation.onSuccess(paid);
  assert.equal(ride.payment.status, "PAID");
  assert.ok(invalidated.includes("driver/ride/45"));
  assert.ok(invalidated.includes("driver/wallet"));
});

test("handover confirmation and revision send the version that the user reviewed", async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {};
  };
  const customer = load("apps/customer/src/features/vehicles/api.ts", {
    "@/lib/api": { request },
    "@/lib/customerApi": { customerApi: {} },
    "@/lib/uploadImage": {},
  });
  await customer.confirmCustomerHandover(12, "pickup", 3);
  assert.equal(calls[0].options.body.revision, 3);
  const driver = load("apps/driver/src/features/ride/api.ts", {
    "@/lib/api": { request },
  });
  const report = { odometer: 12000, photos: [] };
  await driver.reviseDriverHandover(12, "pickup", 3, report);
  assert.equal(calls[1].path, "/driver/rides/12/handover/pickup/revisions");
  assert.equal(calls[1].options.body.revision, 3);
  assert.equal(calls[1].options.body.report, report);
});

test("restored GPS preserves sample time, ignores legacy cache and heartbeat obtains a real fix", async () => {
  const shared = load("packages/shared/src/ws/location.ts", {});
  async function fixture(stored) {
    const sent = [],
      updates = [],
      timers = [];
    let position,
      gpsCalls = 0;
    const api = load(
      "apps/driver/src/lib/backgroundLocation.ts",
      {
        "@datxe/shared": shared,
        "@react-native-async-storage/async-storage": {
          __esModule: true,
          default: {
            getItem: async () => JSON.stringify(stored),
            setItem: async () => {},
          },
        },
        "expo-location": {
          Accuracy: { Balanced: 1 },
          getCurrentPositionAsync: async () => {
            gpsCalls++;
            return position;
          },
        },
        "expo-task-manager": {},
        "react-native": { Platform: { OS: "web" }, AppState: { currentState: "active" } },
        "@/config/env": { env: { locationIntervalMs: 4000 } },
        "./api": { request: async (path, options) => {
          assert.equal(path, "/driver/location");
          assert.equal(options.allowNull, true);
          sent.push(options.body);
          return null;
        } },
        "./realtime": {
          driverRealtime: {
            publish: () => assert.fail("fresh GPS should use the acknowledged HTTP path first"),
          },
        },
        "./driverHealth": {
          useDriverHealth: {
            getState: () => ({ connected: true, update: (update) => updates.push(update) }),
          },
        },
      },
      {
        setInterval: (handler) => {
          timers.push(handler);
          return 1;
        },
        clearInterval() {},
      },
    );
    await api.restoreLastLocation();
    return {
      api,
      sent,
      updates,
      timers,
      setPosition: (value) => {
        position = value;
      },
      gpsCalls: () => gpsCalls,
    };
  }
  const timestamp = new Date(Date.now() - 15000).toISOString();
  const f = await fixture({
    location: { lat: 21.03, lng: 105.84 },
    accuracy: 12,
    timestamp,
  });
  assert.equal(f.sent[0].timestamp, timestamp);
  f.setPosition({
    coords: { latitude: 21.03, longitude: 105.84, accuracy: 12 },
    timestamp: Date.parse(timestamp),
  });
  f.api.startDriverLocationHeartbeat();
  f.timers[0]();
  await tick();
  assert.equal(f.gpsCalls(), 1);
  assert.equal(
    f.sent.length,
    1,
    "a repeated GPS fix cannot be relabelled as new",
  );
  const unknownAccuracy = await fixture(null);
  unknownAccuracy.api.publishDriverLocation({
    coords: { latitude: 21.03, longitude: 105.84, accuracy: null },
    timestamp: Date.now(),
  });
  assert.equal(unknownAccuracy.sent.length, 1, "valid GPS without accuracy still reaches the backend");
  assert.equal(unknownAccuracy.sent[0].accuracy, null);
  const legacy = await fixture({ lat: 21.03, lng: 105.84, accuracy: 12 });
  assert.equal(legacy.sent.length, 0);
  const stale = await fixture({
    location: { lat: 21.03, lng: 105.84 },
    accuracy: 12,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  });
  assert.equal(stale.sent.length, 0);
});

test("backgrounded GPS is mirrored over REST when the socket is not live", async () => {
  const shared = load("packages/shared/src/ws/location.ts", {});
  const requests = [];
  const api = load("apps/driver/src/lib/backgroundLocation.ts", {
    "@datxe/shared": shared,
    "@react-native-async-storage/async-storage": {
      __esModule: true,
      default: { getItem: async () => null, setItem: async () => {} },
    },
    "expo-location": { Accuracy: {}, getCurrentPositionAsync: async () => null },
    "expo-task-manager": { isTaskDefined: () => true, defineTask() {} },
    "react-native": { Platform: { OS: "android" }, AppState: { currentState: "background" } },
    "@/config/env": { env: { locationIntervalMs: 4000 } },
    "./api": { request: async (path, options) => { requests.push({ path, options }); return {}; } },
    "./realtime": { driverRealtime: { publish: () => true } },
    "./driverHealth": { useDriverHealth: { getState: () => ({ connected: true, update: () => {} }) } },
  });
  api.publishDriverLocation({
    coords: { latitude: 21.03, longitude: 105.84, accuracy: 10 },
    timestamp: Date.now(),
  });
  await tick();
  assert.equal(requests.length, 1, "background samples must not depend on the STOMP socket");
  assert.equal(requests[0].path, "/driver/location");
  assert.equal(requests[0].options.method, "POST");
});

test("tracking never treats a newly received old GPS sample as a live position", () => {
  const h = hooksFixture();
  const util = load("packages/shared/src/ws/location.ts", {});
  let receive,
    connection,
    mounted = false;
  const socket = {
    subscribe: (destination, listener) => {
      if (destination.includes("/location")) receive = listener;
      return () => {};
    },
    onConnection: (listener) => {
      connection = listener;
      return () => {};
    },
    connect: () => connection(true),
    disconnect() {},
  };
  const { useLiveDriverLocation } = load(
    "apps/customer/src/features/tracking/hooks/useLiveDriverLocation.ts",
    {
      react: {
        ...h.hooks,
        useEffect: (effect) => {
          if (!mounted) {
            mounted = true;
            effect();
          }
        },
      },
      "@/config/env": {
        env: { apiUrl: "https://example.test/api", locationStaleMs: 30000 },
      },
      "@datxe/shared": { ...util, createStompClient: () => socket },
    },
    {
      setTimeout: () => 1,
      setInterval: () => 2,
      clearTimeout() {},
      clearInterval() {},
    },
  );
  const render = () => {
    h.reset();
    return useLiveDriverLocation(12, true, () => {}, true);
  };
  render();
  receive({
    body: JSON.stringify({
      location: { lat: 21.03, lng: 105.84 },
      accuracy: 12,
      timestamp: new Date(Date.now() - 40000).toISOString(),
      receivedAt: new Date().toISOString(),
    }),
  });
  assert.equal(render().signalLost, true);
  receive({
    body: JSON.stringify({
      location: { lat: 21.03, lng: 105.84 },
      accuracy: 12,
      timestamp: new Date().toISOString(),
    }),
  });
  assert.equal(render().signalLost, false);
  connection(false);
  assert.equal(render().signalLost, true);
});

test("support topics share one divided card and stay separate from the warning and description form", async () => {
  const h = hooksFixture(),
    sent = [];
  const { SupportCenter } = supportFixture(h);
  const render = () => {
    h.reset();
    return SupportCenter({
      rides: [],
      tickets: [],
      pending: false,
      pickImage: async () => null,
      send: async (body) => {
        sent.push(body);
        return { code: "HT-UI" };
      },
    });
  };
  let tree = render();
  const cards = all(tree).filter((node) => node.type === "Card");
  const topics = cards.find(
    (card) =>
      all(card).filter(
        (node) =>
          node.type === "List.Item" && node.props.accessibilityRole === "radio",
      ).length === 5,
  );
  const form = cards.find((card) =>
    all(card).some((node) => node.type === "TextInput"),
  );
  const warning = cards.find((card) =>
    JSON.stringify(card).includes("Kênh này không xử lý khẩn cấp"),
  );
  assert.ok(topics && form && warning);
  assert.notEqual(topics, form);
  assert.notEqual(warning, form);
  assert.equal(all(topics).filter((node) => node.type === "Button").length, 0);
  assert.equal(all(topics).filter((node) => node.type === "Divider").length, 4);
  assert.equal(form.props.style.gap, 12);
  const input = all(form).find((node) => node.type === "TextInput");
  assert.equal(input.props.style.padding, 16);
  assert.ok(input.props.style.minHeight >= 144);
  assert.equal(input.props.maxLength, 4000);
  for (const button of all(form).filter((node) => node.type === "Button")) {
    assert.ok(button.props.style.minHeight >= 48);
    assert.equal(button.props.style.marginVertical, 12);
  }
  all(topics)
    .find(
      (node) => node.type === "List.Item" && node.props.title === "Thanh toán",
    )
    .props.onPress();
  input.props.onChangeText("Tôi cần hỗ trợ kiểm tra thanh toán chuyến đi");
  tree = render();
  const payment = all(tree).find(
    (node) => node.type === "List.Item" && node.props.title === "Thanh toán",
  );
  assert.equal(payment.props.accessibilityState.checked, true);
  all(tree)
    .find(
      (node) =>
        node.type === "Button" && node.props.label === "Gửi yêu cầu hỗ trợ",
    )
    .props.onPress();
  await tick();
  assert.equal(sent[0].category, "PAYMENT");
});
