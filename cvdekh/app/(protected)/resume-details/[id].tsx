import { Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useResumeStore } from "@/store/resume/resumeStore"; // Adjust path as needed
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Download,
  MapPin,
  PencilLine,
  Save,
  Trash2,
} from "lucide-react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { SkeletonLoader } from "@/components/skeleton";
import { Divider } from "@/components/ui/divider";
import { Spinner } from "@/components/ui/spinner";
import { Fab } from "@/components/ui/fab";
// Import other components you might need for displaying details

export default function ResumeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const allResumes = useResumeStore((state) => state.allResumes);
  const session = useAuthStore((state) => state.session);
  const downloadPdf = useResumeStore((state) => state.downloadGeneratedResume);
  const resume = useResumeStore((state) => state.formData);
  const isLoading = useResumeStore((state) => state.isLoading);
  const saveResume = useResumeStore((state) => state.saveResume);
  const hasChanges = useResumeStore((state) => state.hasChanges);
  const deleteResume = useResumeStore((state) => state.deleteResume);

  const handleDownload = async () => {
    console.log("Downloading resume...");
    if (session) {
      await downloadPdf(id, session);
    } else {
      alert("Session not found. Please log in.");
    }
  };

  if (!resume) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text>Resume not found.</Text>
      </Box>
    );
  }

  // Helper to render sections or arrays of strings
  const renderDetailList = (title: string, items: string[] | undefined) => {
    if (!items || items.length === 0) return null;
    return (
      <VStack className="mb-1">
        <Heading className="mb-2 text-lg text-white/80 font-bold">
          {title}
        </Heading>
        <HStack className="flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-lg bg-background-400/50"
            >
              <BadgeText className="text-white">{item}</BadgeText>
            </Badge>
          ))}
        </HStack>
      </VStack>
    );
  };

  // const renderProjectDetails = (projects: ProjectEntry[]) => {
  //   if (!projects || projects.length === 0) return null;
  //   return (
  //     <VStack className="mb-3">
  //       <Heading size="md" className="mb-2 text-white">
  //         Projects
  //       </Heading>
  //       {projects.map((project: ProjectEntry) => (
  //         <Box
  //           key={project.id}
  //           className="mb-2 p-2 border border-white/20 rounded"
  //         >
  //           <Heading size="sm" className="text-primary-400">
  //             {project.title || "N/A"}
  //           </Heading>
  //           {project.techStack && project.techStack.length > 0 && (
  //             <Text className="text-white/60 text-xs">
  //               Tech: {project.techStack.join(", ")}
  //             </Text>
  //           )}
  //           {renderDetailList("Details", project.details)}
  //         </Box>
  //       ))}
  //     </VStack>
  //   );
  // };

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      {hasChanges && (
        <Fab
          style={{
            bottom: 28,
          }}
          size="md"
          placement="bottom right"
          isHovered={false}
          isDisabled={isLoading}
          isPressed={false}
          className="rounded-lg bg-background-400 border border-white/15 shadow-none"
          onPress={() => {
            const updatedResumes = allResumes.map((r) => {
              if (r.id === id) {
                return { ...r, ...resume };
              }
              return r;
            });
            useResumeStore.setState({ allResumes: updatedResumes });
            saveResume(session!, id);
          }} // Open modal on press
        >
          {isLoading ? (
            <Spinner color="white" accessibilityLabel="Loading indicator" />
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

        {/* Job Details Section */}
        {resume.job_desc && (
          <VStack className=" items-center gap-2">
            <Text className="text-white/80 text-lg">
              {resume.job_desc.company || "N/A"}
            </Text>
            <Text className="text-white/80 text-2xl font-bold">
              {resume.job_desc.jobTitle || "N/A"}
            </Text>
            <HStack className="items-center gap-1 mb-2">
              <MapPin color={"white"} opacity={0.8} size={16} />
              <Text className="text-white/80">
                {resume.job_desc.location || "N/A"}
              </Text>
            </HStack>
            <HStack className="gap-4">
              <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                <Text className="text-white/70 text-md">Job Type</Text>
                <Text className="text-lg font-semibold">
                  {resume.job_desc.type || "N/A"}
                </Text>
              </VStack>
              <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                <Text className="text-white/70 text-md">Stipend</Text>
                <Text className="text-lg font-semibold">
                  {resume.job_desc.stipend || "N/A"}
                </Text>
              </VStack>
              <VStack className="items-start gap-1 border border-white/15 rounded-lg px-4 py-2 flex-1">
                <Text className="text-white/70 text-md">Score</Text>
                <Text className="text-lg font-semibold">
                  {resume.job_desc.matchScore || "N/A"}
                </Text>
              </VStack>
            </HStack>
            {renderDetailList("Required Skills", resume.job_desc.skills)}
          </VStack>
        )}
        <Box className="py-3">
          <Heading size="lg" className="mb-1 font-bold text-white/80">
            Improvements
          </Heading>
          <VStack className="space-y-2">
            {resume.job_desc?.improvementsORSuggestions?.map(
              (suggestion, index) => (
                <HStack key={index} className="items-start">
                  <Text className="text-primary-500 mr-2">•</Text>
                  <Text className="text-white/80 flex-1">
                    {suggestion.trim()}
                  </Text>
                </HStack>
              ),
            )}
          </VStack>
        </Box>
        <HStack className="w-full gap-2">
          <Button
            action="secondary"
            onPress={handleDownload}
            className={`color-white flex-1 rounded-lg h-16 border border-white/30 bg-background-400/30 ${
              isLoading ? "opacity-50" : ""
            }`}
          >
            <Download color={"#D9D9D9"} size={18} />
            <Text className={`font-semibold text-typography-white/90`}>
              Download
            </Text>
          </Button>
          <Button
            action="negative"
            onPress={async () => {
              if (session) {
                const success = await deleteResume(id, session);
                if (success) {
                  router.back();
                }
              } else {
                alert("Session not found. Please log in.");
              }
            }}
            className={` flex-1 rounded-lg h-16 border-white/15 bg-error-500 ${
              isLoading ? "opacity-50" : ""
            }`}
          >
            <Trash2 color={"white"} size={18} />
            <Text className={`font-semibold text-typography-white`}>
              Delete
            </Text>
          </Button>
        </HStack>
        <VStack className="pb-20 gap-2 pt-2">
          {/* Summary Section - Apply similar skeleton logic here */}
          {isLoading ? (
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
                  {resume.summary ? (
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

          {/* Projects Section - Apply similar skeleton logic here */}
          {isLoading ? (
            // Add Skeleton for Projects
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
                <VStack key={i} className="gap-1 mb-2 w-full">
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
                  <VStack key={pro.id} className="opacity-90 items-start gap-1">
                    <Text className="font-semibold">{pro.title || "N/A"}</Text>
                    <Text className="italic">
                      {pro.techStack?.join(", ") || "N/A"}
                    </Text>
                    {pro.startDate && pro.endDate && (
                      <Text>
                        {pro.startDate + " - " + pro.endDate || "N/A"}
                      </Text>
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

          {/* Skills Section - Apply similar skeleton logic here */}
          {isLoading ? (
            // Add Skeleton for Skills
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
                <SkeletonLoader
                  width={70}
                  height={28}
                  className="bg-background-300/50 rounded-lg"
                />
                <SkeletonLoader
                  width={90}
                  height={28}
                  className="bg-background-300/50 rounded-lg"
                />
                <SkeletonLoader
                  width={60}
                  height={28}
                  className="bg-background-300/50 rounded-lg"
                />
              </HStack>
              <SkeletonLoader
                width={"40%"}
                height={16}
                className="bg-background-300/50 mb-1"
              />
              <HStack className="gap-2 flex-wrap mb-2">
                <SkeletonLoader
                  width={80}
                  height={28}
                  className="bg-background-300/50 rounded-lg"
                />
                <SkeletonLoader
                  width={100}
                  height={28}
                  className="bg-background-300/50 rounded-lg"
                />
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
            <Pressable
              onPress={() => {
                router.push("/forms/SkillsScreen");
              }}
              className="w-full"
            >
              <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                <HStack className="items-center justify-between">
                  <Heading>Skills</Heading>
                  <PencilLine color={"white"} size={16} />
                </HStack>
                <VStack className="opacity-90 items-start gap-1">
                  <VStack className="gap-2">
                    <Text className="font-semibold">Languages </Text>
                    <HStack className="gap-2 flex-wrap">
                      {resume.skills?.languages?.map((lang, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="rounded-lg bg-background-400/50"
                        >
                          <BadgeText className="text-white">{lang}</BadgeText>
                        </Badge>
                      ))}
                      {(resume.skills?.languages?.length === 0 ||
                        !resume.skills?.languages) && (
                        <Text className="opacity-70">No languages listed.</Text>
                      )}
                    </HStack>
                  </VStack>
                  <VStack className="gap-2">
                    <Text className="font-semibold">Frameworks</Text>
                    <HStack className="gap-2 flex-wrap">
                      {resume.skills?.frameworks?.map((framework, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="rounded-lg bg-background-400/50"
                        >
                          <BadgeText className="text-white">
                            {framework}
                          </BadgeText>
                        </Badge>
                      ))}
                      {(resume.skills?.frameworks?.length === 0 ||
                        !resume.skills?.frameworks) && (
                        <Text className="opacity-70">
                          No frameworks listed.
                        </Text>
                      )}
                    </HStack>
                  </VStack>

                  <VStack className="gap-2">
                    <Text className="font-semibold">Others</Text>
                    <HStack className="gap-2 flex-wrap">
                      {resume.skills?.others?.map((other, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="rounded-lg bg-background-400/50"
                        >
                          <BadgeText className="text-white">{other}</BadgeText>
                        </Badge>
                      ))}
                      {(resume.skills?.others?.length === 0 ||
                        !resume.skills?.others) && (
                        <Text className="opacity-70">
                          No other skills listed.
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </VStack>
              </VStack>
            </Pressable>
          )}
        </VStack>

        {/* Resume Content Section */}
        {/* <Box className="mb-4 px-3">
          <Heading className="mb-2 text-lg font-bold text-white/80">
            Resume
          </Heading>
          {resume.summary && (
            <VStack className="mb-3">
              <Heading size="md" className="mb-1 text-white">
                Summary
              </Heading>
              <Text className="text-white/70">{resume.summary}</Text>
            </VStack>
          )}

          {resume.skills && (
            <VStack className="mb-3">
              <Heading size="md" className="mb-1 text-white">
                Skills
              </Heading>
              {renderDetailList("Languages", resume.skills.languages)}
              {renderDetailList("Frameworks", resume.skills.frameworks)}
              {renderDetailList("Others", resume.skills.others)}
            </VStack>
          )}

          {renderProjectDetails(resume.projects)}

        </Box> */}

        {/* Placeholder for Improvements - you'll need to define how these are stored and displayed */}
      </ScrollView>
    </SafeAreaView>
  );
}
