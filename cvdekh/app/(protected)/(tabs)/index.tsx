import { Box } from "@/components/ui/box";
import { WithLocalSvg } from "react-native-svg/css";
import { Text } from "@/components/ui/text";
import { useEffect, useState, useRef } from "react"; // Added useRef
import { useResumeStore } from "@/store/resume/resumeStore";
import { useAuthStore } from "@/store/auth";
import { FlatList, Pressable } from "react-native"; // Import Pressable
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { BriefcaseBusiness, Landmark, MapPin, Plus } from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import { Textarea, TextareaInput } from "@/components/ui/textarea"; // Import Textarea
import { Link } from "expo-router";
import {
  ANIMATION_DIRECTION,
  ANIMATION_TYPE,
  SkeletonLoader,
} from "@/components/skeleton";

export default function Tab() {
  const allResumes = useResumeStore((state) => state.allResumes);
  const improveResumeWithJobDescription = useResumeStore(
    (state) => state.improveResumeWithJobDescription,
  );
  const isLoading = useResumeStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    useResumeStore.getState().fetchAllResume(useAuthStore.getState().session);
  }, []);

  const [showImproveModal, setShowImproveModal] = useState(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const finalRef = useRef(null);

  const handleImproveResume = async () => {
    if (!jobDescriptionInput.trim()) {
      alert("Please enter a job description.");
      return;
    }
    if (session) {
      await improveResumeWithJobDescription(jobDescriptionInput, session);
      setShowImproveModal(false); // Close modal on success
      setJobDescriptionInput(""); // Clear input
    } else {
      alert("Session not found. Please log in again.");
    }
  };

  if (isLoading) {
    return (
      <Box className="flex-1 bg-background-500 items-center p-4">
        <VStack className="p-4 bg-background-400/30 border border-white/15 rounded-lg w-full mb-3 gap-2">
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"20%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              style={{ marginRight: 0 }}
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"50%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"10%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="gap-2">
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <SkeletonLoader
            style={{ marginRight: 20 }}
            width={"35%"}
            height={15}
            className="rounded-lg bg-background-300/50"
            direction={ANIMATION_DIRECTION.leftToRight}
            animationType={ANIMATION_TYPE.pulse}
          />
        </VStack>
        <VStack className="p-4 bg-background-400/30 border border-white/15 rounded-lg w-full mb-3 gap-2">
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"20%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              style={{ marginRight: 0 }}
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"50%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"10%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="gap-2">
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <SkeletonLoader
            style={{ marginRight: 20 }}
            width={"35%"}
            height={15}
            className="rounded-lg bg-background-300/50"
            direction={ANIMATION_DIRECTION.leftToRight}
            animationType={ANIMATION_TYPE.pulse}
          />
        </VStack>
        <VStack className="p-4 bg-background-400/30 border border-white/15 rounded-lg w-full mb-3 gap-2">
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"20%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              style={{ marginRight: 0 }}
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="justify-between">
            <SkeletonLoader
              style={{ marginRight: 20 }}
              width={"50%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"10%"}
              height={25}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <HStack className="gap-2">
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
            <SkeletonLoader
              width={"15%"}
              height={15}
              className="rounded-lg bg-background-300/50"
              direction={ANIMATION_DIRECTION.leftToRight}
              animationType={ANIMATION_TYPE.pulse}
            />
          </HStack>
          <SkeletonLoader
            style={{ marginRight: 20 }}
            width={"35%"}
            height={15}
            className="rounded-lg bg-background-300/50"
            direction={ANIMATION_DIRECTION.leftToRight}
            animationType={ANIMATION_TYPE.pulse}
          />
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-500 items-center justify-center">
      {/* <Text>Hello</Text> */}
      <Fab
        size="md"
        placement="bottom right"
        isHovered={false}
        isDisabled={false}
        isPressed={false}
        className="rounded-lg bg-background-400/30 border border-white/15 shadow-none"
        onPress={() => setShowImproveModal(true)} // Open modal on press
      >
        <Plus color={"#9DFF41"} size={20} />
      </Fab>
      {allResumes.length > 0 ? (
        <Box className="w-full flex-1 p-4">
          <FlatList
            data={allResumes}
            renderItem={({ item }) => {
              return (
                <Link href={`../resume-details/${item.id}`} asChild>
                  <Pressable>
                    <Box className="p-4 bg-background-400/30 border border-white/15 rounded-lg w-full mb-3">
                      {item.job_desc && (
                        <VStack className="gap-0.5">
                          <HStack className="justify-between">
                            <VStack>
                              <Text className="text-md text-white/50">
                                {item.job_desc.company || "N/A"}
                              </Text>
                              <Text className="text-xl font-semibold">
                                {item.job_desc.jobTitle || "N/A"}
                              </Text>
                            </VStack>
                            <VStack className="items-end justify-start">
                              <Text className="text-md text-white/50">
                                Score
                              </Text>
                              <Text
                                className={`text-xl font-semibold ${
                                  item.job_desc.matchScore &&
                                  !isNaN(Number(item.job_desc.matchScore))
                                    ? Number(item.job_desc.matchScore) >= 75
                                      ? "text-green-500"
                                      : Number(item.job_desc.matchScore) >= 50
                                      ? "text-orange-500"
                                      : "text-red-500"
                                    : "text-primary-500"
                                }`}
                              >
                                {item.job_desc.matchScore || "N/A"}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack className="flex-wrap w-2/3 gap-x-2 gap-y-1">
                            <HStack className="items-center gap-1">
                              <MapPin color={"white"} opacity={0.6} size={16} />
                              <Text className="text-white/60 text-md">
                                {item.job_desc.location || "N/A"}
                              </Text>
                            </HStack>
                            <HStack className="items-center gap-1">
                              <BriefcaseBusiness
                                color={"white"}
                                opacity={0.6}
                                size={16}
                              />
                              <Text className="text-white/60 text-md">
                                {item.job_desc.type || "N/A"}
                              </Text>
                            </HStack>
                          </HStack>
                          <HStack className="items-center gap-1">
                            <Landmark color={"white"} opacity={0.6} size={16} />
                            <Text className="text-white/60 text-md">
                              {item.job_desc.stipend || "N/A"}
                            </Text>
                          </HStack>
                        </VStack>
                      )}
                      {/* Add more details or an edit button here */}
                    </Box>
                  </Pressable>
                </Link>
              );
            }}
            keyExtractor={(item) => item.id!}
          />
        </Box>
      ) : (
        <Box className="flex flex-col items-center">
          <WithLocalSvg
            asset={require("@/assets/images/Document_empty.svg")}
            width={120}
            height={120}
            color={"#ffffff"}
          />
          <Text className="font-semibold text-xl py-2">
            No jobs/resume found
          </Text>
          <Text className="text-lg text-white/40 text-center w-[24rem]">
            Make sure you have a resume added, if yes then add a job using +
            button
          </Text>
        </Box>
      )}

      {/* Improve Resume Modal */}
      <Modal
        isOpen={showImproveModal}
        onClose={() => {
          setShowImproveModal(false);
          setJobDescriptionInput(""); // Clear input on close
        }}
        finalFocusRef={finalRef}
        size="lg"
      >
        <ModalBackdrop />
        <ModalContent className="bg-background-500">
          <ModalHeader>
            <Heading size="md">Improve Resume for Job</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text className="mb-2 text-typography-500">
              Paste the job description below to tailor your resume.
            </Text>
            <Textarea size="md" className="h-48 w-full">
              <TextareaInput
                placeholder="Enter job description here..."
                value={jobDescriptionInput}
                onChangeText={setJobDescriptionInput}
                multiline={true}
                style={{
                  textAlignVertical: "top",
                }}
              />
            </Textarea>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => {
                setShowImproveModal(false);
                setJobDescriptionInput("");
              }}
              className="flex-1"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              className="flex-1"
              onPress={handleImproveResume}
              isDisabled={isLoading}
            >
              <ButtonText>{isLoading ? "Improving..." : "Improve"}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
