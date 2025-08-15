import { useRouter } from "expo-router";
import { produce } from "immer";
import { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { FormField } from "@/components/FormField";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { ContactInfo } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";

interface LocalFormData {
  name: string;
  contactInfo: ContactInfo;
}

export default function GeneralInfoScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const [isSaving, setIsSaving] = useState(false);

  const [localFormData, setLocalFormData] = useState<LocalFormData>({
    name: formData.name || "",
    contactInfo: {
      linkedin: formData.contactInfo?.linkedin || "",
      github: formData.contactInfo?.github || "",
      gmail: formData.contactInfo?.gmail || "",
      phone: formData.contactInfo?.phone || "",
    },
  });

  const { save } = useAutoSave((data: LocalFormData) => {
    // Update both name and contactInfo in the store
    updateFormData("name", data.name);
    updateFormData("contactInfo", data.contactInfo);
    setIsSaving(false);
  }, 1000);

  const handleInfoChange = useCallback(
    (field: keyof ContactInfo | "name", value: string) => {
      // Update local state
      const updatedData = produce(localFormData, (draft) => {
        if (field === "name") {
          draft.name = value;
        } else {
          draft.contactInfo[field] = value;
        }
      });

      setLocalFormData(updatedData);
      setIsSaving(true);

      // Save entire form data (debounced)
      save(updatedData);
    },
    [localFormData, save]
  );

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack>
          <FormField
            label="Full Name"
            value={localFormData.name}
            onChangeText={(text) => handleInfoChange("name", text)}
            placeholder="Enter your full name"
            required
            className="mb-4"
          />

          <FormField
            label="LinkedIn Profile URL"
            value={localFormData.contactInfo.linkedin || ""}
            onChangeText={(text) => handleInfoChange("linkedin", text)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="mb-4"
          />

          <FormField
            label="GitHub Profile URL"
            value={localFormData.contactInfo.github || ""}
            onChangeText={(text) => handleInfoChange("github", text)}
            placeholder="https://github.com/yourusername"
            className="mb-4"
          />

          <FormField
            label="Email Address"
            value={localFormData.contactInfo.gmail || ""}
            onChangeText={(text) => handleInfoChange("gmail", text)}
            placeholder="your.email@example.com"
            className="mb-4"
            type="text"
          />

          <FormField
            label="Phone Number"
            value={localFormData.contactInfo.phone || ""}
            onChangeText={(text) => handleInfoChange("phone", text)}
            placeholder="+1234567890"
            className="mb-4"
            type="text"
          />
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
