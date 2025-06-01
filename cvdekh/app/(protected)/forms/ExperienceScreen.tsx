import React, { useState, useCallback } from "react";
import { ExperienceEntry, useResumeStore } from "../../../store/resumeStore";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { produce } from "immer";
import { ScrollView } from "react-native";
import * as Crypto from "expo-crypto";

export default function ExperienceScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const addListItem = useResumeStore((state) => state.addListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);

  const [isSaving, setIsSaving] = useState(false);
  const [localExperience, setLocalExperience] = useState<ExperienceEntry[]>(
    formData.experience || [],
  );

  const debouncedUpdateStore = useDebouncedCallback(
    (experienceList: ExperienceEntry[]) => {
      const currentExperience =
        useResumeStore.getState().formData.experience || [];
      const currIds = currentExperience.map((item) => item.id);
      const newIds = experienceList.map((item) => item.id);

      currIds.forEach((id) => {
        if (id && !newIds.includes(id)) {
          removeListItem("experience", id);
        }
      });

      experienceList.forEach((item) => {
        if (item.jobTitle || item.company || item.details?.length) {
          const existingItem = currentExperience.find(
            (existing) => item.id === existing.id,
          );

          if (existingItem) {
            updateListItem("experience", item.id!, item);
          } else {
            addListItem("experience", item);
          }
        }
      });

      console.log(
        "Updated Experience Store",
        useResumeStore.getState().formData.experience,
      );
      setIsSaving(false);
    },
    1000,
  );

  const handleExperienceChange = useCallback(
    (index: number, field: keyof ExperienceEntry, value: string | string[]) => {
      const updatedExperience = produce(localExperience, (draft) => {
        if (!draft[index]) {
          draft[index] = { id: Crypto.randomUUID(), details: [] };
        }
        if (field === "details" && typeof value === "string") {
          draft[index][field] = value.split("\n").filter((s) => s.trim());
        } else {
          draft[index][field] = value as any;
        }
      });

      setLocalExperience(updatedExperience);
      setIsSaving(true);
      debouncedUpdateStore(updatedExperience);
    },
    [localExperience, debouncedUpdateStore],
  );

  const addExperienceEntry = () => {
    const newEntry: ExperienceEntry = {
      id: Crypto.randomUUID(),
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      details: [],
    };
    setLocalExperience([...localExperience, newEntry]);
  };

  const removeExperienceEntry = (index: number) => {
    console.log("Removing experience entry at index:", index);
    const itemToRemove = localExperience[index];
    console.log("Item to remove:", itemToRemove.id);
    const updatedExperience = localExperience.filter((_, i) => i !== index);
    setLocalExperience(updatedExperience);

    if (itemToRemove.id) {
      const storeExperience =
        useResumeStore.getState().formData.experience || [];
      console.log("Store Experience:", storeExperience);
      const existsInStore = storeExperience.some(
        (item) => item.id === itemToRemove.id,
      );

      if (existsInStore) {
        removeListItem("experience", itemToRemove.id);
      }
    }

    setIsSaving(true);
    debouncedUpdateStore(updatedExperience);
  };

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="mb-4">
          {localExperience.map((experience, index) => (
            <Box
              key={experience.id || index}
              className="mb-6 p-4 border border-gray-200 rounded-lg"
            >
              <HStack className="justify-between items-center mb-3">
                <Text className="text-lg font-semibold">
                  Experience {index + 1}
                </Text>
                {localExperience.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => removeExperienceEntry(index)}
                  >
                    <ButtonText>Remove</ButtonText>
                  </Button>
                )}
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Job Title
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={experience.jobTitle || ""}
                    onChangeText={(text) =>
                      handleExperienceChange(index, "jobTitle", text)
                    }
                    placeholder="e.g., Software Engineer"
                  />
                </Input>
              </FormControl>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Company
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={experience.company || ""}
                    onChangeText={(text) =>
                      handleExperienceChange(index, "company", text)
                    }
                    placeholder="Enter company name"
                  />
                </Input>
              </FormControl>

              <HStack className="justify-between mb-4">
                <FormControl className="flex-1 mr-2">
                  <FormControlLabel>
                    <FormControlLabelText className="text-typography-500 font-semibold">
                      Start Date
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="h-12" size="lg">
                    <InputField
                      value={experience.startDate || ""}
                      onChangeText={(text) =>
                        handleExperienceChange(index, "startDate", text)
                      }
                      placeholder="MM/YYYY"
                    />
                  </Input>
                </FormControl>

                <FormControl className="flex-1 ml-2">
                  <FormControlLabel>
                    <FormControlLabelText className="text-typography-500 font-semibold">
                      End Date
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="h-12" size="lg">
                    <InputField
                      value={experience.endDate || ""}
                      onChangeText={(text) =>
                        handleExperienceChange(index, "endDate", text)
                      }
                      placeholder="MM/YYYY or Present"
                    />
                  </Input>
                </FormControl>
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Job Responsibilities (one per line)
                  </FormControlLabelText>
                </FormControlLabel>
                <Textarea size="lg">
                  <TextareaInput
                    value={experience.details?.join("\n") || ""}
                    onChangeText={(text) =>
                      handleExperienceChange(index, "details", text)
                    }
                    placeholder="• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved system performance by 30%"
                    multiline={true}
                    style={{ minHeight: 100, maxHeight: 200 }}
                  />
                </Textarea>
              </FormControl>
            </Box>
          ))}

          <Button
            variant="outline"
            onPress={addExperienceEntry}
            className="mb-4"
          >
            <ButtonText>Add Experience</ButtonText>
          </Button>
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

        <Button size="xl" onPress={() => router.back()} className="mt-2">
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
