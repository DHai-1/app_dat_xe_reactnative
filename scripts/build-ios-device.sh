#!/usr/bin/env bash
# Build iOS DEVICE unsigned .ipa for customer or driver — chạy trên macOS + Xcode 16.
# Dùng cho sideload qua Sideloadly (Apple ID free, không cần $99).
#
# Usage:  ./scripts/build-ios-device.sh customer
#         ./scripts/build-ios-device.sh driver
#
# Yêu cầu: Xcode (16.x càng tốt), Node 22, CocoaPods.
# Driver: export RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.... trước khi chạy.
set -euo pipefail

APP="${1:-customer}"
if [ "$APP" != "customer" ] && [ "$APP" != "driver" ]; then
  echo "Usage: $0 customer|driver" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/$APP"

echo "==> [1/5] Expo prebuild ($APP)"
npx expo prebuild --platform ios --clean

echo "==> [2/5] CocoaPods ($APP)"
cd ios
pod install

echo "==> [3/5] Detect workspace/scheme"
WORKSPACE="$(ls -d *.xcworkspace | head -1)"
SCHEME="$(xcodebuild -workspace "$WORKSPACE" -list -json | python3 -c 'import sys,json;print(json.load(sys.stdin)["workspace"]["schemes"][0])')"
echo "    workspace=$WORKSPACE scheme=$SCHEME"

echo "==> [4/5] xcodebuild -sdk iphoneos CODE_SIGNING_ALLOWED=NO"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  build

echo "==> [5/5] Package .ipa"
APP_PATH="$(find build/Build/Products -maxdepth 2 -name '*.app' -type d | head -1)"
if [ -z "$APP_PATH" ]; then
  echo "ERROR: không tìm thấy .app trong build/Build/Products" >&2
  exit 1
fi
rm -rf Payload
mkdir -p Payload
cp -R "$APP_PATH" Payload/
rm -f "$APP.ipa"
zip -qr "$APP.ipa" Payload
echo "==> DONE: $ROOT/apps/$APP/ios/$APP.ipa"
