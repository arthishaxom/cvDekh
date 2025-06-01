import React, { useState, useCallback } from "react";
import { SkillsData, useResumeStore } from "../../../store/resumeStore";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
// import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeText } from "@/components/ui/badge";
import { useDebouncedCallback } from "use-debounce";
import { produce } from "immer";
import { ScrollView, TouchableOpacity } from "react-native";

// Predefined skill suggestions
const SKILL_SUGGESTIONS = {
  languages: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "PHP",
    "Ruby",
    "Scala",
    "R",
    "MATLAB",
    "SQL",
    "HTML",
    "CSS",
  ],
  frameworks: [
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "Express.js",
    "Django",
    "Flask",
    "Spring Boot",
    "Laravel",
    "Ruby on Rails",
    "ASP.NET",
    "Flutter",
    "React Native",
    "Next.js",
    "Nuxt.js",
  ],
  others: [
    "Git",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "GraphQL",
    "REST APIs",
    "Microservices",
    "CI/CD",
    "Jenkins",
    "Terraform",
  ],
};

interface SkillInputProps {
  title: string;
  skills: string[];
  suggestions: string[];
  onSkillsChange: (skills: string[]) => void;
}

function SkillInput({
  title,
  skills,
  suggestions,
  onSkillsChange,
}: SkillInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (skill) =>
      skill.toLowerCase().includes(inputValue.toLowerCase()) &&
      !skills.includes(skill),
  );

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      onSkillsChange([...skills, skill.trim()]);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      addSkill(inputValue.trim());
    }
  };

  return (
    <FormControl className="mb-6">
      <FormControlLabel>
        <FormControlLabelText className="text-typography-500 font-semibold text-lg">
          {title}
        </FormControlLabelText>
      </FormControlLabel>

      <Input className="h-12 mb-2" size="lg">
        <InputField
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            setShowSuggestions(text.length > 0);
          }}
          onSubmitEditing={handleInputSubmit}
          placeholder={`Add ${title.toLowerCase()}...`}
          returnKeyType="done"
        />
      </Input>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Box className="border border-gray-200 rounded-lg p-2 mb-2 max-h-32">
          <ScrollView>
            {filteredSuggestions.slice(0, 5).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => addSkill(suggestion)}
                className="p-2 border-b border-gray-100 last:border-b-0"
              >
                <Text>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Box>
      )}

      <Box className="flex-row flex-wrap">
        {skills.map((skill) => (
          <TouchableOpacity
            key={skill}
            onPress={() => removeSkill(skill)}
            className="mr-2 mb-2"
          >
            <Badge variant="solid" className="bg-blue-500">
              <BadgeText className="text-white">{skill} ×</BadgeText>
            </Badge>
          </TouchableOpacity>
        ))}
      </Box>
    </FormControl>
  );
}

export default function SkillsScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const [isSaving, setIsSaving] = useState(false);
  const [localSkills, setLocalSkills] = useState<SkillsData>({
    languages: formData.skills?.languages || [],
    frameworks: formData.skills?.frameworks || [],
    others: formData.skills?.others || [],
  });

  const debouncedUpdateStore = useDebouncedCallback((skills: SkillsData) => {
    updateFormData("skills", skills);
    console.log(
      "Updated Skills Store",
      useResumeStore.getState().formData.skills,
    );
    setIsSaving(false);
  }, 1000);

  const handleSkillsChange = useCallback(
    (category: keyof SkillsData, skills: string[]) => {
      const updatedSkills = produce(localSkills, (draft) => {
        draft[category] = skills;
      });

      setLocalSkills(updatedSkills);
      setIsSaving(true);
      debouncedUpdateStore(updatedSkills);
    },
    [localSkills, debouncedUpdateStore],
  );

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="mb-4">
          <SkillInput
            title="Programming Languages"
            skills={localSkills.languages || []}
            suggestions={SKILL_SUGGESTIONS.languages}
            onSkillsChange={(skills) => handleSkillsChange("languages", skills)}
          />

          <SkillInput
            title="Frameworks & Libraries"
            skills={localSkills.frameworks || []}
            suggestions={SKILL_SUGGESTIONS.frameworks}
            onSkillsChange={(skills) =>
              handleSkillsChange("frameworks", skills)
            }
          />

          <SkillInput
            title="Tools & Technologies"
            skills={localSkills.others || []}
            suggestions={SKILL_SUGGESTIONS.others}
            onSkillsChange={(skills) => handleSkillsChange("others", skills)}
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

        <Button size="xl" onPress={() => router.back()} className="mt-2">
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
