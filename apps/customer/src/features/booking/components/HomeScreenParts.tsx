import type {
  CustomerRideDetail,
  CustomerRideSummary,
  CustomerVoucher,
} from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { borderRadius, fontWeight, shadowStyle, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const promoImage = require("@/assets/5._trang_ch/promo.jpg");

export function getGreeting(hour: number): string {
  if (hour < 11) return i18nT("Chào buổi sáng");
  if (hour < 18) return i18nT("Chào buổi chiều");
  return i18nT("Chào buổi tối");
}

export function getRecentDestinations(rides: CustomerRideSummary[]): string[] {
  const addresses = new Map<string, string>();
  for (const ride of rides) {
    if (["CANCELLED", "NO_DRIVER_FOUND", "EXPIRED"].includes(ride.status))
      continue;
    const address = ride.dropoffAddress?.trim();
    if (address) addresses.set(address.toLocaleLowerCase(getLocale()), address);
  }
  return [...addresses.values()].slice(0, 3);
}

export function getRideStatusLabel(
  status: CustomerRideDetail["status"],
): string {
  const labels: Record<CustomerRideDetail["status"], string> = {
    PENDING: "Đang chờ xử lý",
    SEARCHING: "Đang tìm tài xế",
    DRIVER_ASSIGNED: "Đã có tài xế",
    DRIVER_ARRIVING: "Tài xế đang tới điểm đón",
    DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
    VEHICLE_HANDOVER: "Đang bàn giao xe",
    IN_PROGRESS: "Chuyến đi đang diễn ra",
    ARRIVED_DESTINATION: "Đã đến điểm trả xe",
    VEHICLE_RETURNED: "Đang hoàn tất bàn giao",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
    NO_DRIVER_FOUND: "Chưa tìm được tài xế",
    EXPIRED: "Yêu cầu đã hết hạn",
  };
  return labels[status];
}

export function formatCurrency(amount: number): string {
  return i18nT("{0}đ", {
    "0": new Intl.NumberFormat(getLocale()).format(amount),
  });
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(getLocale()).format(date);
}

export function describeVoucher(voucher: CustomerVoucher): string {
  if (voucher.discountType === "PERCENT") {
    const cap =
      voucher.maxDiscount === null
        ? ""
        : i18nT(", tối đa {0}", { "0": formatCurrency(voucher.maxDiscount) });
    return i18nT("Giảm {0}%{1} cho chuyến đi", {
      "0": voucher.value,
      "1": cap,
    });
  }
  if (voucher.discountType === "FIXED") {
    return i18nT("Giảm {0} cho chuyến đi", {
      "0": formatCurrency(voucher.value),
    });
  }
  return i18nT("Ưu đãi dành cho chuyến đi của bạn");
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : i18nT("Không tải được dữ liệu từ máy chủ.");
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Hero coral bo góc dưới, chứa lời chào và vị trí hiện tại.
    hero: {
      backgroundColor: colors.primaryContainer,
      borderBottomLeftRadius: borderRadius.xl,
      borderBottomRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceXl + spacing.spaceLg,
      gap: spacing.spaceXs,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.spaceSm,
    },
    heroGreeting: {
      ...typography.headlineLg,
      color: colors.onPrimaryContainer,
      flex: 1,
    },
    heroSafety: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.onPrimary20,
    },
    heroLocation: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1_5,
      alignSelf: "flex-start",
      minHeight: 32,
    },
    heroLocationText: {
      ...typography.titleMd,
      color: colors.onPrimaryContainer,
      flexShrink: 1,
    },

    // Thẻ tìm điểm đến nổi, chồng lên đáy hero.
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.px3,
      marginHorizontal: spacing.margin,
      padding: spacing.px3_5,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    searchIconTile: {
      width: spacing.iconButtonMd,
      height: spacing.iconButtonMd,
      borderRadius: borderRadius.xl,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryTint,
    },
    searchCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.py0_5,
    },
    searchTitle: {
      ...typography.titleMd,
      color: colors.onSurface,
    },
    searchSubtitle: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },

    content: {
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceLg + spacing.spaceXs,
      paddingBottom: spacing.spaceXl,
      gap: spacing.spaceLg + spacing.spaceXs,
    },
    section: {
      gap: spacing.spaceMd,
    },

    // Bản đồ phủ toàn màn hình; header, ô tìm kiếm và nút mục tiêu nổi phía trên.
    body: { flex: 1 },
    hidden: { opacity: 0 },
    // Bản đồ phủ từ (đáy header - bán kính bo góc) xuống sát tab bar.
    mapLayer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    searchLayer: {
      position: "absolute",
      left: 0,
      right: 0,
      gap: spacing.spaceSm,
    },
    bottomLayer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: spacing.margin,
      paddingHorizontal: spacing.margin,
      gap: spacing.px3,
    },
    locateRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    locateButton: {
      width: spacing.iconButtonLg + spacing.spaceSm,
      height: spacing.iconButtonLg + spacing.spaceSm,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    alertPill: {
      alignSelf: "flex-start",
      marginHorizontal: spacing.margin,
      paddingHorizontal: spacing.px3_5,
      paddingVertical: spacing.px2_5,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    alertText: {
      ...typography.labelSm,
      color: colors.error,
    },
    tripRoute: {
      ...typography.bodyMd,
      color: colors.onSurface,
    },

    loading: {
      paddingVertical: spacing.spaceLg,
      alignItems: "center",
    },
    loadError: {
      ...typography.bodyMd,
      color: colors.error,
    },

    // Chuyến đang hoạt động.
    tripCard: {
      gap: spacing.px3,
      overflow: "hidden",
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    tripAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: spacing.accentBar,
      backgroundColor: colors.primaryContainer,
    },
    tripStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
      marginTop: spacing.spaceXs,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1_5,
      paddingHorizontal: spacing.px2_5,
      paddingVertical: spacing.py1,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryTint,
      flexShrink: 1,
    },
    statusDot: {
      width: spacing.badgeSm,
      height: spacing.badgeSm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    statusText: {
      ...typography.labelMd,
      color: colors.primary,
    },
    tripCode: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    pickupBox: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: borderRadius.xl,
      padding: spacing.px3,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
    },
    pickupCopy: {
      flex: 1,
      minWidth: 0,
    },
    pickupLabel: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    pickupValue: {
      ...typography.bodyMdMedium,
      color: colors.onSurface,
    },
    rideFareRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing.spaceXs,
    },
    rideFareValue: {
      ...typography.titleLg,
      color: colors.primary,
      fontWeight: fontWeight.bold,
    },
    tripAction: {
      width: "100%",
      height: spacing.buttonPillHeight,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryContainer,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
    },
    tripActionText: {
      ...typography.labelLg,
      color: colors.onPrimaryContainer,
    },

    // Điểm đến gần đây.
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      ...typography.titleMd,
      color: colors.onSurface,
    },
    recentHint: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    recentSection: {
      gap: spacing.spaceSm,
    },
    recentDestination: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.px3,
      minHeight: 56,
      paddingHorizontal: spacing.px3_5,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
    },
    recentDestinationIcon: {
      width: spacing.iconButtonSm - spacing.px1_5,
      height: spacing.iconButtonSm - spacing.px1_5,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryTint,
    },
    recentDestinationText: {
      ...typography.bodyMdMedium,
      flex: 1,
      color: colors.onSurface,
    },

    // Ưu đãi.
    promoCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.px3,
      backgroundColor: colors.transparent,
    },
    promoCopy: {
      flex: 1,
      gap: spacing.gap1_5,
    },
    promoBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1,
      paddingHorizontal: spacing.px2,
      paddingVertical: spacing.py0_5,
      borderRadius: borderRadius.full,
      backgroundColor: colors.tertiaryFixed,
    },
    promoBadgeText: {
      ...typography.labelSm,
      color: colors.onTertiaryFixed,
    },
    promoTitle: {
      ...typography.bodyLgMedium,
      color: colors.onSurface,
    },
    promoMeta: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    promoImage: {
      width: spacing.promoImage,
      height: spacing.promoImage,
      borderRadius: borderRadius.xl,
    },

    // Tương thích các key cũ còn được tham chiếu từ hook/màn khác.
    greetingCard: { gap: spacing.spaceSm },
    greetingCopy: { gap: spacing.spaceXs },
    greetingTitle: { ...typography.headlineMd, color: colors.onSurface },
    greetingMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    greetingLocation: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
    },
    locationBadge: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryTint,
    },
    locationCopy: { flex: 1, minWidth: 0 },
    locationLabel: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      letterSpacing: spacing.letterSpacingWide,
    },
    currentLocation: { ...typography.labelMd, color: colors.onSurface },
    locationRefresh: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLow,
    },
    notifWrap: { position: "relative" },
    notifButton: {
      width: spacing.iconButtonLg,
      height: spacing.iconButtonLg,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    notifDot: {
      position: "absolute",
      top: spacing.spaceSm,
      right: spacing.spaceSm,
      width: spacing.badgeMd,
      height: spacing.badgeMd,
      borderRadius: borderRadius.full,
      backgroundColor: colors.error,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      height: spacing.searchBarHeight,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.spaceMd,
      gap: spacing.spaceSm,
    },
    searchPlaceholder: {
      ...typography.bodyLgMedium,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    driverRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceMd,
    },
    driverInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      flex: 1,
      minWidth: 0,
    },
    driverAvatarWrap: { width: spacing.avatarLg, height: spacing.avatarLg },
    driverAvatar: {
      width: spacing.avatarLg,
      height: spacing.avatarLg,
      borderRadius: borderRadius.full,
    },
    verifiedBadge: {
      position: "absolute",
      bottom: -spacing.spaceXs,
      right: -spacing.spaceXs,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.full,
      padding: spacing.py0_5,
    },
    driverCopy: { flex: 1, minWidth: 0 },
    driverNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1_5,
    },
    driverName: {
      ...typography.bodyLgMedium,
      color: colors.onSurface,
      flexShrink: 1,
    },
    ratingPill: {
      backgroundColor: colors.tertiaryFixed,
      paddingHorizontal: spacing.gap1_5,
      paddingVertical: spacing.py0_5,
      borderRadius: borderRadius.full,
    },
    ratingText: { ...typography.labelSm, color: colors.onTertiaryFixed },
    driverMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    callButton: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
    },
    promoButton: {
      alignSelf: "flex-start",
      height: spacing.promoButtonHeight,
      paddingHorizontal: spacing.spaceMd,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.py1,
    },
    promoButtonText: { ...typography.labelSm, color: colors.onPrimaryContainer },
    reassurance: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
      paddingVertical: spacing.spaceXs,
      opacity: spacing.footerOpacity,
    },
    reassuranceText: { ...typography.labelSm, color: colors.onSurfaceVariant },
    tabBar: {
      height: spacing.tabBarHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: spacing.spaceXs,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    tabItem: {
      flex: 1,
      height: "100%",
      minWidth: spacing.iconButtonMd,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.gap1,
    },
    tabLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
    tabLabelActive: {
      ...typography.labelSm,
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    tabDot: {
      position: "absolute",
      top: 0,
      right: 0,
      width: spacing.badgeSm,
      height: spacing.badgeSm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surfaceContainerLowest,
    },
  });
