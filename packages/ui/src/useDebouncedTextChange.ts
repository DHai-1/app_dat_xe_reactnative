import { useCallback, useEffect, useRef } from "react";

export function useDebouncedTextChange(
  onCommit: (text: string) => void,
  delay = 400,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onCommit);
  useEffect(() => {
    callback.current = onCommit;
  }, [onCommit]);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  const onChangeText = useCallback(
    (text: string) => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        callback.current(text);
      }, delay);
    },
    [cancel, delay],
  );
  return { onChangeText, cancel };
}
