export const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} đ`;
export const formatDate = (value: string | Date) => new Date(value).toLocaleString('vi-VN');
export const formatDistance = (km: number, locale = 'vi-VN') => `${km.toLocaleString(locale, { maximumFractionDigits: 1 })} km`;
