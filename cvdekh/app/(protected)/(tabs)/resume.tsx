import { Box } from "@/components/ui/box";
import Feather from "@expo/vector-icons/Feather";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import {
  Upload,
  Trash2,
  Download,
  FileOutput,
  PencilLine,
  Mail,
  Phone,
  User,
  Save,
  CircleCheck,
  Menu,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { handleBrowse } from "@/lib/browser";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "@/store/auth";
import { useResumeStore } from "@/store/resume/resumeStore"; // Import resume store
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { Badge, BadgeText } from "@/components/ui/badge";
import { router, useFocusEffect } from "expo-router";
import { SkeletonLoader } from "@/components/skeleton";
import { Fab } from "@/components/ui/fab";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Tab() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const session = useAuthStore((state) => state.session);
  const isLoading = useResumeStore((state) => state.isLoading);
  const parseResumeFromPDF = useResumeStore(
    (state) => state.parseResumeFromPDF,
  );
  const downloadPdf = useResumeStore((state) => state.downloadGeneratedResume);
  const resume = useResumeStore((state) => state.formData); // Get resume data from store
  const saveResume = useResumeStore((state) => state.saveResume);
  const hasChanges = useResumeStore((state) => state.hasChanges);
  const [refreshing, setRefreshing] = useState(false);
  const [dotText, setDotText] = useState("Extracting");
  const progress = useResumeStore((state) => state.progress);

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        // Handle unauthenticated state appropriately
        router.replace("/");
        return;
      }

      useResumeStore.getState().fetchResumeData(session);
    }, [session]),
  );

  useEffect(() => {
    let interval: number;

    if (isLoading) {
      let dotCount = 0;
      interval = setInterval(() => {
        dotCount = (dotCount % 4) + 1;
        switch (dotCount) {
          case 1:
            setDotText("Extracting.");
            break;
          case 2:
            setDotText("Extracting..");
            break;
          case 3:
            setDotText("Extracting...");
            break;
          case 4:
            setDotText("Extracting");
            break;
        }
      }, 500);
    } else {
      setDotText("Extracting");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const handleDownload = async () => {
    if (session) {
      await downloadPdf(null, session);
    } else {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Session expired. Please log in again.",
      });
    }
  };

  const onBrowse = async () => {
    const file = await handleBrowse();
    if (file) {
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const handleExtractAndParse = async () => {
    if (!selectedFile) {
      return; // The store will handle the alert
    }

    if (!session) {
      return; // The store will handle the alert
    }

    await parseResumeFromPDF(selectedFile, session, () => {
      setShowModal(false);
      setSelectedFile(null);
    });
  };

  const paddingBottom = useSharedValue(50); // Initial value when FAB is hidden

  // Create an animated style that reacts to changes in paddingBottom
  const animatedPaddingStyle = useAnimatedStyle(() => {
    // Update the shared value directly based on hasChanges
    // This is more efficient than useEffect as it's handled by the Reanimated native thread
    paddingBottom.value = withSpring(hasChanges ? 110 : 50, {
      damping: 15,
      mass: 0.5,
      stiffness: 100,
    });

    return {
      paddingBottom: paddingBottom.value,
    };
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background-500">
      {hasChanges && (
        <Fab
          size="md"
          placement="bottom right"
          isHovered={false}
          isDisabled={isLoading}
          isPressed={false}
          className="rounded-lg bg-background-400/30 backdrop-blur-lg border border-white/15 shadow-none"
          onPress={() => {
            saveResume(session!, null);
          }} // Open modal on press
        >
          {isLoading ? (
            <Spinner color="white" accessibilityLabel="Loading indicator" />
          ) : (
            <Save color={"#9DFF41"} size={20} />
          )}
        </Fab>
      )}
      <Box className="flex-1 justify-between">
        <HStack className="items-center justify-between px-4 py-2">
          <Menu
            color={"white"}
            size={22}
            onPress={() => {
              router.push("/(protected)/settings");
            }}
          />
          <Heading className="text-2xl flex-1 text-center">Resume</Heading>
          <Box className="w-[22px]"></Box>
        </HStack>
        <Box className="flex flex-col gap-4 pt-4">
          <ScrollView
            className="w-full "
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  useResumeStore.setState({ isInitialDataFetched: false });
                  if (!session) {
                    // Handle unauthenticated state appropriately
                    router.replace("/");
                    return;
                  }

                  useResumeStore.getState().fetchResumeData(session);
                  setRefreshing(false);
                }}
              />
            }
          >
            <Animated.View
              style={animatedPaddingStyle}
              className=" flex flex-col gap-4 items-start px-4"
            >
              <HStack className="gap-4">
                <Button
                  action="secondary"
                  isDisabled={isLoading}
                  onPress={handleDownload}
                  className={`border border-white/15 bg-background-400/30 rounded-lg flex-1 h-16 ${
                    isLoading ? "opacity-50" : ""
                  }`}
                >
                  <Download color="#D9D9D9" size={18} />
                  <Text className={`font-semibold text-typography-white/90`}>
                    Download
                  </Text>
                </Button>
                <Button
                  isDisabled={isLoading}
                  className={`rounded-lg bg-primary-400/90 h-16 flex-1 ${
                    isLoading ? "opacity-50" : "opacity-100"
                  }`}
                  onPress={() => setShowModal(true)}
                >
                  <FileOutput color="black" size={18} />
                  <Text className="text-background-900 font-semibold">
                    Extract
                  </Text>
                </Button>
              </HStack>
              <Heading>Edit/Create</Heading>

              {/* General Info Section with Skeleton Loader */}
              {isLoading ? (
                <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                  <HStack className="items-center justify-between mb-2">
                    <SkeletonLoader
                      width={120}
                      height={24}
                      className="bg-background-300/50"
                    />
                    <SkeletonLoader
                      width={16}
                      height={16}
                      className="bg-background-300/50"
                    />
                  </HStack>
                  {[...Array(5)].map((_, i) => (
                    <HStack key={i} className="items-center gap-2 mb-1">
                      <SkeletonLoader
                        width={16}
                        height={16}
                        className="bg-background-300/50"
                      />
                      <SkeletonLoader
                        width={"70%"}
                        height={16}
                        className="bg-background-300/50"
                      />
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Pressable
                  onPress={() => {
                    router.push("/forms/GeneralInfoScreen");
                  }}
                  className="w-full"
                >
                  <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                    <HStack className="items-center justify-between">
                      <Heading>General Info</Heading>
                      <PencilLine color={"white"} size={16} />
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <User
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        color={"white"}
                        size={16}
                      />
                      <Text>
                        {resume?.name === "null" ? "--" : resume?.name || "--"}
                      </Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Feather
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        name="linkedin"
                        size={16}
                        color="white"
                      />
                      <Text>
                        {resume?.contactInfo?.linkedin === "null"
                          ? "--"
                          : resume?.contactInfo?.linkedin || "--"}
                      </Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Feather
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        name="github"
                        size={16}
                        color="white"
                      />
                      <Text>
                        {resume?.contactInfo?.github === "null"
                          ? "--"
                          : resume?.contactInfo?.github || "--"}
                      </Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Mail
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        size={16}
                        color="white"
                      />
                      <Text>
                        {resume?.contactInfo?.gmail === "null"
                          ? "--"
                          : resume?.contactInfo?.gmail || "--"}
                      </Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Phone
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        size={16}
                        color="white"
                      />
                      <Text>
                        {resume?.contactInfo?.phone === "null"
                          ? "--"
                          : resume?.contactInfo?.phone || "--"}
                      </Text>
                    </HStack>
                  </VStack>
                </Pressable>
              )}

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

              {/* Education Section - Apply similar skeleton logic here */}
              {isLoading ? (
                // Add Skeleton for Education
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
                  {/* Assuming 1-2 education entries for skeleton */}
                  {[...Array(2)].map((_, i) => (
                    <VStack key={i} className="gap-1 mb-2 w-full">
                      <SkeletonLoader
                        width={"60%"}
                        height={16}
                        className="bg-background-300/50"
                      />
                      <SkeletonLoader
                        width={"80%"}
                        height={14}
                        className="bg-background-300/50"
                      />
                      <SkeletonLoader
                        width={"40%"}
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
                    router.push("/forms/EducationScreen");
                  }}
                  className="w-full"
                >
                  <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                    <HStack className="items-center justify-between">
                      <Heading>Education</Heading>
                      <PencilLine color={"white"} size={16} />
                    </HStack>
                    {resume?.education?.map((edu, index) => (
                      <VStack
                        key={edu.id}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {edu.field || "N/A"}
                        </Text>
                        <Text className="italic">
                          {edu.institution || "N/A"}
                        </Text>
                        <Text>{"CGPA - " + edu.cgpa || "N/A"}</Text>
                        <Text>
                          {edu.startDate + " - " + edu.endDate || "N/A"}
                        </Text>
                        {index < (resume?.education?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(resume?.education?.length === 0 ||
                      !resume?.education) && (
                      <Text className="opacity-70">
                        No education entries yet.
                      </Text>
                    )}
                  </VStack>
                </Pressable>
              )}

              {/* Experience Section - Apply similar skeleton logic here */}
              {isLoading ? (
                // Add Skeleton for Experience
                <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg w-full">
                  <HStack className="items-center justify-between mb-2">
                    <SkeletonLoader
                      width={120}
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
                        width={"50%"}
                        height={14}
                        className="bg-background-300/50"
                      />
                      <SkeletonLoader
                        width={"60%"}
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
                    router.push("/forms/ExperienceScreen");
                  }}
                  className="w-full"
                >
                  <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                    <HStack className="items-center justify-between">
                      <Heading>Experience</Heading>
                      <PencilLine color={"white"} size={16} />
                    </HStack>
                    {resume?.experience?.map((exp, index) => (
                      <VStack
                        key={exp.id}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {exp.jobTitle || "--"}
                        </Text>
                        <Text className="italic">{exp.company || "N/A"}</Text>
                        {exp.startDate && exp.endDate && (
                          <Text>
                            {exp.startDate + " - " + exp.endDate || "N/A"}
                          </Text>
                        )}
                        {index < (resume?.experience?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(resume?.experience?.length === 0 ||
                      !resume?.experience) && (
                      <Text className="opacity-70">
                        No experience entries yet.
                      </Text>
                    )}
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
                      <VStack
                        key={pro.id}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {pro.title || "N/A"}
                        </Text>
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
                      <Text className="opacity-70">
                        No project entries yet.
                      </Text>
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
                              <BadgeText className="text-white">
                                {lang}
                              </BadgeText>
                            </Badge>
                          ))}
                          {(resume.skills?.languages?.length === 0 ||
                            !resume.skills?.languages) && (
                            <Text className="opacity-70">
                              No languages listed.
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                      <VStack className="gap-2">
                        <Text className="font-semibold">Frameworks</Text>
                        <HStack className="gap-2 flex-wrap">
                          {resume.skills?.frameworks?.map(
                            (framework, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="rounded-lg bg-background-400/50"
                              >
                                <BadgeText className="text-white">
                                  {framework}
                                </BadgeText>
                              </Badge>
                            ),
                          )}
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
                              <BadgeText className="text-white">
                                {other}
                              </BadgeText>
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
            </Animated.View>
          </ScrollView>
        </Box>
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedFile(null);
          }}
          size="md"
        >
          <ModalBackdrop />
          <ModalContent className="bg-background-500">
            <ModalHeader>
              <Heading size="md" className="text-typography-950">
                Extract Data from PDF
              </Heading>
              <ModalCloseButton>
                <Icon
                  as={CloseIcon}
                  size="md"
                  className="stroke-background-100 group-[:hover]/modal-close-button:stroke-background-100 group-[:active]/modal-close-button:stroke-background-100 group-[:focus-visible]/modal-close-button:stroke-background-100"
                />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              {!selectedFile ? (
                <Box className="border-2 border-dashed border-background-300 rounded-lg p-6 items-center justify-center">
                  <Box className="bg-primary-500/20 p-4 rounded-full mb-4">
                    <Upload color="white" size={20} />
                  </Box>
                  <Text className="text-typography-800 text-center mb-2">
                    Select files here
                  </Text>
                  <Text className="text-typography-500 text-center text-sm mb-4">
                    only pdf files are allowed
                  </Text>

                  <Pressable
                    className="bg-background-400 rounded-md px-4 py-2"
                    onPress={onBrowse}
                  >
                    <Text className="text-typography-800">Browse...</Text>
                  </Pressable>
                </Box>
              ) : (
                <Box className="flex-row justify-between items-center gap-2 border border-background-300 p-2 rounded-md">
                  <Box className="flex-1">
                    <Text
                      numberOfLines={2}
                      isTruncated={true}
                      className="text-typography-800"
                    >
                      {selectedFile.name}
                    </Text>
                  </Box>
                  <Box className="w-16 flex justify-center">
                    <Pressable
                      className={`m-auto ${isLoading ? "opacity-50" : ""}`}
                      onPress={clearFile}
                      disabled={isLoading}
                    >
                      <Trash2 color="#ff3333" size={20} />
                    </Pressable>
                  </Box>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <VStack className="w-full">
                <Button
                  className={`w-full h-12 rounded-lg ${
                    !selectedFile ? "opacity-50" : ""
                  } ${
                    progress === 100 || isLoading ? "bg-background-500" : ""
                  }`}
                  onPress={handleExtractAndParse} // Updated onPress handler
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading || progress === 100 ? (
                    <Box className="flex flex-row gap-2">
                      {progress === 100 ? (
                        <CircleCheck size={20} color="#42f548" />
                      ) : (
                        <Spinner size="small" color="white" />
                      )}
                      <ButtonText style={{ color: "white" }}>
                        {progress === 100 ? "Extracted" : dotText}
                      </ButtonText>
                    </Box>
                  ) : (
                    <ButtonText>Extract</ButtonText>
                  )}
                </Button>
              </VStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </SafeAreaView>
  );
}
