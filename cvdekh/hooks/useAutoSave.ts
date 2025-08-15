import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useAutoSave<T>(onSave: (data: T) => void, delay = 1000) {
  const debouncedSave = useDebouncedCallback(onSave, delay);

  const save = useCallback(
    (data: T) => {
      debouncedSave(data);
    },
    [debouncedSave]
  );

  return { save };
}
