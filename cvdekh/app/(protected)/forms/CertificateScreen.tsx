import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { DynamicListForm } from "@/components/DynamicListForm";
import { FormField } from "@/components/FormField";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDynamicList } from "@/hooks/useDynamicList";
import type { CertificateEntry } from "@/store/resume/types";
import { useResumeStore } from "../../../store/resume/resumeStore";

export default function CertificateScreen() {
  const router = useRouter();
  const formData = useResumeStore((state) => state.formData);
  const updateFormData = useResumeStore((state) => state.updateFormData);

  const createEmptyCertificate = useCallback(
    (): Omit<CertificateEntry, "id"> => ({
      name: "",
      company: "",
      issueDate: "",
    }),
    []
  );

  const { items: certificate, setItems } = useDynamicList(
    formData.certificates || [],
    createEmptyCertificate
  );

  const { save, isSaving } = useAutoSave(
    (certificate: CertificateEntry[]) => {
      updateFormData("certificates", certificate);
    },
    1000,
    true
  ); // Enable saving state tracking

  const handleCertificateChange = useCallback(
    (newCertificate: CertificateEntry[]) => {
      setItems(newCertificate);
      save(newCertificate);
    },
    [setItems, save]
  );

  const renderCertificate = useCallback(
    (
      cert: CertificateEntry,
      _index: number,
      onUpdate: (updates: Partial<CertificateEntry>) => void
    ) => (
      <VStack>
        {/* Certificate Name */}
        <FormField
          label="Certificate Name"
          value={cert.name}
          onChangeText={(text) => onUpdate({ name: text })}
          placeholder="Enter certificate name"
          required
          className="mb-2"
        />

        {/* Issuing Company/Organization */}
        <FormField
          label="Company/Organization"
          value={cert.company}
          onChangeText={(text) => onUpdate({ company: text })}
          placeholder="Enter company or organization"
          required
          className="mb-2"
        />

        {/* Issue Date */}
        <FormField
          label="Issue Date"
          value={cert.issueDate}
          onChangeText={(text) => onUpdate({ issueDate: text })}
          placeholder="MMM YYYY"
          required
          type="date"
          className="mb-2"
        />
      </VStack>
    ),
    []
  );

  return (
    <VStack className="pb-4 pt-2 px-5 flex-1 bg-background-500 justify-between">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
        extraKeyboardSpace={-100}
      >
        <DynamicListForm
          items={certificate}
          onItemsChange={handleCertificateChange}
          createEmptyItem={() => ({
            ...createEmptyCertificate(),
            id: Crypto.randomUUID(),
          })}
          renderItem={renderCertificate}
          addButtonText="Add Certificate"
          minItems={0}
          maxItems={10}
        />
      </KeyboardAwareScrollView>

      <VStack className="mb-6">
        <Box className="items-center p-0">
          {isSaving ? (
            <Text className="text-blue-500">Saving...</Text>
          ) : (
            <Text className="text-green-500">Saved</Text>
          )}
        </Box>

        <Button
          size="xl"
          onPress={() => router.back()}
          className="mt-2 rounded-lg"
        >
          <ButtonText>Done</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
