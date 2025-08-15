import { useRouter } from "expo-router";
import { useCallback } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { DateRangeFields } from "@/components/DataRangeField";
import { DynamicListForm } from "@/components/DynamicListForm";
import { FormField } from "@/components/FormField";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDynamicList } from "@/hooks/useDynamicList";
import type { ProjectEntry } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";

export default function ProjectsScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const createEmptyProject = useCallback(
    (): Omit<ProjectEntry, "id"> => ({
      title: "",
      techStack: [],
      details: [],
      startDate: "",
      endDate: "",
    }),
    []
  );

  const {
    items: projects,
    updateItem,
    setItems,
  } = useDynamicList(formData.projects || [], createEmptyProject);

  const { save } = useAutoSave((projects: ProjectEntry[]) => {
    updateFormData("projects", projects);
  });

  const handleProjectsChange = useCallback(
    (newProjects: ProjectEntry[]) => {
      setItems(newProjects);
      save(newProjects);
    },
    [setItems, save]
  );

  const renderProject = useCallback(
    (
      project: ProjectEntry,
      index: number,
      onUpdate: (updates: Partial<ProjectEntry>) => void
    ) => (
      <VStack key={project.id}>
        <FormField
          label="Project Title"
          value={project.title || ""}
          onChangeText={(text) => onUpdate({ title: text })}
          placeholder="Enter project title"
          required
        />

        <FormField
          label="Tech Stack (comma-separated)"
          value={project.techStack?.join(", ") || ""}
          onChangeText={(text) =>
            onUpdate({
              techStack: text
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s),
            })
          }
          placeholder="React, Node.js, MongoDB"
          required
        />

        <DateRangeFields
          startDate={project.startDate || ""}
          endDate={project.endDate || ""}
          onStartDateChange={(date) => onUpdate({ startDate: date })}
          onEndDateChange={(date) => onUpdate({ endDate: date })}
        />

        <FormField
          label="Project Details (one per line)"
          value={project.details?.join("\n") || ""}
          onChangeText={(text) =>
            onUpdate({
              details: text.split("\n").filter((s) => s.trim()),
            })
          }
          placeholder="• Developed a web application&#10;• Implemented user authentication&#10;• Deployed on AWS"
          multiline
          required
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
          items={projects}
          onItemsChange={handleProjectsChange}
          createEmptyItem={createEmptyProject}
          renderItem={renderProject}
          addButtonText="Add Project"
          minItems={0}
          maxItems={10}
        />
      </KeyboardAwareScrollView>

      <VStack className="mb-6">
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
