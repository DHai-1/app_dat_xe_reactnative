const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;
  const plugins = [
    ...(config.plugins ?? []),
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    '@rnmapbox/maps',
    'expo-status-bar',
    '../../packages/config/plugins/with-short-cmake-paths',
    ['../../packages/config/plugins/with-team-dev-signing', {
      keystoreFile: 'team-dev-customer.jks',
      keyAlias: 'team-dev-customer',
    }],
    [
      'expo-build-properties',
      {
        android: { kotlinVersion: '2.4.0' },
        ios: { useFrameworks: 'static' },
      },
    ],
  ];

  if (facebookAppId && facebookClientToken) {
    plugins.push([
      'react-native-fbsdk-next',
      {
        appID: facebookAppId,
        clientToken: facebookClientToken,
        displayName: config.name,
        scheme: `fb${facebookAppId}`,
        // This library defaults auto-initialization to false; AccessTokenTracker requires it.
        isAutoInitEnabled: true,
        autoLogAppEventsEnabled: false,
        advertiserIDCollectionEnabled: false,
      },
    ]);
  }

  const googleServicesFile = path.join(__dirname, 'google-services.json');
  const googleServiceInfoFile = path.join(__dirname, 'GoogleService-Info.plist');

  return {
    ...config,
    android: {
      ...config.android,
      ...(fs.existsSync(googleServicesFile) ? { googleServicesFile: './google-services.json' } : {}),
    },
    ios: {
      ...config.ios,
      ...(fs.existsSync(googleServiceInfoFile) ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
    plugins,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? null,
      facebookAppId: facebookAppId ?? null,
    },
  };
};
