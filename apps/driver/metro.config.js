const { getDefaultConfig } = require('expo/metro-config');
const withSentryRouterCompat = require('../../packages/config/metro-sentry-compat.cjs');
const withMapLibreWorker = require('../../packages/config/with-maplibre-worker.cjs');
withMapLibreWorker(__dirname);
module.exports = withSentryRouterCompat(getDefaultConfig(__dirname));
