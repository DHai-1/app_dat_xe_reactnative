import { initializePushPresentation, registerPushBackgroundHandler } from '@datxe/shared/notifications';

registerPushBackgroundHandler('CUSTOMER');
void initializePushPresentation().catch(() => {});
require('expo-router/entry');
