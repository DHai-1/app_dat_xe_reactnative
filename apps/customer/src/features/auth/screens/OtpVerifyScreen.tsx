import { OtpVerificationScreen, useLanguage } from "@datxe/ui";
import { useOtpVerify } from "../hooks/useOtpVerify";
export default function CustomerOtpVerifyScreen() {
  useLanguage();

  const { phone, router } = useOtpVerify();
  if (!phone) return null;
  return (
    <OtpVerificationScreen
      phone={phone}
      onHome={() => router.replace("/(tabs)/home" as never)}
      onLogin={() => router.replace("/(auth)/login" as never)}
      onRegister={(verifiedPhone) =>
        router.replace({
          pathname: "/(auth)/register",
          params: { phone: verifiedPhone },
        } as never)
      }
      role="customer"
    />
  );
}
