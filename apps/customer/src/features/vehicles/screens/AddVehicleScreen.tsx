import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  Choice,
  Field,
  styles as base_styles,
} from "../components/AddVehicleScreenParts";
import { useAddVehicle } from "../hooks/useAddVehicle";
export default function AddVehicleScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    vehicleId,
    plate,
    setPlate,
    brand,
    setBrand,
    model,
    setModel,
    color,
    setColor,
    engine,
    setEngine,
    transmission,
    setTransmission,
    vehicleType,
    setVehicleType,
    photo,
    existingImages,
    deletingImageId,
    saving,
    loadingVehicle,
    loadError,
    retryVehicle,
    choosePhoto,
    removeImage,
    save,
  } = useAddVehicle();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(vehicleId ? "Sửa xe" : "Thêm xe")}
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            {i18nT(
              vehicleId
                ? "Cập nhật thông tin phương tiện trong hồ sơ của bạn."
                : "Thông tin được lưu trực tiếp vào hồ sơ phương tiện của bạn.",
            )}
          </Text>
          {loadError ? <CustomerNotice onRetry={retryVehicle}>{loadError}</CustomerNotice>
            : loadingVehicle ? <ActivityIndicator color={colors.primary} />
            : <>
              <Card style={styles.card}>
                <Field
                  label={i18nT("Biển số xe *")}
                  value={plate}
                  onChangeText={setPlate}
                  placeholder={i18nT("Ví dụ: 30A-123.45")}
                  autoCapitalize="characters"
                  maxLength={20}
                />
                <Field
                  label={i18nT("Hãng xe")}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder={i18nT("Ví dụ: Mazda")}
                  maxLength={100}
                />
                <Field
                  label={i18nT("Dòng xe")}
                  value={model}
                  onChangeText={setModel}
                  placeholder={i18nT("Ví dụ: CX-5")}
                  maxLength={100}
                />
                <Field
                  label={i18nT("Màu xe")}
                  value={color}
                  onChangeText={setColor}
                  placeholder={i18nT("Ví dụ: Trắng")}
                  maxLength={50}
                />
                <Field
                  label={i18nT("Dung tích động cơ (cc)")}
                  value={engine}
                  onChangeText={setEngine}
                  placeholder={i18nT("Không bắt buộc")}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </Card>
              <View style={styles.group}>
                <Text style={styles.label}>{i18nT("Ảnh xe (không bắt buộc)")}</Text>
                <Pressable
                  onPress={() => void choosePhoto()}
                  style={styles.photoPicker}
                >
                  {photo ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  ) : (
                    <MaterialIcons
                      name="add-a-photo"
                      size={25}
                      color={colors.primary}
                    />
                  )}
                  <Text style={styles.photoText}>
                    {i18nT(
                      photo?.fileName || "Chọn ảnh từ thư viện để tải lên khi lưu",
                    )}
                  </Text>
                </Pressable>
                {existingImages.map((image) => (
                  <View key={image.id} style={styles.existingImageRow}>
                    <Image
                      source={{ uri: image.secure_url }}
                      style={styles.photoPreview}
                    />
                    <Text style={styles.photoText}>{i18nT("Ảnh đã lưu")}</Text>
                    <Pressable
                      accessibilityLabel={i18nT("Xóa ảnh xe")}
                      disabled={deletingImageId !== null}
                      onPress={() => removeImage(image.id)}
                      style={styles.deleteImage}
                    >
                      {deletingImageId === image.id ? (
                        <ActivityIndicator color={colors.error} />
                      ) : (
                        <MaterialIcons
                          name="delete-outline"
                          size={22}
                          color={colors.error}
                        />
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
              <View style={styles.group}>
                <Text style={styles.label}>{i18nT("Loại xe")}</Text>
                <View style={styles.choices}>
                  <Choice
                    label={i18nT("Ô tô")}
                    active={vehicleType === "CAR"}
                    onPress={() => setVehicleType("CAR")}
                  />
                  <Choice
                    label={i18nT("Xe máy")}
                    active={vehicleType === "MOTORCYCLE"}
                    onPress={() => setVehicleType("MOTORCYCLE")}
                  />
                </View>
              </View>
              <View style={styles.group}>
                <Text style={styles.label}>{i18nT("Hộp số")}</Text>
                <View style={styles.choices}>
                  <Choice
                    label={i18nT("Số tự động")}
                    active={transmission === "AUTO"}
                    onPress={() => setTransmission("AUTO")}
                  />
                  <Choice
                    label={i18nT("Số sàn")}
                    active={transmission === "MANUAL"}
                    onPress={() => setTransmission("MANUAL")}
                  />
                </View>
              </View>
          </>}
        </ScrollView>
        {!loadingVehicle && !loadError ? <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={saving || loadingVehicle}
            onPress={() => void save()}
            style={[
              styles.primary,
              (saving || loadingVehicle) && styles.disabled,
            ]}
          >
            {saving || loadingVehicle ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>
                {i18nT(vehicleId ? "Cập nhật phương tiện" : "Lưu phương tiện")}
              </Text>
            )}
          </Pressable>
        </View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
