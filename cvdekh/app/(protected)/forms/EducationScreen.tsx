import React, { useState, useCallback, useEffect } from "react";
import {
  EducationEntry,
  useResumeStore,
} from "../../../store/resume/resumeStore";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { produce } from "immer";
import { ScrollView } from "react-native";
import * as Crypto from "expo-crypto";

export default function EducationScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);

  const [isSaving, setIsSaving] = useState(false);
  const [localEducation, setLocalEducation] = useState<EducationEntry[]>(
    formData.education || [],
  );

  // Sync local state with store when formData changes
  useEffect(() => {
    setLocalEducation(formData.education || []);
  }, [formData.education]);

  const debouncedUpdateStore = useDebouncedCallback(
    (educationList: EducationEntry[]) => {
      const currentEducation =
        useResumeStore.getState().formData.education || [];
      const currentIds = currentEducation.map((item) => item.id);
      const newIds = educationList.map((item) => item.id);

      // Remove items that are no longer in the list
      currentIds.forEach((id) => {
        if (id && !newIds.includes(id)) {
          removeListItem("education", id);
        }
      });

      // Add or update items
      educationList.forEach((item) => {
        // Only process items with some content
        if (
          item.institution ||
          item.field ||
          item.startDate ||
          item.endDate ||
          item.cgpa
        ) {
          const existingItem = currentEducation.find(
            (existing) => existing.id === item.id,
          );

          if (existingItem) {
            // Update existing item
            updateListItem("education", item.id!, item);
          } else {
            // Add new item
            addListItem("education", item);
          }
        }
      });

      console.log(
        "Updated Education Store",
        useResumeStore.getState().formData.education,
      );
      setIsSaving(false);
    },
    1000,
  );

  const handleEducationChange = useCallback(
    (index: number, field: keyof EducationEntry, value: string) => {
      const updatedEducation = produce(localEducation, (draft) => {
        if (!draft[index]) {
          draft[index] = { id: Crypto.randomUUID() };
        }
        draft[index][field] = value;
      });

      setLocalEducation(updatedEducation);
      setIsSaving(true);
      debouncedUpdateStore(updatedEducation);
    },
    [localEducation, debouncedUpdateStore],
  );

  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      id: Crypto.randomUUID(),
      institution: "",
      field: "",
      startDate: "",
      endDate: "",
      cgpa: "",
    };
    const updatedEducation = [...localEducation, newEntry];
    setLocalEducation(updatedEducation);
  };

  const removeEducationEntry = (index: number) => {
    const itemToRemove = localEducation[index];
    const updatedEducation = localEducation.filter((_, i) => i !== index);

    setLocalEducation(updatedEducation);

    // Immediately remove from store if it exists there
    if (itemToRemove.id) {
      const storeEducation = useResumeStore.getState().formData.education || [];
      const existsInStore = storeEducation.some(
        (item) => item.id === itemToRemove.id,
      );

      if (existsInStore) {
        removeListItem("education", itemToRemove.id);
      }
    }

    setIsSaving(true);
    debouncedUpdateStore(updatedEducation);
  };

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="mb-4">
          {localEducation.map((education, index) => (
            <Box key={education.id || index} className="mb-2">
              <HStack className="justify-between items-center mb-3">
                <Text className="text-lg font-semibold">
                  Education {index + 1}
                </Text>
                {localEducation.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => removeEducationEntry(index)}
                  >
                    <ButtonText>Remove</ButtonText>
                  </Button>
                )}
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Institution/University
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={education.institution || ""}
                    onChangeText={(text) =>
                      handleEducationChange(index, "institution", text)
                    }
                    placeholder="Enter institution name"
                  />
                </Input>
              </FormControl>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Field of Study
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={education.field || ""}
                    onChangeText={(text) =>
                      handleEducationChange(index, "field", text)
                    }
                    placeholder="e.g., Computer Science"
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
                      value={education.startDate || ""}
                      onChangeText={(text) =>
                        handleEducationChange(index, "startDate", text)
                      }
                      placeholder="MMM YYYY"
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
                      value={education.endDate || ""}
                      onChangeText={(text) =>
                        handleEducationChange(index, "endDate", text)
                      }
                      placeholder="MMM YYYY or Present"
                    />
                  </Input>
                </FormControl>
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    CGPA/Grade
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={education.cgpa || ""}
                    onChangeText={(text) =>
                      handleEducationChange(index, "cgpa", text)
                    }
                    placeholder="e.g., 9.35/10.0"
                    keyboardType="numeric"
                  />
                </Input>
              </FormControl>
            </Box>
          ))}

          <Button
            variant="outline"
            onPress={addEducationEntry}
            className="mb-4"
          >
            <ButtonText>Add Education</ButtonText>
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
