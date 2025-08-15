import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { produce } from "immer";
import { Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useDebouncedCallback } from "use-debounce";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type { EducationEntry } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";
// import { Divider } from "@/components/ui/divider";

export default function EducationScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);

  const [isSaving, setIsSaving] = useState(false);
  const [localEducation, setLocalEducation] = useState<EducationEntry[]>(
    formData.education || []
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
            (existing) => existing.id === item.id
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
      setIsSaving(false);
    },
    1000
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
    [localEducation, debouncedUpdateStore]
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
        (item) => item.id === itemToRemove.id
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
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
        extraKeyboardSpace={-100}
      >
        <VStack className="mb-4 gap-2">
          {localEducation.map((education, index) => (
            <Box
              key={education.id || index}
              className="border border-background-300/30 rounded-lg mb-2 pb-0 bg-background-600/50 p-2"
            >
              <HStack className="justify-between items-center mb-1">
                <Box className="border border-background-300/30 rounded-full px-4 py-2">
                  <Text className="text-lg font-semibold">{index + 1}</Text>
                </Box>
                {localEducation.length > 1 && (
                  <Button
                    className="w-min flex-row"
                    size="sm"
                    variant="link"
                    onPress={() => removeEducationEntry(index)}
                  >
                    <Trash2 size={20} color={"#E42A33"} />
                  </Button>
                )}
              </HStack>

              <FormControl className="mb-2">
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

              <FormControl className="mb-2">
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

              <HStack className="justify-between mb-2">
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

              <FormControl className="mb-1">
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
              {/* {index < (localEducation?.length || 0) - 1 && (
                <Divider className="my-2" />
              )} */}
            </Box>
          ))}
        </VStack>
        <Button
          action="secondary"
          onPress={addEducationEntry}
          className="mb-4 flex-1 rounded-lg h-12 border border-white/30 bg-background-400/30"
        >
          <ButtonText>Add Education</ButtonText>
        </Button>
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
