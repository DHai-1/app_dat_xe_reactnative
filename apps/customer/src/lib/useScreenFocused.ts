import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** true khi màn hình đang được focus (dùng để bật/tắt polling dữ liệu mới). */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
