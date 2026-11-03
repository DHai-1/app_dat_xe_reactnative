const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
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
      require: (n) => {
        if (n in mocks) return mocks[n];
        throw Error(n);
      },
    },
  );
  return exports;
}
const platform = { OS: "android" };
platform.select = (specifics) =>
  (specifics && (specifics[platform.OS] ?? specifics.default)) ?? {};
const palette = load("packages/ui/src/theme/colors.ts", {
  "react-native": { Platform: platform },
});
let context;
const theme = load("packages/ui/src/theme/ThemeProvider.tsx", {
  "./colors": palette,
  react: {
    createContext: (value) => (context = value),
    useContext: () => context,
    useMemo: (f) => f(),
  },
  "react-native": {},
  "react/jsx-runtime": {},
});
function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value);
// Bảng màu được duyệt cố định 5 màu (#FF4757, #FFFFFF, #111111, #888888, #E0E0E0).
// Chữ nội dung chính vẫn phải đạt AA 4.5:1; màu nhấn và chữ phụ đạt 3:1 (AA cho chữ lớn/UI).
const textMinimums = {
  onSurface: 4.5,
  onSurfaceVariant: 3,
  primary: 3,
  error: 3,
  success: 4.5,
};
for (const brand of ["customer", "driver"])
  for (const dark of [false, true])
    test(`${brand} ${dark ? "dark" : "light"}: text and action tokens meet the approved contrast`, () => {
      const c = theme.getThemeColors(brand, dark);
      for (const surface of [
        c.background,
        c.surfaceContainerLowest,
        c.surfaceContainerLow,
      ])
        for (const [token, text] of Object.entries({
          onSurface: c.onSurface,
          onSurfaceVariant: c.onSurfaceVariant,
          primary: c.primary,
          error: c.error,
          success: c.success,
        })) {
          if (!isHex(surface) || !isHex(text)) continue;
          assert.ok(
            contrast(text, surface) >= textMinimums[token],
            `${token} ${text} on ${surface}: ${contrast(text, surface)}`,
          );
        }
      for (const [bg, fg] of [
        ["primary", "onPrimary"],
        ["primaryContainer", "onPrimaryContainer"],
        ["errorContainer", "onErrorContainer"],
        ["successContainer", "onSuccessContainer"],
      ]) {
        if (!isHex(c[bg]) || !isHex(c[fg])) continue;
        assert.ok(contrast(c[bg], c[fg]) >= 3, `${bg}/${fg}`);
      }
      assert.equal(Object.keys(c).length, Object.keys(palette.colors).length);
    });
test("brands have distinct primary colors and factories consume the active palette directly", () => {
  for (const dark of [false, true])
    assert.notEqual(
      theme.getThemeColors("customer", dark).primary,
      theme.getThemeColors("driver", dark).primary,
    );
  context = { colors: theme.getThemeColors("driver", true) };
  const styles = theme.useThemedStyles((c) => ({
    button: { backgroundColor: c.primary, color: c.onPrimary },
  }));
  assert.equal(styles.button.backgroundColor, context.colors.primary);
  assert.equal(styles.button.color, context.colors.onPrimary);
});
test("screens and UI components cannot introduce raw colors or static palette imports", () => {
  for (const root of [
    "apps/customer/src",
    "apps/driver/src",
    "packages/ui/src",
  ])
    for (const rel of fs
      .readdirSync(root, { recursive: true })
      .filter((f) => /\.tsx?$/.test(f))) {
      const file = root + "/" + rel;
      if (file.replaceAll("\\", "/").includes("/theme/")) continue;
      const source = fs.readFileSync(file, "utf8");
      const ast = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      function visit(n) {
        if (ts.isStringLiteral(n))
          assert.ok(
            !/^(#[0-9a-f]{3,8}|rgba?\(|white$|black$|transparent$)/i.test(
              n.text,
            ),
            `${file}: raw color ${n.text}`,
          );
        if (ts.isImportSpecifier(n) && !n.isTypeOnly)
          assert.notEqual(
            n.propertyName?.text ?? n.name.text,
            "colors",
            `${file}: static palette import`,
          );
        n.forEachChild(visit);
      }
      visit(ast);
    }
});
test("app screens use shared text/input/button/screen primitives", () => {
  for (const app of ["customer", "driver"]) {
    const root = `apps/${app}/src`;
    for (const rel of fs
      .readdirSync(root, { recursive: true })
      .filter((f) => f.endsWith(".tsx"))) {
      const file = root + "/" + rel;
      const ast = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        99,
        true,
        4,
      );
      for (const st of ast.statements)
        if (
          ts.isImportDeclaration(st) &&
          [
            "react-native",
            "react-native-gesture-handler",
            "react-native-safe-area-context",
          ].includes(st.moduleSpecifier.text) &&
          st.importClause?.namedBindings &&
          ts.isNamedImports(st.importClause.namedBindings)
        )
          for (const n of st.importClause.namedBindings.elements)
            if (!n.isTypeOnly)
              assert.ok(
                ![
                  "Text",
                  "TextInput",
                  "Button",
                  "TouchableOpacity",
                  "SafeAreaView",
                ].includes(n.propertyName?.text ?? n.name.text),
                `${file}: ${n.name.text}`,
              );
    }
  }
});
