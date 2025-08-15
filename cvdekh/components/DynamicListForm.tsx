import { Trash2 } from "lucide-react-native";
import type React from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

interface DynamicListFormProps<T> {
  items: T[];
  onItemsChange: (items: T[]) => void;
  createEmptyItem: () => T;
  renderItem: (
    item: T,
    index: number,
    onUpdate: (updates: Partial<T>) => void
  ) => React.ReactNode;
  addButtonText: string;
  minItems?: number;
  maxItems?: number;
}

export function DynamicListForm<T extends { id?: string }>({
  items,
  onItemsChange,
  createEmptyItem,
  renderItem,
  addButtonText,
  minItems = 0,
  maxItems = 10,
}: DynamicListFormProps<T>) {
  const addItem = () => {
    if (items.length >= maxItems) return;
    onItemsChange([...items, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= minItems) return;
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const updateItem = (index: number, updates: Partial<T>) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    onItemsChange(newItems);
  };

  return (
    <>
      <VStack className="gap-2">
        {items.map((item, index) => (
          <Box
            key={item.id || index}
            className="border border-background-300/30 rounded-lg mb-2 pb-0 bg-background-600/50 p-2"
          >
            <HStack className="justify-between items-center mb-3">
              <Box className="border border-background-300/30 rounded-full px-4 py-2">
                <Text className="text-lg font-semibold">{index + 1}</Text>
              </Box>
              {items.length > minItems && (
                <Button
                  className="w-min flex-row"
                  size="sm"
                  variant="link"
                  onPress={() => removeItem(index)}
                >
                  <Trash2 size={20} color={"#E42A33"} />
                </Button>
              )}
            </HStack>

            {renderItem(item, index, (updates) => updateItem(index, updates))}
          </Box>
        ))}
      </VStack>
      {items.length < maxItems && (
        <Button
          action="secondary"
          onPress={addItem}
          className="mb-4 flex-1 rounded-lg h-12 border border-white/30 bg-background-400/30"
        >
          <ButtonText>{addButtonText}</ButtonText>
        </Button>
      )}
    </>
  );
}
