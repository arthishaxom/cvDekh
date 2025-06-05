import { ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useResumeStore, ResumeFormData } from "@/store/resume/resumeStore"; // Adjust path as needed
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Download, MapPin } from "lucide-react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
// Import other components you might need for displaying details

export default function ResumeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const allResumes = useResumeStore((state) => state.allResumes);
  const resume = allResumes.find((r) => r.id === id);
  const disabled = false;
  const session = useAuthStore((state) => state.session);
  const downloadPdf = useResumeStore((state) => state.downloadGeneratedResume);

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

  const renderProjectDetails = (projects: ResumeFormData["projects"]) => {
    if (!projects || projects.length === 0) return null;
    return (
      <VStack className="mb-3">
        <Heading size="md" className="mb-2 text-white">
          Projects
        </Heading>
        {projects.map((project) => (
          <Box
            key={project.id}
            className="mb-2 p-2 border border-white/20 rounded"
          >
            <Heading size="sm" className="text-primary-400">
              {project.title || "N/A"}
            </Heading>
            {project.techStack && project.techStack.length > 0 && (
              <Text className="text-white/60 text-xs">
                Tech: {project.techStack.join(", ")}
              </Text>
            )}
            {renderDetailList("Details", project.details)}
          </Box>
        ))}
      </VStack>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      <ScrollView className="flex-1 bg-background-500 p-4">
        <Heading
          size="xl"
          className="mb-4 text-center text-white font-semibold"
        >
          Job Details
        </Heading>

        {/* Job Details Section */}
        {resume.job_desc && (
          <VStack className="px-2 items-center gap-2">
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
        <Box className="p-3">
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
        <Button
          variant="outline"
          onPress={handleDownload}
          className={`mx-3 rounded-lg h-16 ${
            disabled ? "border-background-muted" : "border-white/15 "
          }`}
        >
          <Download color="#6cd100" size={18} />
          <Text
            className={`font-semibold ${
              disabled ? "text-background-300" : "text-primary-300"
            }`}
          >
            Download
          </Text>
        </Button>

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
