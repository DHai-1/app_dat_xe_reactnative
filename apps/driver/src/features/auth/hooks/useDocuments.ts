import { useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseUser } from "@datxe/shared";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { getDriverDocuments, getDriverProfile, getDriverSkills, submitDocument, updateDriverLicense, updateDriverSkills, uploadDocumentImage } from "../api";
import { documentExpiry, documentNumber, documentUpdate } from "../onboardingValidation";

type Draft = {
  number?: string;
  licenseClass?: string;
  years?: string;
  expiry?: string;
  vehicleType?: "CAR" | "MOTORCYCLE";
  transmission?: "AUTO" | "MANUAL";
  images?: Record<string, string>;
};

export function useDocuments(identity: boolean) {
  const client = useQueryClient();
  const router = useRouter();
  const uid = getFirebaseUser()?.uid;
  const key = ["driverDraft", "documents", uid, identity];
  const { data: draft = {} } = useQuery<Draft>({ queryKey: key, queryFn: skipToken });
  const documents = useQuery({ queryKey: ["driver", "documents"], queryFn: getDriverDocuments });
  const profile = useQuery({ queryKey: ["driver", "profile"], queryFn: getDriverProfile });
  const skills = useQuery({ queryKey: ["driver", "skills"], queryFn: getDriverSkills });
  const [source, setSource] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pickError, setPickError] = useState<{ type: string; message: string } | null>(null);
  const types = identity ? ["CCCD", "CCCD_BACK", "SELFIE"] : ["DRIVER_LICENSE", "DRIVER_LICENSE_BACK"];
  const currentDocument = documents.data?.find((doc) => doc.document_type === types[0]);
  const number = draft.number ?? currentDocument?.document_number ?? (identity ? "" : profile.data?.license_number ?? "");
  const licenseClass = draft.licenseClass ?? profile.data?.license_class ?? "";
  const years = draft.years ?? (profile.data?.years_of_experience == null ? "" : String(profile.data.years_of_experience));
  const expiry = draft.expiry ?? currentDocument?.expires_at ?? "";
  const vehicleType = draft.vehicleType ?? skills.data?.[0]?.vehicle_type ?? "CAR";
  const transmission = draft.transmission ?? skills.data?.[0]?.transmission ?? "AUTO";
  const images = draft.images ?? {};
  const update = (fields: Partial<Draft>) => {
    if (uid && getFirebaseUser()?.uid === uid) client.setQueryData<Draft>(key, (current) => ({ ...current, ...fields }));
  };

  const pick = async (type: string, camera: boolean) => {
    setSource(null);
    setPicking(type);
    setPickError(null);
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted)
        throw new Error("Cần cấp quyền camera để chụp giấy tờ.");
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.85 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (!result.canceled && asset) update({ images: { ...images, [type]: asset.uri } });
    } catch (error) {
      setPickError({ type, message: error instanceof Error ? error.message : "Không mở được ảnh." });
    } finally {
      setPicking(null);
    }
  };

  const requireAccount = () => {
    if (!uid || uid !== getFirebaseUser()?.uid) throw new Error("Phiên đăng nhập đã thay đổi.");
  };
  const save = useMutation({
    mutationFn: async () => {
      requireAccount();
      const num = documentNumber(number, identity);
      const expires = documentExpiry(expiry);
      if (!documents.data || !profile.data || (!identity && !skills.data)) throw new Error("Chưa tải được hồ sơ. Hãy thử lại.");
      if (!identity && (!licenseClass.trim() || licenseClass.length > 10 || !/^\d+$/.test(years) || !Number.isSafeInteger(Number(years))))
        throw new Error("Nhập hạng bằng và số năm kinh nghiệm hợp lệ.");
      for (const type of types) {
        if (!images[type] && !documents.data.some((doc) => doc.document_type === type)) throw new Error("Cần đủ ảnh giấy tờ trước khi gửi.");
      }

      const submitted = [];
      try {
        for (const type of types) {
          requireAccount();
          const current = documents.data.find((doc) => doc.document_type === type);
          if (images[type]) setUploading(type);
          const uploaded = images[type] ? await uploadDocumentImage(images[type]) : undefined;
          requireAccount();
          const body = documentUpdate(type, num, identity ? null : expires, current, uploaded);
          if (body) {
            submitted.push(await submitDocument(body));
            if (uploaded) {
              client.setQueryData<Draft>(key, (previous) => {
                if (!previous?.images || getFirebaseUser()?.uid !== uid) return previous;
                const remaining = { ...previous.images };
                delete remaining[type];
                return { ...previous, images: remaining };
              });
            }
          }
        }
      } finally {
        setUploading(null);
      }
      requireAccount();
      if (!identity && skills.data) {
        const normalizedClass = licenseClass.trim().toUpperCase();
        await updateDriverLicense({ license_number: num, license_class: normalizedClass, years_of_experience: Number(years),
          license_image_url: submitted.find((doc) => doc?.document_type === "DRIVER_LICENSE")?.secure_url ?? currentDocument?.secure_url ?? profile.data.license_image_url });
        requireAccount();
        const next = skills.data.map(({ vehicle_type, transmission, license_class }) => ({ vehicle_type, transmission, license_class }));
        if (!next.some((skill) => skill.vehicle_type === vehicleType && skill.transmission === transmission && skill.license_class === normalizedClass))
          next.push({ vehicle_type: vehicleType, transmission, license_class: normalizedClass });
        await updateDriverSkills(next);
      }
    },
    onSuccess: async () => {
      if (getFirebaseUser()?.uid !== uid) return;
      await client.invalidateQueries({ queryKey: ["driver"] });
      client.setQueryData<Draft>(key, {});
      if (getFirebaseUser()?.uid === uid) router.push(identity ? "/(auth)/approval-status" : "/(auth)/verify-id");
    },
    onError: () => client.invalidateQueries({ queryKey: ["driver", "documents"] }),
  });

  return {
    documents, profile, skills, number, licenseClass, years, expiry, vehicleType, transmission, types, images,
    update, source, setSource, picking, pick, pickError, uploading, save,
    error: save.error?.message || documents.error?.message || profile.error?.message || skills.error?.message,
  };
}
