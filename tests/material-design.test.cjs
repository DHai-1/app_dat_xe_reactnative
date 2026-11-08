const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const walk = (root) =>
  fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const roots = ["apps/customer/src", "apps/driver/src", "packages/ui/src"];

test("both apps and shared UI remain free of shadow declarations and raised Paper surfaces", () => {
  const forbidden = new Set([
    "shadowColor",
    "shadowOffset",
    "shadowOpacity",
    "shadowRadius",
    "elevation",
    "boxShadow",
  ]);
  for (const file of roots
    .flatMap(walk)
    .filter((file) => /\.tsx?$/.test(file))) {
    const source = fs.readFileSync(file, "utf8");
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      if (
        (ts.isPropertyAssignment(node) || ts.isJsxAttribute(node)) &&
        node.name
      ) {
        const name = node.name.getText(tree).replace(/["']/g, "");
        assert.ok(!forbidden.has(name), `${file}: forbidden ${name}`);
        if (
          ts.isJsxAttribute(node) &&
          name === "mode" &&
          ts.isStringLiteral(node.initializer)
        ) {
          assert.notEqual(
            node.initializer.text,
            "elevated",
            `${file}: raised Paper surface`,
          );
        }
      }
      node.forEachChild(visit);
    }
    visit(tree);
  }
});

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
        assert.ok(name in mocks, `Unexpected dependency ${name}`);
        return mocks[name];
      },
    },
  );
  return exports;
}
const palette = load("packages/ui/src/theme/colors.ts", {
  "react-native": { Platform: { OS: "android" } },
});
const theme = load("packages/ui/src/theme/ThemeProvider.tsx", {
  "./colors": palette,
  react: { createContext: (value) => value },
  "react-native": {},
  "react/jsx-runtime": {},
});
const material = load("packages/ui/src/theme/materialTheme.ts", {
  "react-native-paper": {
    MD3LightTheme: { version: 3, dark: false, colors: {} },
    MD3DarkTheme: { version: 3, dark: true, colors: {} },
  },
});

test("both brands expose the requested screen/card tones through their app-wide MD3 theme", () => {
  for (const brand of ["customer", "driver"]) {
    for (const dark of [false, true]) {
      const colors = theme.getThemeColors(brand, dark);
      const paper = material.createMaterialTheme(colors, dark);
      assert.equal(paper.version, 3);
      assert.equal(paper.dark, dark);
      assert.equal(colors.background, dark ? "#121212" : "#F3F4F6");
      for (const token of [
        "surface",
        "surfaceContainerLowest",
        "surfaceContainerLow",
        "cardSurface",
      ]) {
        assert.equal(
          colors[token],
          dark ? "#1E1E1E" : "#FFFFFF",
          `${brand}: ${token}`,
        );
      }
      assert.equal(paper.colors.background, colors.background);
      assert.equal(paper.colors.surface, colors.cardSurface);
      assert.equal(paper.colors.primary, colors.primary);
      assert.equal(paper.colors.onPrimaryContainer, colors.onPrimaryContainer);
    }
  }
  assert.equal(palette.borderRadius.xxl, 24);
  assert.equal(palette.borderRadius.full, 999);
  assert.equal(palette.spacing.sheetRadius, 28);
});

test("decorative borders cannot return to buttons, badges, cards or their containers", () => {
  // Inputs and route markers convey focus, validation and location rather
  // than framing an action or card. These are the only intentional exceptions.
  const functionalOutlines = new Map([
    [
      "packages/ui/src/auth/OtpCodeInput.tsx",
      new Set(["codeBox", "codeBoxFilled", "codeBoxActive"]),
    ],
    [
      "packages/ui/src/auth/PhoneNumberInput.tsx",
      new Set(["inputRow", "inputRowInvalid"]),
    ],
    ["packages/ui/src/SupportCenter.tsx", new Set(["input"])],
    [
      "apps/customer/src/features/profile/components/ProfileScreenParts.tsx",
      new Set(["editInput"]),
    ],
    [
      "apps/customer/src/features/tracking/components/TripCompletedScreenParts.tsx",
      new Set(["input"]),
    ],
    [
      "apps/customer/src/features/vehicles/components/AddVehicleScreenParts.tsx",
      new Set(["input"]),
    ],
    [
      "apps/customer/src/features/booking/components/bookingStyles.ts",
      new Set(["searchBox"]),
    ],
    ["apps/driver/src/features/ride/components/RideRouteCard.tsx", new Set(["connector"])],
  ]);
  for (const file of roots
    .flatMap(walk)
    .filter((file) => /\.tsx?$/.test(file))) {
    const source = fs.readFileSync(file, "utf8");
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      if (
        ts.isPropertyAssignment(node) &&
        /^border(?:Top|Bottom|Left|Right|Start|End)?Width$/.test(
          node.name.getText(tree),
        )
      ) {
        const owner = node.parent.parent;
        const key = ts.isPropertyAssignment(owner)
          ? owner.name.getText(tree)
          : "";
        if (!functionalOutlines.get(file.replaceAll("\\", "/"))?.has(key)) {
          assert.equal(
            node.initializer.getText(tree),
            "0",
            `${file}: ${key} introduces a decorative border`,
          );
        }
      }
      node.forEachChild(visit);
    }
    visit(tree);
  }
});
