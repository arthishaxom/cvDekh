import Feather from "@expo/vector-icons/Feather";
import type * as DocumentPicker from "expo-document-picker";
import { router, useFocusEffect } from "expo-router";
import {
  CircleCheck,
  Download,
  FileOutput,
  Mail,
  Menu,
  PencilLine,
  Phone,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { SkeletonLoader } from "@/components/Skeleton";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Fab } from "@/components/ui/fab";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
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
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useResumeData } from "@/hooks/useResumeData";
import { useResumeOperations } from "@/hooks/useResumeOperations";
import { useResumeParser } from "@/hooks/useResumeParser";
import { useResumePDF } from "@/hooks/useResumePDF";
import { useAuthStore } from "@/store/auth";
import { useResumeStore } from "@/store/resume/resumeStore";
import { handleBrowse } from "@/utils/resume.util";

export default function Tab() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [dotText, setDotText] = useState("Extracting");

  // Store and auth
  const session = useAuthStore((state) => state.session);
  const { formData, hasChanges, setData } = useResumeStore();

  // Hooks
  const {
    isLoading: isDataLoading,
    error: dataError,
    fetchOriginalResume,
    refetch,
  } = useResumeData(session);

  const { isLoading: isSaving, saveResume } = useResumeOperations();

  const { isLoading: isParsing, progress, parseResume } = useResumeParser();
  const { isLoading: isDownloading, generatePDF } = useResumePDF();

  // Combined loading state
  const loading = isDataLoading || isParsing || isDownloading;

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        router.replace("/");
        return;
      }
      // Only fetch if we have a session
      fetchOriginalResume();
    }, [session, fetchOriginalResume])
  );

  useEffect(() => {
    let interval: number;

    if (isParsing) {
      // Only animate during parsing, not general loading
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
  }, [isParsing]);

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

  const onBrowse = async () => {
    try {
      const file = await handleBrowse();
      if (file) {
        setSelectedFile(file);
      }
    } catch (_error) {
      Toast.show({
        type: "eToast",
        text1: "File Selection Failed",
        text2: "Could not select file. Please try again.",
      });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
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

    try {
      await saveResume(session, null, formData);
      await setData(formData);
    } catch (error) {
      // Error is already handled in the hook
      console.error("Save failed:", error);
    }
  };

  const handleExtractAndParse = async () => {
    if (!session) {
      Toast.show({
        type: "eToast",
        text1: "Authentication Error",
        text2: "Please log in to parse resume.",
      });
      return;
    }

    if (!selectedFile) {
      Toast.show({
        type: "iToast",
        text1: "No File Selected",
        text2: "Please select a PDF file to extract.",
      });
      return;
    }

    try {
      await parseResume(session, selectedFile, () => {
        setShowModal(false);
        setSelectedFile(null);
      });
    } catch (error) {
      // Error is already handled in the hook
      console.error("Parse failed:", error);
    }
  };

  // ✅ Fixed: Proper animated style
  const paddingBottom = useSharedValue(56); // Initial value

  const animatedPaddingStyle = useAnimatedStyle(
    () => {
      paddingBottom.value = withSpring(hasChanges ? 112 : 56, {
        damping: 15,
        mass: 0.5,
        stiffness: 100,
      });

      return {
        paddingBottom: paddingBottom.value,
      };
    },
    [hasChanges] // ✅ Added dependency
  );

  // ✅ Added: Helper function for null/empty values
  const displayValue = (value: string | undefined | null, fallback = "--") => {
    if (!value || value === "null" || value.trim() === "") {
      return fallback;
    }
    return value;
  };

  // ✅ Added: Error boundary for data errors
  if (dataError) {
    return (
      <Box className="flex-1 justify-center items-center bg-background-500 px-4">
        <VStack className="items-center gap-4">
          <Text className="text-red-400 text-center">{dataError}</Text>
          <Button onPress={() => refetch()}>
            <ButtonText>Retry</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      {hasChanges && (
        <Fab
          size="md"
          placement="bottom right"
          isHovered={false}
          isDisabled={isSaving}
          isPressed={false}
          className="hover:bg-background-700 active:bg-background-700 rounded-lg bg-background-400 backdrop-blur-lg border border-white/15 shadow-none"
          onPress={handleSave}
        >
          {isSaving ? (
            <Spinner color="white" accessibilityLabel="Saving..." />
          ) : (
            <Save color={"#9DFF41"} size={20} />
          )}
        </Fab>
      )}

      <Box className="flex-1 justify-between bg-background-500">
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
          <ScrollView className="w-full">
            <Animated.View
              style={animatedPaddingStyle}
              className="flex flex-col gap-4 items-start px-4"
            >
              <HStack className="gap-4 w-full">
                <Button
                  action="secondary"
                  isDisabled={loading}
                  onPress={handleDownload}
                  className={`border border-white/15 bg-background-400/30 rounded-lg flex-1 h-16 ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  <Download color="#D9D9D9" size={18} />
                  <Text className="font-semibold text-typography-white/90">
                    Download
                  </Text>
                </Button>
                <Button
                  isDisabled={loading}
                  className={`rounded-lg bg-primary-400/90 h-16 flex-1 ${
                    loading ? "opacity-50" : "opacity-100"
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

              {/* General Info Section */}
              {loading ? (
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
                    <HStack
                      key={`n_${i + 100}`}
                      className="items-center gap-2 mb-1"
                    >
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
                      <Text>{displayValue(formData?.name)}</Text>
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
                        {displayValue(formData?.contactInfo?.linkedin)}
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
                      <Text>{displayValue(formData?.contactInfo?.github)}</Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Mail
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        size={16}
                        color="white"
                      />
                      <Text>{displayValue(formData?.contactInfo?.gmail)}</Text>
                    </HStack>
                    <HStack className="opacity-90 items-center gap-1">
                      <Phone
                        style={{ marginRight: 4 }}
                        className="opacity-90"
                        size={16}
                        color="white"
                      />
                      <Text>{displayValue(formData?.contactInfo?.phone)}</Text>
                    </HStack>
                  </VStack>
                </Pressable>
              )}

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
                      {formData?.summary ? (
                        <Text className="font-semibold">
                          {formData.summary}
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

              {/* Education Section */}
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
                  {/* Assuming 1-2 education entries for skeleton */}
                  {[...Array(2)].map((_, i) => (
                    <VStack key={`n_${i + 100}`} className="gap-1 mb-2 w-full">
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
                    {formData?.education?.map((edu, index) => (
                      <VStack
                        key={edu.id}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {displayValue(edu.field, "N/A")}
                        </Text>
                        <Text className="italic">
                          {displayValue(edu.institution, "N/A")}
                        </Text>
                        <Text>{edu.cgpa ? `CGPA - ${edu.cgpa}` : "N/A"} </Text>
                        <Text>
                          {edu.startDate && edu.endDate
                            ? `${edu.startDate} - ${edu.endDate}`
                            : "N/A"}
                        </Text>
                        {index < (formData?.education?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(formData?.education?.length === 0 ||
                      !formData?.education) && (
                      <Text className="opacity-70">
                        No education entries yet.
                      </Text>
                    )}
                  </VStack>
                </Pressable>
              )}

              {/* Experience Section */}
              {loading ? (
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
                    <VStack key={`n_${i + 100}`} className="gap-1 mb-2 w-full">
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
                    {formData?.experience?.map((exp, index) => (
                      <VStack
                        key={exp.id}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {displayValue(exp.jobTitle)}
                        </Text>
                        <Text className="italic">
                          {displayValue(exp.company, "N/A")}
                        </Text>
                        {exp.startDate && exp.endDate && (
                          <Text>{`${exp.startDate} - ${exp.endDate}`}</Text>
                        )}
                        {index < (formData?.experience?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(formData?.experience?.length === 0 ||
                      !formData?.experience) && (
                      <Text className="opacity-70">
                        No experience entries yet.
                      </Text>
                    )}
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
                    <VStack key={`n_${i + 100}`} className="gap-1 mb-2 w-full">
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
                    {formData?.projects?.map((pro, index) => (
                      <VStack
                        key={pro.id}
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
                        {index < (formData?.projects?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(formData?.projects?.length === 0 ||
                      !formData?.projects) && (
                      <Text className="opacity-70">
                        No project entries yet.
                      </Text>
                    )}
                  </VStack>
                </Pressable>
              )}

              {/* Certificates Section */}
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
                    <VStack key={`n_${i + 100}`} className="gap-1 mb-2 w-full">
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
                    router.push("/forms/CertificateScreen");
                  }}
                  className="w-full"
                >
                  <VStack className="gap-2 p-4 bg-background-400/40 border border-white/30 rounded-lg">
                    <HStack className="items-center justify-between">
                      <Heading>Certificates</Heading>
                      <PencilLine color={"white"} size={16} />
                    </HStack>
                    {formData?.certificates?.map((cert, index) => (
                      <VStack
                        key={cert.id || index}
                        className="opacity-90 items-start gap-1"
                      >
                        <Text className="font-semibold">
                          {displayValue(cert.name, "N/A")}
                        </Text>
                        <Text className="italic">{cert.company || "N/A"}</Text>
                        <Text className="italic">
                          {cert.issueDate || "N/A"}
                        </Text>
                        {index < (formData?.certificates?.length || 0) - 1 && (
                          <Divider className="my-2" />
                        )}
                      </VStack>
                    ))}
                    {(formData?.certificates?.length === 0 ||
                      !formData?.certificates) && (
                      <Text className="opacity-70">
                        No certification entries yet.
                      </Text>
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
                          {formData.skills?.languages?.map((lang, index) => (
                            <Badge
                              key={`n_${index + 100}`}
                              variant="outline"
                              className="rounded-lg bg-background-400/50"
                            >
                              <BadgeText className="text-white">
                                {lang}
                              </BadgeText>
                            </Badge>
                          ))}
                          {(formData.skills?.languages?.length === 0 ||
                            !formData.skills?.languages) && (
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
                          {formData.skills?.frameworks?.map(
                            (framework, index) => (
                              <Badge
                                key={`n_${index + 100}`}
                                variant="outline"
                                className="rounded-lg bg-background-400/50"
                              >
                                <BadgeText className="text-white">
                                  {framework}
                                </BadgeText>
                              </Badge>
                            )
                          )}
                          {(formData.skills?.frameworks?.length === 0 ||
                            !formData.skills?.frameworks) && (
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
                          {formData.skills?.others?.map((other, index) => (
                            <Badge
                              key={`n_${index + 100}`}
                              variant="outline"
                              className="rounded-lg bg-background-400/50"
                            >
                              <BadgeText className="text-white">
                                {other}
                              </BadgeText>
                            </Badge>
                          ))}
                          {(formData.skills?.others?.length === 0 ||
                            !formData.skills?.others) && (
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
            </Animated.View>
          </ScrollView>
        </Box>

        {/* Modal */}
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
                      className={`m-auto ${isParsing ? "opacity-50" : ""}`}
                      onPress={clearFile}
                      disabled={isParsing}
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
                    progress === 100 || isParsing ? "bg-background-500" : ""
                  }`}
                  onPress={handleExtractAndParse}
                  disabled={!selectedFile || isParsing}
                >
                  {isParsing || progress === 100 ? (
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
    </>
  );
}
