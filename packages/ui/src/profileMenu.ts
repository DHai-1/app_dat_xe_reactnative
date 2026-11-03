import type { ProfileScreenMenuItem,ProfileScreenMenuTone } from './types';
export const ProfileScreenSERVICE_SECTION: ProfileScreenMenuItem[] = [
  {
    id: 'vehicles',
    icon: 'directions-car',
    tone: 'primary',
    title: 'Xe của tôi',
    subtitle: '',
    
    route: '/vehicles',
  },
  {
    id: 'vouchers',
    icon: 'confirmation-number',
    tone: 'tertiary',
    title: 'Ưu đãi của tôi',
    subtitle: '',
    
    route: '/vouchers',
  },
  {
    id: 'payments',
    icon: 'account-balance-wallet',
    tone: 'secondary',
    title: 'Phương thức thanh toán',
    subtitle: '',
  },
];
export const ProfileScreenSUPPORT_SECTION: ProfileScreenMenuItem[] = [
  {
    id: 'help',
    icon: 'support-agent',
    tone: 'high',
    title: 'Trợ giúp chuyến đi',
    subtitle: 'Trạng thái, lịch sử và tin nhắn với tài xế',
  },
  {
    id: 'safety',
    icon: 'shield',
    tone: 'primary',
    title: 'An toàn chuyến đi',
    subtitle: 'Theo dõi chuyến và xem biên bản bàn giao',
  },
];
export const ProfileScreenTONE_STYLES: Record<ProfileScreenMenuTone, { box: string; icon: string }> = {
  primary: { box: 'primaryFixed', icon: 'primary' },
  tertiary: { box: 'tertiaryFixed', icon: 'tertiary' },
  secondary: { box: 'secondaryFixed', icon: 'onSurface' },
  high: { box: 'surfaceContainerHigh', icon: 'primary' },
  error: { box: 'errorContainer', icon: 'error' },
};
