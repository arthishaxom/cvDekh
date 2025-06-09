import React, { useCallback, useState } from "react";

import { useResumeStore } from "../../../store/resume/resumeStore";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField } from "@/components/ui/input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { produce } from "immer";
import { ContactInfo } from "@/store/resume/types";

export default function GeneralInfoScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const [isSaving, setIsSaving] = useState(false);
  const debouncedUpdateStore = useDebouncedCallback(
    (field: keyof ContactInfo | "name", value: string) => {
      if (field === "name") {
        updateFormData("name", value);
      } else {
        updateFormData("contactInfo", { [field]: value });
      }
      console.log("Updated Store", useResumeStore.getState().formData);
      setIsSaving(false);
    },
    1000, // 1-second debounce
  );

  const handleInputChange = useCallback(
    (field: keyof ContactInfo | "name", value: string) => {
      setLocalFormData(
        produce((draft) => {
          if (field === "name") {
            draft.name = value;
          } else {
            draft.contactInfo[field] = value;
          }
        }),
      );

      setIsSaving(true);
      debouncedUpdateStore(field, value);
    },
    [debouncedUpdateStore],
  );

  const [localFormData, setLocalFormData] = useState({
    name: formData.name || "",
    contactInfo: {
      linkedin: formData.contactInfo?.linkedin || "",
      github: formData.contactInfo?.github || "",
      gmail: formData.contactInfo?.gmail || "",
      phone: formData.contactInfo?.phone || "",
    },
  });

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <VStack>
        <FormControl className="mb-4">
          <FormControlLabel>
            <FormControlLabelText className="text-typography-500 font-semibold text-lg">
              Full Name
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="h-12" size="lg">
            <InputField
              value={localFormData.name}
              onChangeText={(text) => {
                handleInputChange("name", text);
              }}
              placeholder="Enter your full name"
            />
          </Input>
        </FormControl>

        <FormControl className="mb-4">
          <FormControlLabel>
            <FormControlLabelText className="text-typography-500 font-semibold text-lg">
              LinkedIn Profile URL
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="h-12" size="lg">
            <InputField
              value={localFormData.contactInfo.linkedin}
              onChangeText={(text) => handleInputChange("linkedin", text)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </Input>
        </FormControl>

        <FormControl className="mb-4">
          <FormControlLabel>
            <FormControlLabelText className="text-typography-500 font-semibold text-lg">
              GitHub Profile URL
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="h-12" size="lg">
            <InputField
              value={localFormData.contactInfo.github}
              onChangeText={(text) => handleInputChange("github", text)}
              placeholder="https://github.com/yourusername"
            />
          </Input>
        </FormControl>

        <FormControl className="mb-4">
          <FormControlLabel>
            <FormControlLabelText className="text-typography-500 font-semibold text-lg">
              Email Address
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="h-12" size="lg">
            <InputField
              value={localFormData.contactInfo.gmail}
              onChangeText={(text) => handleInputChange("gmail", text)}
              placeholder="your.email@example.com"
              keyboardType="email-address"
            />
          </Input>
        </FormControl>

        <FormControl className="mb-4">
          <FormControlLabel>
            <FormControlLabelText className="text-typography-500 font-semibold text-lg">
              Phone Number
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="h-12" size="lg">
            <InputField
              value={localFormData.contactInfo.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              placeholder="+1234567890"
              keyboardType="phone-pad"
            />
          </Input>
        </FormControl>
      </VStack>

      <VStack className="mb-6">
        <Box className="items-center p-0">
          {isSaving ? (
            <Text className="text-blue-500">Saving...</Text>
          ) : (
            <Text className="text-green-500">Saved</Text>
          )}
        </Box>

        <Button size="xl" onPress={() => router.back()} className="mt-2">
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
