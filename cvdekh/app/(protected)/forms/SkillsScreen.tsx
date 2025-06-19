import React, { useState, useCallback, useEffect } from "react";
import { useResumeStore } from "../../../store/resume/resumeStore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSkillsAutocomplete } from "@/hooks/skillAC";
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
import { Badge, BadgeText } from "@/components/ui/badge";
import { useDebouncedCallback } from "use-debounce";
import { produce } from "immer";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { HStack } from "@/components/ui/hstack";
import { Check, X } from "lucide-react-native";
// import { SkillsData } from "@/store/resume/types";

// Define category configuration for better type safety and maintainability
const CATEGORY_CONFIG = {
  languages: {
    title: "Programming Languages",
    placeholder: "Search programming languages...",
    addPlaceholder: "Add programming languages...",
  },
  frameworks: {
    title: "Frameworks & Libraries",
    placeholder: "Search frameworks & libraries...",
    addPlaceholder: "Add frameworks & libraries...",
  },
  others: {
    title: "Tools & Technologies",
    placeholder: "Search tools & technologies...",
    addPlaceholder: "Add tools & technologies...",
  },
} as const;

type SkillCategory = keyof typeof CATEGORY_CONFIG;

interface SuggestionItemProps {
  suggestion: string;
  onAdd: (skill: string) => void;
  isAlreadySelected: boolean;
}

// Separate component for suggestion items for better performance
function SuggestionItem({
  suggestion,
  onAdd,
  isAlreadySelected,
}: SuggestionItemProps) {
  return (
    <Pressable
      onPress={() => !isAlreadySelected && onAdd(suggestion)}
      className={`p-3`}
      disabled={isAlreadySelected}
    >
      <HStack className="w-full justify-between items-center">
        <Text className={`text-white`}>{suggestion}</Text>
        {isAlreadySelected && <Check color="white" size={16} />}
      </HStack>
    </Pressable>
  );
}

export default function GenericSkillsEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category: string }>();

  // Type-safe category extraction with fallback
  const category = (params.category as SkillCategory) || "languages";
  const categoryConfig = CATEGORY_CONFIG[category];

  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  // Get current skills for this category
  const currentSkills = formData.skills?.[category] || [];

  // Local state for managing the skills being edited
  const [localSkills, setLocalSkills] = useState<string[]>(currentSkills);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Use the skills autocomplete hook
  const { suggestions, isLoading, error, searchSkills, clearSuggestions } =
    useSkillsAutocomplete();

  // Debounced function to save changes to the store
  const debouncedSaveToStore = useDebouncedCallback((skills: string[]) => {
    const updatedSkillsData = produce(formData.skills || {}, (draft) => {
      draft[category] = skills;
    });

    updateFormData("skills", updatedSkillsData);
    setIsSaving(false);
  }, 1000);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (text.trim().length >= 2) {
        // Call the API search with the current category
        searchSkills(text.trim(), category);
      } else {
        // Clear suggestions for short queries
        clearSuggestions();
      }
    },
    [category, searchSkills, clearSuggestions],
  );

  // Add a skill to the local state
  const addSkill = useCallback(
    (skill: string) => {
      const trimmedSkill = skill.trim();

      if (trimmedSkill && !localSkills.includes(trimmedSkill)) {
        const updatedSkills = [...localSkills, trimmedSkill];
        setLocalSkills(updatedSkills);
        setIsSaving(true);
        debouncedSaveToStore(updatedSkills);

        // Clear search after adding
        setSearchQuery("");
        clearSuggestions();
      }
    },
    [localSkills, debouncedSaveToStore, clearSuggestions],
  );

  // Remove a skill from the local state
  const removeSkill = useCallback(
    (skillToRemove: string) => {
      const updatedSkills = localSkills.filter(
        (skill) => skill !== skillToRemove,
      );
      setLocalSkills(updatedSkills);
      setIsSaving(true);
      debouncedSaveToStore(updatedSkills);
    },
    [localSkills, debouncedSaveToStore],
  );

  // Handle manual skill addition via search input
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      addSkill(searchQuery.trim());
    }
  }, [searchQuery, addSkill]);

  // Filter suggestions to exclude already selected skills
  const filteredSuggestions = suggestions.filter(
    (suggestion) => !localSkills.includes(suggestion),
  );

  // Sync local state when component mounts or category changes
  useEffect(() => {
    setLocalSkills(formData.skills?.[category] || []);
  }, [category, formData.skills]);

  return (
    <VStack className="flex-1 bg-background-500">
      {/* Header */}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <VStack className="px-5">
          {/* Search Input */}
          <FormControl className="mb-4">
            <FormControlLabel>
              <FormControlLabelText className="text-typography-500 font-medium">
                Search & Add Skills
              </FormControlLabelText>
            </FormControlLabel>

            <Input className="h-12 rounded-lg mt-2" size="lg">
              <InputField
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                placeholder={categoryConfig.placeholder}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>

            {/* Error message */}
            {error && (
              <Text className="text-sm text-red-500 mt-1">{error}</Text>
            )}
          </FormControl>

          {/* Selected Skills */}
          {localSkills.length > 0 && (
            <VStack className="mb-6">
              <Text className="text-lg font-semibold text-typography-700 mb-3">
                Selected Skills ({localSkills.length})
              </Text>

              <Box className="flex-row flex-wrap">
                {localSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => removeSkill(skill)}
                    className="mr-2 mb-2"
                  >
                    <Badge
                      variant="outline"
                      className="rounded-lg bg-background-400/50 flex-row gap-1"
                    >
                      <BadgeText className="text-white">{skill}</BadgeText>
                      <X color="grey" size={10} />
                    </Badge>
                  </TouchableOpacity>
                ))}
              </Box>

              <Text className="text-xs text-typography-400 mt-2">
                Tap on any skill to remove it
              </Text>
            </VStack>
          )}

          {/* Suggestions */}
          {searchQuery.length >= 2 &&
            (filteredSuggestions.length > 0 || suggestions.length > 0) && (
              <VStack className="mb-6">
                <Text className="text-lg font-semibold text-typography-700 mb-3">
                  Suggestions
                </Text>

                <Box className=" rounded-lg overflow-hidden">
                  {isLoading ? (
                    <HStack className="justify-center items-center gap-2">
                      <ActivityIndicator size="small" color="grey" />
                      <Text className="text-sm text-white/90 mt-1 h-min">
                        Loading...
                      </Text>
                    </HStack>
                  ) : (
                    <ScrollView className="max-h-64" keyboardShouldPersistTaps="handled">
                      {filteredSuggestions.map((suggestion) => (
                        <SuggestionItem
                          key={suggestion}
                          suggestion={suggestion}
                          onAdd={addSkill}
                          isAlreadySelected={false}
                        />
                      ))}

                      {/* Show already selected suggestions with different styling */}
                      {suggestions
                        .filter((suggestion) =>
                          localSkills.includes(suggestion),
                        )
                        .map((suggestion) => (
                          <SuggestionItem
                            key={`selected-${suggestion}`}
                            suggestion={suggestion}
                            onAdd={addSkill}
                            isAlreadySelected={true}
                          />
                        ))}
                    </ScrollView>
                  )}
                </Box>

                {filteredSuggestions.length === 0 && suggestions.length > 0 && (
                  <Text className="text-sm text-typography-400 mt-2 text-center">
                    All suggested skills are already selected
                  </Text>
                )}
              </VStack>
            )}

          {/* Empty state */}
          {localSkills.length === 0 && (
            <Box className="items-center py-8">
              <Text className="text-lg text-typography-400 text-center mb-2">
                No skills added yet
              </Text>
              <Text className="text-sm text-typography-300 text-center">
                Start typing to search and add{" "}
                {categoryConfig.title.toLowerCase()}
              </Text>
            </Box>
          )}
        </VStack>
      </ScrollView>

      {/* Footer */}
      <VStack className="px-5 pb-6 pt-4">
        <Box className="items-center mb-3">
          {isSaving ? (
            <Text className="text-blue-500 text-sm">Saving changes...</Text>
          ) : (
            <Text className="text-green-500 text-sm">All changes saved</Text>
          )}
        </Box>

        <Button
          size="xl"
          onPress={() => router.back()}
          className="w-full rounded-lg"
        >
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
