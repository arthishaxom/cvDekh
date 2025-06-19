import React, { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { useResumeStore } from "../../../store/resume/resumeStore";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { ScrollView } from "react-native";

export default function ProfileSummaryScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const [isSaving, setIsSaving] = useState(false);
  const [localSummary, setLocalSummary] = useState(formData.summary || "");

  const debouncedUpdateStore = useDebouncedCallback((value: string) => {
    updateFormData("summary", value);
    setIsSaving(false);
  }, 1000); // 1-second debounce

  const handleInputChange = useCallback(
    (text: string) => {
      setLocalSummary(text);
      setIsSaving(true);
      debouncedUpdateStore(text);
    },
    [debouncedUpdateStore],
  );
  const [inputHeight, setInputHeight] = useState(64);

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <VStack>
          <FormControl className="mb-4">
            <FormControlLabel>
              <FormControlLabelText className="text-typography-500 font-semibold text-lg">
                Professional Summary
              </FormControlLabelText>
            </FormControlLabel>
            <Textarea
              size="lg"
              style={{
                height: inputHeight,
                minHeight: 64,
              }}
            >
              <TextareaInput
                multiline
                value={localSummary}
                onContentSizeChange={(e) => {
                  setInputHeight(Math.max(64, e.nativeEvent.contentSize.height));
                }}
                onChangeText={handleInputChange}
                placeholder="Write a concise summary of your professional experience and skills."
                style={{ textAlignVertical: "top" }}
              />
            </Textarea>
          </FormControl>
        </VStack>
      </ScrollView>

      <VStack className="mb-6">
        <Box className="items-center p-0">
          {isSaving ? (
            <Text className="text-blue-500">Saving...</Text>
          ) : (
            <Text className="text-green-500">Saved</Text>
          )}
        </Box>

        <Button
          size="xl"
          onPress={() => router.back()}
          className="mt-2 rounded-lg"
        >
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
