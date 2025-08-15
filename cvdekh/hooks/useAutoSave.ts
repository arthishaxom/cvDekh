import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useAutoSave<T>(
  onSave: (data: T) => void,
  delay = 1000,
  withSavingState = false
) {
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useDebouncedCallback((data: T) => {
    onSave(data);
    if (withSavingState) setIsSaving(false);
  }, delay);

  const save = useCallback(
    (data: T) => {
      if (withSavingState) setIsSaving(true);
      debouncedSave(data);
    },
    [debouncedSave, withSavingState]
  );

  return { save, isSaving };
}
