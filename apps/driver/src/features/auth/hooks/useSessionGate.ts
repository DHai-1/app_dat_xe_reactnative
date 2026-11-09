import { useSessionStore } from "@/lib/store";
import { AuthApiError, authenticateWithBackend } from "@datxe/shared";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { useEffect, useState } from "react";

export function useSessionGate() {
  const [destination, setDestination] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const timer = setTimeout(() => { if (active) setWaiting(true); }, 8000);
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const version = ++generation;
      if (!user) {
        setDestination("/(auth)/login");
        return;
      }

      void authenticateWithBackend("driver", user).then((profile) => {
        if (!active || version !== generation) return;
        useSessionStore.getState().setUser(profile);
        setDestination(profile.role === "DRIVER" ? "/(tabs)/home" : "/(auth)/login");
      }).catch((cause: unknown) => {
        if (!active || version !== generation) return;
        const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
        if (cause instanceof AuthApiError && code === "ACCOUNT_NOT_FOUND") {
          setDestination("/(auth)/register");
        } else if (["NETWORK_ERROR", "auth/network-request-failed"].includes(code)) {
          setError("Không kết nối được với máy chủ. Kiểm tra mạng rồi thử lại.");
        } else if (["HTTP_401", "UNAUTHORIZED", "INVALID_TOKEN", "auth/user-token-expired", "auth/invalid-user-token"].includes(code)) {
          setError("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
        } else {
          setError(cause instanceof AuthApiError && !["INVALID_SERVER_RESPONSE", "HTTP_503"].includes(code)
            ? cause.message : "Chưa khôi phục được phiên. Hãy thử lại.");
        }
      });
    });
    return () => { active = false; clearTimeout(timer); unsubscribe(); };
  }, [attempt]);

  const retry = () => {
    setError("");
    setWaiting(false);
    setAttempt((current) => current + 1);
  };
  return { destination, error, waiting, retry };
}
