const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
function flatten(style) {
  return Array.isArray(style)
    ? Object.assign({}, ...style.map(flatten))
    : style || {};
}
const exportsObject = {};
class Value {
  constructor(value) {
    this.value = value;
  }
  stopAnimation() {}
  setValue(value) {
    this.value = value;
  }
}
const mocks = {
  react: {
    useState: (initial) => [
      typeof initial === "function" ? initial() : initial,
      () => {},
    ],
    useEffect: () => {},
  },
  "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
  "react-native": {
    Animated: {
      Value,
      createAnimatedComponent: () => "AnimatedPressable",
      timing: () => ({ start() {} }),
    },
    Easing: { out: (x) => x, cubic: 0 },
    Platform: { OS: "web" },
    Pressable: "Pressable",
    StyleSheet: { flatten },
  },
  "../motion": { useReducedMotion: () => true },
  "../useLanguage": { useLanguage: () => {} },
};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("packages/ui/src/components/MotionPressable.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText,
  { exports: exportsObject, require: (name) => mocks[name] },
);
test("animated actions pass a resolved style so web retains layout and button background", () => {
  const onPress = () => {};
  const node = exportsObject.MotionPressable({
    onPress,
    style: () => ({
      minHeight: 52,
      backgroundColor: "test-token",
      transform: [{ translateY: 8 }],
    }),
  });
  assert.equal(node.props.onPress, onPress);
  assert.notEqual(typeof node.props.style, "function");
  const style = flatten(node.props.style);
  assert.equal(style.backgroundColor, "test-token");
  assert.equal(style.minHeight, 52);
  assert.equal(style.transform[0].translateY, 8);
  assert.equal(style.transform[1].scale.value, 1);
});
test("disabled actions preserve disabled state and do not resolve a pressed style", () => {
  const node = exportsObject.MotionPressable({
    disabled: true,
    style: (state) => ({ opacity: state.pressed ? 0.8 : 0.5 }),
  });
  assert.equal(node.props.disabled, true);
  assert.equal(flatten(node.props.style).opacity, 0.5);
});
