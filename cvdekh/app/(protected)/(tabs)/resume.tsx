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
import { Upload } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";

export default function Tab() {
  const [showModal, setShowModal] = useState(false);
  const disabled = true;
  return (
    <Box className="flex-1 bg-background-500">
      <Box className="flex flex-col gap-4">
        <Button
          className="bg-primary-300 mx-8 h-12"
          onPress={() => setShowModal(true)}
        >
          <Text className="text-background-700 font-semibold">
            Extract From PDF
          </Text>
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          className={`mx-8 h-12 ${disabled ? "border-background-muted" : ""}`}
        >
          <Text
            className={`font-semibold ${
              disabled ? "text-background-300" : "text-primary-300"
            }`}
          >
            Download Resume
          </Text>
        </Button>
      </Box>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md" className="text-typography-950">
              Extract Data from PDF
            </Heading>
            <ModalCloseButton>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Box className="border-2 border-dashed border-background-300 rounded-lg p-6 items-center justify-center mb-4">
              <Box className="bg-primary-500/20 p-4 rounded-full mb-4">
                <Upload color="white" size={24} />
              </Box>
              <Text className="text-typography-800 text-center mb-2">
                Drop files here
              </Text>
              <Text className="text-typography-500 text-center text-sm mb-4">
                or click to browse (max 5 files)
              </Text>

              <Pressable
                className="bg-background-200 rounded-md px-4 py-2"
                onPress={handleBrowse}
                disabled={isProcessing}
              >
                <Text className="text-typography-800">Browse...</Text>
              </Pressable>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => {
                setShowModal(false);
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              onPress={() => {
                setShowModal(false);
              }}
            >
              <ButtonText>Explore</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
