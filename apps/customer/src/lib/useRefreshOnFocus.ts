import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

/**
 * Gọi `refetch` mỗi lần màn hình được focus lại (đổi tab, quay về từ màn khác).
 * Dùng ref để `useFocusEffect` không chạy lại mỗi render khi `refetch` đổi identity.
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const latest = useRef(refetch);
  useEffect(() => {
    latest.current = refetch;
  }, [refetch]);
  useFocusEffect(
    useCallback(() => {
      void latest.current();
    }, []),
  );
}
