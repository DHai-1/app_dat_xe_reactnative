import { ActivityIndicator, Divider, IconButton } from "react-native-paper";
import { CustomerTabBar } from "@/components/CustomerTabBar";
import {
  HEADER_SAFETY_ACTION_WIDTH,
  HeaderLabeledIconButton,
  ScreenHeader,
} from "@/components/ScreenHeader";
import {
  getCustomerDisplayName,
  getCustomerInitials,
} from "@/lib/customerName";
import { useTranslation } from "@/lib/settings/i18n";
import { translate as i18nT, signOutFirebase } from "@datxe/shared";
import type { ProfileScreenMenuItem } from "@datxe/ui";
import {
  Card,
  GroupedList,
  SettingsListItem,
  SectionHeading,
  fontSize,
  localizedAlert,
  MotionPressable as Pressable,
  ProfileScreenSUPPORT_SECTION,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Modal, ScrollView, View } from "react-native";

import {
  getApiErrorMessage,
  makeStyles,
} from "../components/ProfileScreenParts";
import { useProfile } from "../hooks/useProfile";
export default function ProfileScreen() {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const t = useTranslation();
  const {
    router,
    profile,
    unreadCount,
    loading,
    loadError,
    refresh,
    logoutVisible,
    setLogoutVisible,
    deleteVisible,
    setDeleteVisible,
    deletingAccount,
    deleteError,
    setDeleteError,
    uploadingAvatar,
    openEdit,
    changeAvatar,
    confirmDeleteAccount,
    profileStats,
    serviceItems,
  } = useProfile();
  const renderMenuItem = (item: ProfileScreenMenuItem) => {
    return (
      <SettingsListItem
        key={item.id}
        title={t(item.title)}
        description={item.subtitle}
        icon={item.icon}
        onPress={() => {
          if (item.route) router.push(item.route as never);
          else if (item.id === "payments") router.push("/payment-methods");
          else if (item.id === "help")
            router.push({ pathname: "/support", params: { topic: "help" } });
          else if (item.id === "safety")
            router.push({ pathname: "/support", params: { topic: "safety" } });
        }}
        right={
          item.badge ? (
            <Text
              style={[
                styles.menuBadgeText,
                item.badge.highlighted && styles.menuBadgeTextHighlighted,
              ]}
            >
              {i18nT(item.badge.label)}
            </Text>
          ) : undefined
        }
      />
    );
  };
  const renderMenuGroup = (items: readonly ProfileScreenMenuItem[]) => (
    <GroupedList>{items.map(renderMenuItem)}</GroupedList>
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(t("Hồ sơ"))}
        largeTitle
        sideSlotWidth={HEADER_SAFETY_ACTION_WIDTH}
        rightContent={
          <HeaderLabeledIconButton
            icon="shield"
            accessibilityLabel={i18nT("An toàn chuyến đi")}
            label={i18nT("An toàn")}
            onPress={() =>
              router.push({ pathname: "/support", params: { topic: "safety" } })
            }
          />
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && !profile ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {loadError ? (
          <Pressable onPress={() => void refresh()} style={styles.loadErrorBox}>
            <Text accessibilityRole="alert" style={styles.loadErrorText}>
              {i18nT(loadError)}
            </Text>
            <Text style={styles.retryText}>{i18nT("Chạm để thử lại")}</Text>
          </Pressable>
        ) : null}

        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Thay đổi ảnh đại diện")}
              disabled={uploadingAvatar || !profile}
              onPress={() => void changeAvatar()}
              style={styles.avatarWrap}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>
                    {getCustomerInitials(profile?.full_name)}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <MaterialIcons
                    name="photo-camera"
                    size={fontSize.iconSm}
                    color={colors.onPrimary}
                  />
                )}
              </View>
            </Pressable>
            <View style={styles.identityCopy}>
              <Text style={styles.userName} numberOfLines={2}>
                {getCustomerDisplayName(profile?.full_name) ||
                  i18nT("Khách hàng")}
              </Text>
              {profile?.phone_number ? (
                <Text style={styles.userPhone}>{profile.phone_number}</Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  style={{ minHeight: 48, minWidth: 48, justifyContent: "center" }}
                  onPress={() =>
                    router.push("/(auth)/add-phone-number" as never)
                  }
                >
                  <Text style={styles.phoneLink}>
                    {i18nT("Thêm số điện thoại")}
                  </Text>
                </Pressable>
              )}
              <Text style={styles.userEmail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {i18nT(profile?.email || "Chưa cập nhật email")}
              </Text>
            </View>
            <IconButton
              icon="pencil-outline"
              mode="contained-tonal"
              size={20}
              iconColor={colors.primary}
              accessibilityLabel={i18nT("Chỉnh sửa thông tin")}
              disabled={!profile}
              onPress={openEdit}
              style={styles.editButton}
            />
          </View>
          <Divider style={styles.identityDivider} />
          <View style={styles.statsGrid}>
            {profileStats.map((stat) => (
              <View key={stat.id} style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    stat.tone === "primary" && styles.statValuePrimary,
                    stat.tone === "tertiary" && styles.statValueTertiary,
                  ]}
                >
                  {i18nT(stat.value)}
                </Text>
                <Text style={styles.statLabel}>{i18nT(t(stat.label))}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeading title="Dịch vụ & Xe" />
          {renderMenuGroup(serviceItems)}
        </View>

        <View style={styles.section}>
          <SectionHeading title="Hỗ trợ & An toàn" />
          {renderMenuGroup(ProfileScreenSUPPORT_SECTION)}
        </View>

        <View style={styles.section}>
          <SectionHeading title="Cài đặt" />
          <Card style={styles.menuGroup}>
            {renderMenuItem({
              id: "settings",
              title: "Cài đặt",
              subtitle: "Giao diện, quyền và tùy chọn ứng dụng",
              icon: "settings",
              tone: "primary",
              route: "/settings",
            })}
            <View style={styles.rowDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Đăng xuất")}
              onPress={() => setLogoutVisible(true)}
              style={styles.logoutRow}
            >
              <MaterialIcons
                name="logout"
                size={fontSize.iconLg}
                color={colors.primary}
              />
              <Text style={styles.logoutRowText}>{i18nT("Đăng xuất")}</Text>
            </Pressable>
            <View style={styles.rowDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Xóa tài khoản")}
              onPress={() => {
                setDeleteError("");
                setDeleteVisible(true);
              }}
              style={styles.logoutRow}
            >
              <MaterialIcons
                name="delete-outline"
                size={fontSize.iconLg}
                color={colors.primary}
              />
              <Text style={styles.logoutRowText}>{i18nT("Xóa tài khoản")}</Text>
            </Pressable>
          </Card>
        </View>
        <View style={styles.footer}>
          <View style={styles.legalLinks}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/terms-of-service" as never)}
            >
              <Text style={styles.legalLinkText}>
                {i18nT("Điều khoản dịch vụ")}
              </Text>
            </Pressable>
            <Text style={styles.legalSeparator}>·</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/privacy-policy" as never)}
            >
              <Text style={styles.legalLinkText}>
                {i18nT("Chính sách bảo mật")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <CustomerTabBar active="profile" unreadCount={unreadCount} />

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) setDeleteVisible(false);
        }}
        transparent
        visible={deleteVisible}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.deleteDialogCard}>
            <View style={styles.dialogIcon}>
              <MaterialIcons
                name="delete-outline"
                size={fontSize.icon2xl}
                color={colors.error}
              />
            </View>
            <Text style={styles.dialogTitle}>{i18nT("Xóa tài khoản?")}</Text>
            <Text style={styles.deleteDialogText}>
              {i18nT(
                "Hồ sơ sẽ được ẩn danh; số điện thoại, ảnh đại diện và ảnh xe sẽ được xóa. Lịch sử chuyến vẫn được giữ lại. Bạn không thể hoàn tác thao tác này.",
              )}
            </Text>
            <Text style={styles.deleteDialogText}>
              {i18nT("Không thể xóa khi bạn còn chuyến chưa kết thúc.")}
            </Text>
            {deleteError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {i18nT(deleteError)}
              </Text>
            ) : null}
            <View style={styles.dialogActions}>
              <Pressable
                disabled={deletingAccount}
                onPress={() => setDeleteVisible(false)}
                style={[styles.dialogButton, styles.dialogButtonGhost]}
              >
                <Text style={styles.dialogButtonGhostText}>
                  {i18nT("Giữ tài khoản")}
                </Text>
              </Pressable>
              <Pressable
                disabled={deletingAccount}
                onPress={() => void confirmDeleteAccount()}
                style={[
                  styles.dialogButton,
                  styles.deleteConfirmButton,
                  deletingAccount && styles.buttonDisabled,
                ]}
              >
                {deletingAccount ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.dialogButtonPrimaryText}>
                    {i18nT("Xóa tài khoản")}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setLogoutVisible(false)}
        transparent
        visible={logoutVisible}
      >
        <Pressable
          onPress={() => setLogoutVisible(false)}
          style={styles.dialogOverlay}
        >
          <Pressable style={styles.dialogCard}>
            <View style={styles.dialogIcon}>
              <MaterialIcons
                name="logout"
                size={fontSize.icon2xl}
                color={colors.error}
              />
            </View>
            <View style={styles.dialogCopy}>
              <Text style={styles.dialogTitle}>
                {i18nT("Bạn có chắc muốn đăng xuất?")}
              </Text>
              <Text style={styles.dialogMeta}>
                {i18nT(
                  "Thông tin chuyến đi và voucher đang lưu sẽ vẫn an toàn khi bạn đăng nhập lại.",
                )}
              </Text>
            </View>
            <View style={styles.dialogActions}>
              <Pressable
                onPress={() => setLogoutVisible(false)}
                style={[styles.dialogButton, styles.dialogButtonGhost]}
              >
                <Text style={styles.dialogButtonGhostText}>
                  {i18nT("Ở lại")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void signOutFirebase()
                    .then(() => {
                      setLogoutVisible(false);
                      router.replace("/(auth)/login" as never);
                    })
                    .catch((error: unknown) =>
                      localizedAlert(
                        i18nT("Không thể đăng xuất"),
                        getApiErrorMessage(error),
                      ),
                    );
                }}
                style={[styles.dialogButton, styles.dialogButtonDanger]}
              >
                <Text style={styles.dialogButtonDangerText}>
                  {i18nT("Đăng xuất")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
