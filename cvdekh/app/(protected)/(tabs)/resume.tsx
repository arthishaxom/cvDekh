import { Box } from "@/components/ui/box";
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
import { Upload, Trash2, Download, FileOutput } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable } from "react-native";
import { handleBrowse } from "@/lib/browser";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "@/store/auth";
import { useResumeStore } from "@/store/resumeStore"; // Import resume store
import axios, { isAxiosError } from "axios"; // Import axios
import { Spinner } from "@/components/ui/spinner";
import { fieldList } from "@/lib/utils"; // Import fieldList
import { VStack } from "@/components/ui/vstack";
import { FieldButton } from "@/components/fieldButton";
import { HStack } from "@/components/ui/hstack";
import { ExternalPathString, router } from "expo-router";

export default function Tab() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const disabled = false; // This seems to be unused, consider removing or implementing
  const session = useAuthStore((state) => state.session);
  const setInitialData = useResumeStore((state) => state.setInitialData); // Get action from resume store
  const [isLoading, setIsLoading] = useState(false);
  const signOut = useAuthStore((state) => state.signOut); // Get action from auth store

  const onClick = async () => {
    if (!session || !session.access_token) {
      Alert.alert(
        "Authentication Error",
        "You are not signed in or your session is invalid. Please sign in again.",
      );
      return;
    }

    await useAuthStore.getState().signOut();
    // After signing out, redirect to the sign-in screen
    router.replace("/signin");

    // Ensure you have EXPO_PUBLIC_API_URL in your .env file for the frontend
    // or replace with your backend's actual URL
    // const backendApiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

    // try {
    //   const response = await axios.get(`${backendApiUrl}/api/ok`, {
    //     headers: {
    //       Authorization: `Bearer ${session.access_token}`,
    //       // 'Content-Type': 'application/json', // Not typically needed for GET requests with axios
    //     },
    //   });

    //   // axios wraps the response data in a 'data' property
    //   const data = response.data;

    //   // With axios, successful responses (2xx) don't throw errors by default,
    //   // so we can directly use the data.
    //   // The status code is available in response.status
    //   if (response.status === 200) {
    //     Alert.alert(
    //       "API Test Successful!",
    //       `Message: ${data.message}\nUser Email: ${data.email || "N/A"}`,
    //     );
    //   } else {
    //     // This block might not be reached if axios default error handling is used for non-2xx.
    //     // Non-2xx responses will typically throw an error and be caught by the catch block.
    //     Alert.alert(
    //       "API Test Error",
    //       `Status: ${response.status}\nMessage: ${
    //         data.message || "Unknown error"
    //       }`,
    //     );
    //   }
    // } catch (error: any) {
    //   console.error("Error calling /api/ok:", error);
    //   if (isAxiosError(error)) {
    //     // Access error.response, error.request, error.message from AxiosError
    //     const status = error.response?.status || "N/A";
    //     const message =
    //       error.response?.data?.message ||
    //       error.message ||
    //       "An unknown error occurred";
    //     Alert.alert(
    //       "API Request Failed",
    //       `Status: ${status}\nMessage: ${message}`,
    //     );
    //   } else {
    //     // Handle non-Axios errors
    //     Alert.alert(
    //       "Network Error",
    //       `Failed to connect to the server: ${error.message}`,
    //     );
    //   }
    // }
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
      Alert.alert("No File Selected", "Please select a PDF file to extract.");
      return;
    }
    if (!session || !session.access_token) {
      Alert.alert(
        "Authentication Error",
        "You are not signed in or your session is invalid. Please sign in again.",
      );
      return;
    }

    const backendApiUrl =
      process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
    const formData = new FormData();
    // The backend expects the file under the field name 'resume'
    formData.append("resume", {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || "application/pdf", // Ensure a fallback MIME type
    } as any);

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${backendApiUrl}/api/resume/parse-resume`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data) {
        setInitialData(response.data);
        console.log(
          "Current store state (after update):",
          useResumeStore.getState().formData,
        );
        Alert.alert(
          "Extraction Successful",
          `Resume data has been parsed and loaded into the form.`,
        );
      } else {
        Alert.alert("Extraction Failed", "No data received from server.");
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      if (isAxiosError(error)) {
        const status = error.response?.status || "N/A";
        const message =
          error.response?.data?.message ||
          error.message ||
          "An unknown error occurred during parsing.";
        Alert.alert(
          "Parsing Request Failed",
          `Status: ${status}\nMessage: ${message}`,
        );
      } else {
        Alert.alert(
          "Parsing Error",
          `Failed to parse the resume: ${(error as Error).message}`,
        );
      }
    } finally {
      setIsLoading(false);
      setShowModal(false);
      setSelectedFile(null);
    }
  };

  return (
    <Box className="flex-1 bg-background-500">
      <Box className="flex flex-col gap-4 pt-4">
        <VStack className="gap-4 justify-center items-start px-4">
          <Heading>Edit/Create</Heading>
          {/* <Divider className="bg-white/30" /> */}
          {fieldList().map((field) => (
            <FieldButton
              key={field.title}
              title={field.title}
              onPress={() => router.push(field.path as ExternalPathString)}
            />
          ))}
          <HStack className="gap-4">
            <Button
              variant="outline"
              onPress={onClick}
              className={`flex-1 h-16 ${
                disabled ? "border-background-muted" : "border-primary-300 "
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
            <Button
              className="bg-primary-300 h-16 flex-1"
              onPress={() => setShowModal(true)}
            >
              <FileOutput color="black" size={18} />
              <Text className="text-background-900 font-semibold">Extract</Text>
            </Button>
          </HStack>
        </VStack>
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
                  <Upload color="white" size={24} />
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
            <Button
              className={`w-full h-12 ${isLoading ? "opacity-50" : ""}`}
              onPress={handleExtractAndParse} // Updated onPress handler
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? (
                <Box className="flex flex-row gap-2">
                  <Spinner size="small" color={"white"} />
                  <ButtonText>Extracting...</ButtonText>
                </Box>
              ) : (
                <ButtonText>Extract</ButtonText>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
