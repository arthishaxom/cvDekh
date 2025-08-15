import * as Crypto from "expo-crypto";
import { useCallback, useState } from "react";

export function useDynamicList<T extends { id?: string }>(
  initialItems: T[],
  createEmptyItem: () => Omit<T, "id">
) {
  const [items, setItems] = useState<T[]>(initialItems);

  const addItem = useCallback(() => {
    const newItem = {
      ...createEmptyItem(),
      id: Crypto.randomUUID(),
    } as T;
    setItems((prev) => [...prev, newItem]);
  }, [createEmptyItem]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }, []);

  const setItemsDirectly = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    setItems: setItemsDirectly,
  };
}
