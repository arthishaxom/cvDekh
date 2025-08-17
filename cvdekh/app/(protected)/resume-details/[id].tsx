import * as Crypto from "expo-crypto";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Download,
  MapPin,
  PencilLine,
  Save,
  Trash2,
} from "lucide-react-native";
import { useCallback } from "react";
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
import { useResumePDF } from "@/hooks/useResumePDF";
import { useAuthStore } from "@/store/auth";
import { useResumeStore } from "@/store/resume/resumeStore";

export default function ResumeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useAuthStore((state) => state.session);
  const hasChanges = useResumeStore((state) => state.hasChanges);
  const { setData } = useResumeStore();

  // Hooks
  const {
    isLoading: isOperationLoading,
    saveResume,
    deleteResume,
  } = useResumeOperations();

  const { isLoading: isDownloading, generatePDF } = useResumePDF();

  // Find the specific resume
  const resume = useResumeStore((state) => state.formData);
  const jobDesc = useResumeStore((state) => state.job_desc);

  // Helper function to display values safely
  const displayValue = useCallback(
    (value: string | undefined | null, fallback = "--") => {
      if (!value || value === "null" || value.trim() === "") {
        return fallback;
      }
      return value;
    },
    []
  );

  // Handle download
  const handleDownload = async () => {
    if (!session) {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Session expired. Please log in again.",
      });
      return;
    }

    try {
      await generatePDF(session, undefined);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleSave = async () => {
    if (!session) {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Please log in to save your resume.",
      });
      return;
    }
    if (!resume) {
      Toast.show({
        type: "eToast",
        text1: "Resume Error",
        text2: "Resume data not found.",
      });
      return;
    }

    try {
      await saveResume(session, id, resume);
      setData(resume);
    } catch (error) {
      // Error is already handled in the hook
      console.error("Save failed:", error);
    }
  };

  // Handle delete with navigation
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

  // Helper to render detail lists
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

  // Loading state
  const loading = isOperationLoading || isDownloading;

  // Handle case when resume is not found
  if (!resume) {
    return (
      <Box className="flex-1 justify-center items-center bg-background-500">
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text className="text-white text-center mb-4">Resume not found.</Text>
        <Button onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      {hasChanges && (
        <Fab
          size="md"
          placement="bottom right"
          isHovered={false}
          isDisabled={loading}
          isPressed={false}
          className="hover:bg-background-700 active:bg-background-700 rounded-lg bg-background-400 backdrop-blur-lg border border-white/15 shadow-none"
          onPress={handleSave}
        >
          {loading ? (
            <Spinner color="white" accessibilityLabel="Saving..." />
          ) : (
            <Save color={"#9DFF41"} size={20} />
          )}
        </Fab>
      )}
      <Box className="flex-1 bg-background-500">
        <Stack.Screen
          options={{ title: jobDesc?.jobTitle || "Resume Details" }}
        />

        <ScrollView className="flex-1 bg-background-500 p-4">
          <Heading
            size="xl"
            className="mb-4 text-center text-white font-semibold"
          >
            Job Details
          </Heading>

          {/* Job Details Section */}
          {jobDesc ? (
            <VStack className="items-center gap-2 mb-2">
              <Text className="text-white/80 text-lg">{jobDesc.company}</Text>
              <Text className="text-white/80 text-center text-2xl font-bold">
                {jobDesc.jobTitle ? jobDesc.jobTitle : "N/A"}
              </Text>
              <HStack className="items-center gap-1 mb-2">
                <MapPin color={"white"} opacity={0.8} size={16} />
                <Text className="text-white/80">
                  {jobDesc.location ? jobDesc.location : "N/A"}
                </Text>
              </HStack>
              <HStack className="gap-4">
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Job Type</Text>
                  <Text className="text-lg font-semibold">
                    {jobDesc.type ? jobDesc.type : "N/A"}
                  </Text>
                </VStack>
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Stipend</Text>
                  <Text className="text-lg font-semibold">
                    {jobDesc.stipend ? jobDesc.stipend : "N/A"}
                  </Text>
                </VStack>
                <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                  <Text className="text-white/70 text-md">Score</Text>
                  <Text className="text-lg font-semibold">
                    {jobDesc.matchScore ? jobDesc.matchScore : "N/A"}
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

          {/* Improvements Section */}
          {jobDesc?.improvementsORSuggestions &&
            jobDesc.improvementsORSuggestions.length > 0 && (
              <Box className="mb-4">
                <Text size="lg" className="mb-3 font-bold text-white/80">
                  Improvements & Suggestions
                </Text>
                <VStack className="space-y-2">
                  {jobDesc.improvementsORSuggestions.map(
                    (suggestion, _index) => (
                      <HStack key={Crypto.randomUUID()} className="items-start">
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

          {/* Action Buttons */}
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

          {/* Resume Sections */}
          <VStack className="pb-6 gap-4">
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
                    {resume?.summary ? (
                      <Text className="font-semibold">{resume.summary}</Text>
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
                    key={Crypto.randomUUID()}
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
                  {resume?.projects?.map((pro, index) => (
                    <VStack
                      key={pro.id || `project-${index}`}
                      className="opacity-90 items-start gap-1"
                    >
                      <Text className="font-semibold">
                        {displayValue(pro.title, "N/A")}
                      </Text>
                      <Text className="italic">
                        {typeof pro.techStack === "string"
                          ? pro.techStack
                          : pro.techStack?.join(", ") || "--"}
                      </Text>
                      {pro.startDate && pro.endDate && (
                        <Text>{`${pro.startDate} - ${pro.endDate}`}</Text>
                      )}
                      {index < (resume?.projects?.length || 0) - 1 && (
                        <Divider className="my-2" />
                      )}
                    </VStack>
                  ))}
                  {(resume?.projects?.length === 0 || !resume?.projects) && (
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
                      key={Crypto.randomUUID()}
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
                      key={Crypto.randomUUID()}
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
                        {resume?.skills?.languages?.map((lang, index) => (
                          <Badge
                            key={`language-${index}-${lang}`}
                            variant="outline"
                            className="rounded-lg bg-background-400/50"
                          >
                            <BadgeText className="text-white">{lang}</BadgeText>
                          </Badge>
                        ))}
                        {(resume?.skills?.languages?.length === 0 ||
                          !resume?.skills?.languages) && (
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
                        {resume?.skills?.frameworks?.map((framework, index) => (
                          <Badge
                            key={`framework-${index}-${framework}`}
                            variant="outline"
                            className="rounded-lg bg-background-400/50"
                          >
                            <BadgeText className="text-white">
                              {framework}
                            </BadgeText>
                          </Badge>
                        ))}
                        {(resume?.skills?.frameworks?.length === 0 ||
                          !resume?.skills?.frameworks) && (
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
                        {resume?.skills?.others?.map((other, index) => (
                          <Badge
                            key={`other-${index}-${other}`}
                            variant="outline"
                            className="rounded-lg bg-background-400/50"
                          >
                            <BadgeText className="text-white">
                              {other}
                            </BadgeText>
                          </Badge>
                        ))}
                        {(resume?.skills?.others?.length === 0 ||
                          !resume?.skills?.others) && (
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
      </Box>
    </SafeAreaView>
  );
}
