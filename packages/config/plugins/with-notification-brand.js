const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

// Expo and Firebase both declare a default notification color. Prefer the app's brand color.
module.exports = function withNotificationBrand(config) {
  return withAndroidManifest(config, mod => {
    mod.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const metadata = application['meta-data'] ??= [];
    let color = metadata.find(item => item.$['android:name'] === 'com.google.firebase.messaging.default_notification_color');
    if (!color) {
      color = { $: {
        'android:name': 'com.google.firebase.messaging.default_notification_color',
        'android:resource': '@color/notification_icon_color',
      } };
      metadata.push(color);
    }
    const replacements = new Set((color.$['tools:replace'] ?? '').split(',').filter(Boolean));
    replacements.add('android:resource');
    color.$['tools:replace'] = [...replacements].join(',');
    return mod;
  });
};
