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
import { ProjectEntry } from "@/store/resume/types";

export default function ProjectsScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const addListItem = useResumeStore((state) => state.addListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);

  const [isSaving, setIsSaving] = useState(false);
  const [localProjects, setLocalProjects] = useState<ProjectEntry[]>(
    formData.projects || [],
  );

  const debouncedUpdateStore = useDebouncedCallback(
    (projectsList: ProjectEntry[]) => {
      const currentProjects = useResumeStore.getState().formData.projects || [];
      const currentIds = currentProjects.map((item) => item.id);
      const newIds = projectsList.map((item) => item.id);
      currentIds.forEach((id) => {
        if (id && !newIds.includes(id)) {
          removeListItem("projects", id);
        }
      });

      projectsList.forEach((item) => {
        // Create a new item with details filtered
        const cleanedItem = {
          ...item,
          details: item.details?.filter((s) => s.trim()) || [],
        };

        if (
          cleanedItem.title ||
          cleanedItem.techStack?.length ||
          cleanedItem.details?.length
        ) {
          const existingItem = currentProjects.find(
            (existing) => cleanedItem.id === existing.id,
          );
          if (existingItem) {
            updateListItem("projects", cleanedItem.id!, cleanedItem);
          } else {
            addListItem("projects", cleanedItem);
          }
        }
      });
      setIsSaving(false);
    },
    1000,
  );

  const handleProjectChange = useCallback(
    (index: number, field: keyof ProjectEntry, value: string | string[]) => {
      const updatedProjects = produce(localProjects, (draft) => {
        if (!draft[index]) {
          draft[index] = {
            id: crypto.randomUUID(),
            techStack: [],
            details: [],
          };
        }
        if (field === "techStack" && typeof value === "string") {
          draft[index][field] = value.split(",").filter((s) => s.trim());
        } else if (field === "details" && typeof value === "string") {
          draft[index][field] = value.split("\n");
        } else {
          draft[index][field] = value as any;
        }
      });
      setLocalProjects(updatedProjects);
      setIsSaving(true);
      debouncedUpdateStore(localProjects);
    },
    [localProjects, debouncedUpdateStore],
  );

  const addProjectEntry = () => {
    const newEntry: ProjectEntry = {
      id: crypto.randomUUID(),
      title: "",
      techStack: [],
      details: [],
      startDate: "",
      endDate: "",
    };
    setLocalProjects([...localProjects, newEntry]);
  };

  const removeProjectEntry = (index: number) => {
    const itemToRemove = localProjects[index];
    const updatedProjects = localProjects.filter((_, i) => i !== index);

    setLocalProjects(updatedProjects);

    // Immediately remove from store if it exists there
    if (itemToRemove.id) {
      const storeProjects = useResumeStore.getState().formData.projects || [];
      const existsInStore = storeProjects.some(
        (item) => item.id === itemToRemove.id,
      );

      if (existsInStore) {
        removeListItem("projects", itemToRemove.id);
      }
    }

    setIsSaving(true);
    debouncedUpdateStore(updatedProjects);
  };

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="mb-4">
          {localProjects.map((project, index) => (
            <Box key={project.id || index} className="mb-2">
              <HStack className="justify-between items-center mb-3">
                <Text className="text-lg font-semibold">
                  Project {index + 1}
                </Text>
                {localProjects.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => removeProjectEntry(index)}
                  >
                    <ButtonText>Remove</ButtonText>
                  </Button>
                )}
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Project Title
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={project.title || ""}
                    onChangeText={(text) =>
                      handleProjectChange(index, "title", text)
                    }
                    placeholder="Enter project title"
                  />
                </Input>
              </FormControl>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Tech Stack (comma-separated)
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="h-12" size="lg">
                  <InputField
                    value={project.techStack?.join(", ") || ""}
                    onChangeText={(text) =>
                      handleProjectChange(index, "techStack", text)
                    }
                    placeholder="React, Node.js, MongoDB"
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
                      value={project.startDate || ""}
                      onChangeText={(text) =>
                        handleProjectChange(index, "startDate", text)
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
                      value={project.endDate || ""}
                      onChangeText={(text) =>
                        handleProjectChange(index, "endDate", text)
                      }
                      placeholder="MM/YYYY or Present"
                    />
                  </Input>
                </FormControl>
              </HStack>

              <FormControl className="mb-4">
                <FormControlLabel>
                  <FormControlLabelText className="text-typography-500 font-semibold">
                    Project Details (one per line)
                  </FormControlLabelText>
                </FormControlLabel>
                <Textarea size="lg">
                  <TextareaInput
                    value={project.details?.join("\n") || ""}
                    onChangeText={(text) =>
                      handleProjectChange(index, "details", text)
                    }
                    placeholder="• Developed a web application\n• Implemented user authentication\n• Deployed on AWS"
                    multiline={true}
                    style={{ textAlignVertical: "top" }}
                  />
                </Textarea>
              </FormControl>
            </Box>
          ))}

          <Button variant="outline" onPress={addProjectEntry} className="mb-4">
            <ButtonText>Add Project</ButtonText>
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
