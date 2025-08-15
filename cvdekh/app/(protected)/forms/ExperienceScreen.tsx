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
import type { ExperienceEntry } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";

export default function ExperienceScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const createEmptyExperience = useCallback(
    (): Omit<ExperienceEntry, "id"> => ({
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      details: [],
    }),
    []
  );

  const { items: experience, setItems } = useDynamicList(
    formData.experience || [],
    createEmptyExperience
  );

  const { save, isSaving } = useAutoSave(
    (experience: ExperienceEntry[]) => {
      updateFormData("experience", experience);
    },
    1000,
    true
  ); // Enable saving state tracking

  const handleExperienceChange = useCallback(
    (newExperience: ExperienceEntry[]) => {
      setItems(newExperience);
      save(newExperience);
    },
    [setItems, save]
  );

  const renderExperience = useCallback(
    (
      exp: ExperienceEntry,
      _index: number,
      onUpdate: (updates: Partial<ExperienceEntry>) => void
    ) => (
      <VStack>
        {/* Job Title */}
        <FormField
          label="Job Title"
          value={exp.jobTitle || ""}
          onChangeText={(text) => onUpdate({ jobTitle: text })}
          placeholder="e.g., Software Engineer"
          required
        />

        {/* Company */}
        <FormField
          label="Company"
          value={exp.company || ""}
          onChangeText={(text) => onUpdate({ company: text })}
          placeholder="Enter company name"
          required
        />

        {/* Date Range */}
        <HStack className="justify-between mb-2">
          <FormField
            label="Start Date"
            value={exp.startDate || ""}
            onChangeText={(text) => onUpdate({ startDate: text })}
            placeholder="MM/YYYY"
            className="flex-1 mr-2"
            type="date"
            required
          />
          <FormField
            label="End Date"
            value={exp.endDate || ""}
            onChangeText={(text) => onUpdate({ endDate: text })}
            placeholder="MM/YYYY or Present"
            className="flex-1 ml-2"
            type="date"
            required
          />
        </HStack>

        {/* Job Responsibilities */}
        <FormField
          label="Job Responsibilities (one per line)"
          value={exp.details?.join("\n") || ""}
          onChangeText={(text) =>
            onUpdate({
              details: text.split("\n").filter((s) => s.trim()),
            })
          }
          placeholder={`• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved system performance by 30%`}
          multiline
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
          items={experience}
          onItemsChange={handleExperienceChange}
          createEmptyItem={() => ({
            ...createEmptyExperience(),
            id: Crypto.randomUUID(),
          })}
          renderItem={renderExperience}
          addButtonText="Add Experience"
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
