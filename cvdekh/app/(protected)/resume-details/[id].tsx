import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Download,
  MapPin,
  PencilLine,
  Save,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { SkeletonLoader } from "@/components/Skeleton";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Fab } from "@/components/ui/fab";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useResumeOperations } from "@/hooks/useResumeOperations";
import { useAuthStore } from "@/store/auth";
import { useResumeStore } from "@/store/resume/resumeStore";

export default function ResumeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FIXED: Get data from correct store sources
  const allResumes = useResumeStore((state) => state.allResumes);
  const session = useAuthStore((state) => state.session);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  // ✅ FIXED: Use hooks for operations
  const {
    isLoading: isOperationLoading,
    saveResume,
    deleteResume,
    downloadResume,
  } = useResumeOperations();

  // ✅ FIXED: Find the specific resume from allResumes
  const resume = allResumes.find((r) => r.id === id);

  // ✅ FIXED: Get job_desc from the specific resume, not global state
  const jobDesc = resume?.job_desc;

  // ✅ FIXED: Track local changes for this specific resume
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [localResumeData, setLocalResumeData] = useState(resume);

  // ✅ FIXED: Update local data when resume changes
  useEffect(() => {
    if (resume) {
      setLocalResumeData(resume);
      setHasLocalChanges(false);
    }
  }, [resume]);

  // ✅ FIXED: Helper function to display values safely
  const displayValue = useCallback(
    (value: string | undefined | null, fallback = "--") => {
      if (!value || value === "null" || value === "") {
        return fallback;
      }
      return value;
    },
    []
  );

  // ✅ FIXED: Handle download with proper error handling
  const handleDownload = useCallback(async () => {
    if (!session) {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Please log in to continue",
      });
      return;
    }

    try {
      await downloadResume(session, id);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [session, id, downloadResume]);

  // ✅ FIXED: Handle save with proper state management
  const handleSave = useCallback(async () => {
    if (!session || !localResumeData) {
      Toast.show({
        type: "eToast",
        text1: "Save Failed",
        text2: "Missing session or resume data",
      });
      return;
    }

    try {
      await saveResume(session, id, localResumeData);

      // ✅ Update the store with the saved data
      const updatedResumes = allResumes.map((r) =>
        r.id === id ? { ...r, ...localResumeData } : r
      );
      useResumeStore.setState({ allResumes: updatedResumes });

      setHasLocalChanges(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  }, [session, id, localResumeData, saveResume, allResumes]);

  // ✅ FIXED: Handle delete with navigation
  const handleDelete = useCallback(async () => {
    if (!session) {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Session not found. Please log in to continue",
      });
      return;
    }

    try {
      const result = await deleteResume(session, id);
      if (result.success) {
        router.back();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [session, id, deleteResume]);

  // ✅ FIXED: Helper to render detail lists
  const renderDetailList = useCallback(
    (title: string, items: string[] | undefined) => {
      if (!items || items.length === 0) return null;
      return (
        <VStack className="mb-1 w-full">
          <Heading className="mb-2 text-lg text-white/80 font-bold">
            {title}
          </Heading>
          <HStack className="flex-wrap items-center gap-2">
            {items.map((item, index) => (
              <Badge
                key={`${title}-${index}-${item}`}
                variant="outline"
                className="rounded-lg bg-background-400/50"
              >
                <BadgeText className="text-white">{item}</BadgeText>
              </Badge>
            ))}
          </HStack>
        </VStack>
      );
    },
    []
  );

  // ✅ FIXED: Better loading state
  const loading = isLoading || isOperationLoading;

  // ✅ FIXED: Handle case when resume is not found
  if (!resume) {
    return (
      <VStack className="flex-1 justify-center items-center bg-background-500">
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text className="text-white text-center mb-4">Resume not found.</Text>
        <Button onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </VStack>
    );
  }

  // ✅ FIXED: Handle loading state
  if (loading && !localResumeData) {
    return (
      <VStack className="flex-1 justify-center items-center bg-background-500">
        <Stack.Screen options={{ title: "Loading..." }} />
        <Spinner size="large" color="white" />
        <Text className="text-white mt-4">Loading resume details...</Text>
      </VStack>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      <VStack className="flex-1 bg-background-500">
        <Stack.Screen
          options={{ title: jobDesc?.jobTitle || "Resume Details" }}
        />

        {/* ✅ FIXED: Show fab only when there are local changes */}
        {hasLocalChanges && (
          <Fab
            style={{ bottom: 28 }}
            size="md"
            placement="bottom right"
            isHovered={false}
            isDisabled={loading}
            isPressed={false}
            className="rounded-lg bg-background-400 border border-white/15 shadow-none"
            onPress={handleSave}
          >
            {loading ? (
              <Spinner color="white" accessibilityLabel="Saving..." />
            ) : (
              <Save color={"#9DFF41"} size={20} />
            )}
          </Fab>
        )}

        <ScrollView className="flex-1 bg-background-500 p-4">
          <Heading
            size="xl"
            className="mb-4 text-center text-white font-semibold"
          >
            Job Details
          </Heading>

          {/* ✅ FIXED: Job Details Section using jobDesc */}
          {jobDesc ? (
            <VStack className="items-center gap-2 mb-6">
              <Text className="text-white/80 text-lg">
                {displayValue(jobDesc.company)}
              </Text>
              <Text className="text-white/80 text-center text-2xl font-bold">
                {displayValue(jobDesc.jobTitle)}
              </Text>
              <HStack className="items-center gap-1 mb-2">
                <MapPin color={"white"} opacity={0.8} size={16} />
                <Text className="text-white/80">
                  {displayValue(jobDesc.location)}
                </Text>
              </HStack>
              <HStack className="gap-4">
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Job Type</Text>
                  <Text className="text-lg font-semibold">
                    {displayValue(jobDesc.type)}
                  </Text>
                </VStack>
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Stipend</Text>
                  <Text className="text-lg font-semibold">
                    {displayValue(jobDesc.stipend)}
                  </Text>
                </VStack>
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Score</Text>
                  <Text className="text-lg font-semibold">
                    {displayValue(jobDesc.matchScore)}
                  </Text>
                </VStack>
              </HStack>
              {renderDetailList("Required Skills", jobDesc.skills)}
            </VStack>
          ) : (
            <VStack className="items-center gap-2 mb-6 p-4 border border-white/15 rounded-lg">
              <Text className="text-white/70 text-center">
                No job description available for this resume.
              </Text>
            </VStack>
          )}

          {/* ✅ FIXED: Improvements Section */}
          {jobDesc?.improvementsORSuggestions &&
            jobDesc.improvementsORSuggestions.length > 0 && (
              <Box className="py-3 mb-4">
                <Heading size="lg" className="mb-3 font-bold text-white/80">
                  Improvements & Suggestions
                </Heading>
                <VStack className="space-y-2">
                  {jobDesc.improvementsORSuggestions.map(
                    (suggestion, index) => (
                      <HStack
                        key={`suggestion-${index}`}
                        className="items-start"
                      >
                        <Text className="text-primary-500 mr-2">•</Text>
                        <Text className="text-white/80 flex-1">
                          {suggestion.trim()}
                        </Text>
                      </HStack>
                    )
                  )}
                </VStack>
              </Box>
            )}

          {/* ✅ FIXED: Action Buttons */}
          <HStack className="w-full gap-2 mb-4">
            <Button
              action="secondary"
              onPress={handleDownload}
              isDisabled={loading}
              className={`flex-1 rounded-lg h-16 border border-white/30 bg-background-400/30 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Download color={"#D9D9D9"} size={18} />
              <Text className="font-semibold text-typography-white/90">
                Download
              </Text>
            </Button>
            <Button
              action="negative"
              onPress={handleDelete}
              isDisabled={loading}
              className={`flex-1 rounded-lg h-16 bg-error-500 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Trash2 color={"white"} size={18} />
              <Text className="font-semibold text-typography-white">
                Delete
              </Text>
            </Button>
          </HStack>

          {/* ✅ FIXED: Resume Sections */}
          <VStack className="pb-20 gap-4">
            {/* Summary Section */}
            {loading ? (
              <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                <HStack className="items-center justify-between mb-2">
                  <SkeletonLoader
                    width={100}
                    height={24}
                    className="bg-background-300/50"
                  />
                  <SkeletonLoader
                    width={16}
                    height={16}
                    className="bg-background-300/50"
                  />
                </HStack>
                <SkeletonLoader
                  width={"90%"}
                  height={16}
                  className="bg-background-300/50 mb-1"
                />
                <SkeletonLoader
                  width={"80%"}
                  height={16}
                  className="bg-background-300/50 mb-1"
                />
              </VStack>
            ) : (
              <Pressable
                onPress={() => {
                  router.push("/forms/ProfileSummaryScreen");
                }}
                className="w-full"
              >
                <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                  <HStack className="items-center justify-between">
                    <Heading>Summary</Heading>
                    <PencilLine color={"white"} size={16} />
                  </HStack>
                  <VStack className="opacity-90 items-start gap-1">
                    {localResumeData?.summary ? (
                      <Text className="font-semibold">
                        {localResumeData.summary}
                      </Text>
                    ) : (
                      <Text className="font-semibold opacity-70">
                        No Summary added.
                      </Text>
                    )}
                  </VStack>
                </VStack>
              </Pressable>
            )}

            {/* Projects Section */}
            {loading ? (
              <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                <HStack className="items-center justify-between mb-2">
                  <SkeletonLoader
                    width={100}
                    height={24}
                    className="bg-background-300/50"
                  />
                  <SkeletonLoader
                    width={16}
                    height={16}
                    className="bg-background-300/50"
                  />
                </HStack>
                {[...Array(2)].map((_, i) => (
                  <VStack
                    key={`project-skeleton-${i}`}
                    className="gap-1 mb-2 w-full"
                  >
                    <SkeletonLoader
                      width={"70%"}
                      height={16}
                      className="bg-background-300/50"
                    />
                    <SkeletonLoader
                      width={"90%"}
                      height={14}
                      className="bg-background-300/50"
                    />
                    <SkeletonLoader
                      width={"50%"}
                      height={14}
                      className="bg-background-300/50"
                    />
                    {i < 1 && (
                      <Divider className="my-2 bg-background-300/50 h-px border-0" />
                    )}
                  </VStack>
                ))}
              </VStack>
            ) : (
              <Pressable
                onPress={() => {
                  router.push("/forms/ProjectsScreen");
                }}
                className="w-full"
              >
                <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                  <HStack className="items-center justify-between">
                    <Heading>Projects</Heading>
                    <PencilLine color={"white"} size={16} />
                  </HStack>
                  {localResumeData?.projects?.map((pro, index) => (
                    <VStack
                      key={pro.id || `project-${index}`}
                      className="opacity-90 items-start gap-1"
                    >
                      <Text className="font-semibold">
                        {displayValue(pro.title, "N/A")}
                      </Text>
                      <Text className="italic">
                        {pro.techStack?.length
                          ? pro.techStack.join(", ")
                          : "N/A"}
                      </Text>
                      {pro.startDate && pro.endDate && (
                        <Text>{`${pro.startDate} - ${pro.endDate}`}</Text>
                      )}
                      {index < (localResumeData?.projects?.length || 0) - 1 && (
                        <Divider className="my-2" />
                      )}
                    </VStack>
                  ))}
                  {(localResumeData?.projects?.length === 0 ||
                    !localResumeData?.projects) && (
                    <Text className="opacity-70">No project entries yet.</Text>
                  )}
                </VStack>
              </Pressable>
            )}

            {/* Skills Section */}
            {loading ? (
              <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                <HStack className="items-center justify-between mb-2">
                  <SkeletonLoader
                    width={80}
                    height={24}
                    className="bg-background-300/50"
                  />
                  <SkeletonLoader
                    width={16}
                    height={16}
                    className="bg-background-300/50"
                  />
                </HStack>
                <SkeletonLoader
                  width={"40%"}
                  height={16}
                  className="bg-background-300/50 mb-1"
                />
                <HStack className="gap-2 flex-wrap mb-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonLoader
                      key={`skill-skeleton-${i}`}
                      width={70 + i * 10}
                      height={28}
                      className="bg-background-300/50 rounded-lg"
                    />
                  ))}
                </HStack>
                <SkeletonLoader
                  width={"40%"}
                  height={16}
                  className="bg-background-300/50 mb-1"
                />
                <HStack className="gap-2 flex-wrap mb-2">
                  {[...Array(2)].map((_, i) => (
                    <SkeletonLoader
                      key={`framework-skeleton-${i}`}
                      width={80 + i * 20}
                      height={28}
                      className="bg-background-300/50 rounded-lg"
                    />
                  ))}
                </HStack>
                <SkeletonLoader
                  width={"40%"}
                  height={16}
                  className="bg-background-300/50 mb-1"
                />
                <HStack className="gap-2 flex-wrap">
                  <SkeletonLoader
                    width={70}
                    height={28}
                    className="bg-background-300/50 rounded-lg"
                  />
                </HStack>
              </VStack>
            ) : (
              <VStack className="gap-1 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                <HStack className="items-center justify-between">
                  <Heading>Skills</Heading>
                </HStack>

                <VStack className="opacity-90 items-start gap-3">
                  {/* Languages Category */}
                  <Pressable
                    onPress={() => {
                      router.push(`/forms/SkillsScreen?category=languages`);
                    }}
                    className="w-full"
                  >
                    <VStack className="gap-2 w-full">
                      <HStack className="items-center justify-between pb-1 pr-1 rounded-md">
                        <Text className="font-semibold">Languages</Text>
                        <PencilLine color={"white"} size={14} />
                      </HStack>

                      <HStack className="gap-2 flex-wrap">
                        {localResumeData?.skills?.languages?.map(
                          (lang, index) => (
                            <Badge
                              key={`language-${index}-${lang}`}
                              variant="outline"
                              className="rounded-lg bg-background-400/50"
                            >
                              <BadgeText className="text-white">
                                {lang}
                              </BadgeText>
                            </Badge>
                          )
                        )}
                        {(localResumeData?.skills?.languages?.length === 0 ||
                          !localResumeData?.skills?.languages) && (
                          <Text className="opacity-70">
                            No languages listed.
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Pressable>

                  {/* Frameworks Category */}
                  <Pressable
                    onPress={() => {
                      router.push(`/forms/SkillsScreen?category=frameworks`);
                    }}
                    className="w-full"
                  >
                    <VStack className="gap-2 w-full">
                      <HStack className="items-center justify-between pb-1 pr-1 rounded-md">
                        <Text className="font-semibold">Frameworks</Text>
                        <PencilLine color={"white"} size={14} />
                      </HStack>

                      <HStack className="gap-2 flex-wrap">
                        {localResumeData?.skills?.frameworks?.map(
                          (framework, index) => (
                            <Badge
                              key={`framework-${index}-${framework}`}
                              variant="outline"
                              className="rounded-lg bg-background-400/50"
                            >
                              <BadgeText className="text-white">
                                {framework}
                              </BadgeText>
                            </Badge>
                          )
                        )}
                        {(localResumeData?.skills?.frameworks?.length === 0 ||
                          !localResumeData?.skills?.frameworks) && (
                          <Text className="opacity-70">
                            No frameworks listed.
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Pressable>

                  {/* Others Category */}
                  <Pressable
                    onPress={() => {
                      router.push(`/forms/SkillsScreen?category=others`);
                    }}
                    className="w-full"
                  >
                    <VStack className="gap-2 w-full">
                      <HStack className="items-center justify-between pb-1 pr-1 rounded-md">
                        <Text className="font-semibold">Others</Text>
                        <PencilLine color={"white"} size={14} />
                      </HStack>

                      <HStack className="gap-2 flex-wrap">
                        {localResumeData?.skills?.others?.map(
                          (other, index) => (
                            <Badge
                              key={`other-${index}-${other}`}
                              variant="outline"
                              className="rounded-lg bg-background-400/50"
                            >
                              <BadgeText className="text-white">
                                {other}
                              </BadgeText>
                            </Badge>
                          )
                        )}
                        {(localResumeData?.skills?.others?.length === 0 ||
                          !localResumeData?.skills?.others) && (
                          <Text className="opacity-70">
                            No other skills listed.
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Pressable>
                </VStack>
              </VStack>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
