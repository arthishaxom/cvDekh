import React, { useState, useCallback } from "react";
import { useResumeStore } from "../../../store/resume/resumeStore";
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
import { ExperienceEntry } from "@/store/resume/types";
import { Trash2 } from "lucide-react-native";
// import { Divider } from "@/components/ui/divider";

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
        // Create a new item with details filtered
        const cleanedItem = {
          ...item,
          details: item.details?.filter((s) => s.trim()) || [],
        };

        if (
          cleanedItem.jobTitle ||
          cleanedItem.company ||
          cleanedItem.details?.length
        ) {
          const existingItem = currentExperience.find(
            (existing) => cleanedItem.id === existing.id,
          );

          if (existingItem) {
            updateListItem("experience", cleanedItem.id!, cleanedItem);
          } else {
            addListItem("experience", cleanedItem);
          }
        }
      });

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
          draft[index][field] = value.split("\n");
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
    const itemToRemove = localExperience[index];
    const updatedExperience = localExperience.filter((_, i) => i !== index);
    setLocalExperience(updatedExperience);

    if (itemToRemove.id) {
      const storeExperience =
        useResumeStore.getState().formData.experience || [];
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
        <VStack className="mb-4 gap-2">
          {localExperience.map((experience, index) => (
            <Box
              key={experience.id || index}
              className="border border-background-300/30 rounded-lg mb-2 pb-0 bg-background-600/50 p-2"
            >
              <HStack className="justify-between items-center mb-2">
                <Box className="border border-background-300/30 rounded-full px-4 py-2">
                  <Text className="text-lg font-semibold">{index + 1}</Text>
                </Box>
                {localExperience.length > 0 && (
                  <Button
                    className="w-min flex-row"
                    size="sm"
                    variant="link"
                    onPress={() => removeExperienceEntry(index)}
                  >
                    <Trash2 size={20} color={"#E42A33"} />
                  </Button>
                )}
              </HStack>

              <FormControl className="mb-2">
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

              <FormControl className="mb-2">
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

              <HStack className="justify-between mb-2">
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

              <FormControl className="mb-1">
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
                    placeholder={`• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved system performance by 30%`}
                    multiline={true}
                    style={{
                      textAlignVertical: "top",
                      minHeight: 100,
                      maxHeight: 200,
                    }}
                  />
                </Textarea>
              </FormControl>
            </Box>
          ))}

          <Button
            action="secondary"
            onPress={addExperienceEntry}
            className="mb-4 flex-1 rounded-lg h-12 border border-white/30 bg-background-400/30"
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
