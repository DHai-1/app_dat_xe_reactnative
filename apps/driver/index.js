import { initializePushPresentation, registerPushBackgroundHandler } from '@datxe/shared/notifications';

registerPushBackgroundHandler('DRIVER');
void initializePushPresentation().catch(() => {});
require('expo-router/entry');
