import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { DynamicListForm } from "@/components/DynamicListForm";
import { FormField } from "@/components/FormField";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDynamicList } from "@/hooks/useDynamicList";
import type { EducationEntry } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";

export default function EducationScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const createEmptyEducation = useCallback(
    (): Omit<EducationEntry, "id"> => ({
      institution: "",
      field: "",
      startDate: "",
      endDate: "",
      cgpa: "",
    }),
    []
  );

  const { items: education, setItems } = useDynamicList(
    formData.education || [],
    createEmptyEducation
  );

  const { save, isSaving } = useAutoSave(
    (education: EducationEntry[]) => {
      updateFormData("education", education);
    },
    1000,
    true
  ); // Enable saving state tracking

  const handleEducationChange = useCallback(
    (newEducation: EducationEntry[]) => {
      setItems(newEducation);
      save(newEducation);
    },
    [setItems, save]
  );

  const renderEducation = useCallback(
    (
      edu: EducationEntry,
      _index: number,
      onUpdate: (updates: Partial<EducationEntry>) => void
    ) => (
      <VStack>
        {/* Institution */}
        <FormField
          label="Institution/University"
          value={edu.institution || ""}
          onChangeText={(text) => onUpdate({ institution: text })}
          placeholder="Enter institution name"
          required
          className="mb-2"
        />

        {/* Field of Study */}
        <FormField
          label="Field of Study"
          value={edu.field || ""}
          onChangeText={(text) => onUpdate({ field: text })}
          placeholder="e.g., Computer Science"
          required
          className="mb-2"
        />

        {/* Date Range */}
        <HStack className="justify-between mb-2">
          <FormField
            label="Start Date"
            value={edu.startDate || ""}
            onChangeText={(text) => onUpdate({ startDate: text })}
            placeholder="Jun 2025"
            required
            className="flex-1 mr-2"
            type="date"
          />
          <FormField
            label="End Date"
            value={edu.endDate || ""}
            onChangeText={(text) => onUpdate({ endDate: text })}
            placeholder="Jul 2026 or Present"
            required
            className="flex-1 ml-2"
            type="date"
          />
        </HStack>

        {/* CGPA */}
        <FormField
          label="CGPA/Grade"
          value={edu.cgpa || ""}
          onChangeText={(text) => onUpdate({ cgpa: text })}
          placeholder="e.g., 9.35/10.0"
          required
          className="mb-1"
        />
      </VStack>
    ),
    []
  );

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
        extraKeyboardSpace={-100}
      >
        <DynamicListForm
          items={education}
          onItemsChange={handleEducationChange}
          createEmptyItem={() => ({
            ...createEmptyEducation(),
            id: Crypto.randomUUID(),
          })}
          renderItem={renderEducation}
          addButtonText="Add Education"
          minItems={0}
          maxItems={10}
        />
      </KeyboardAwareScrollView>

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
