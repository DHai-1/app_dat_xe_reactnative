import { OtpVerificationScreen } from "@datxe/ui";
import { useOtpVerify } from "../hooks/useOtpVerify";
export default function DriverOtpVerifyScreen() {
  const { phone, router } = useOtpVerify();
  if (!phone) return null;
  return (
    <OtpVerificationScreen
      phone={phone}
      onHelp={() => router.push("/(auth)/login-help")}
      onHome={() => router.replace("/(tabs)/home" as never)}
      onLogin={() => router.replace("/(auth)/login" as never)}
      onRegister={(verifiedPhone) =>
        router.replace({
          pathname: "/(auth)/register",
          params: { phone: verifiedPhone },
        } as never)
      }
      role="driver"
    />
  );
}
