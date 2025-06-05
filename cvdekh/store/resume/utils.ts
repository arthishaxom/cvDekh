import * as FileSystem from "expo-file-system";
import { Alert, Platform } from "react-native";
import * as Crypto from "expo-crypto";

export const downloadPDFToDevice = async (
  pdfUrl: string,
  fileName: string = "resume.pdf",
) => {
  try {
    // For Android, use Storage Access Framework
    if (Platform.OS === "android") {
      // Request permission to create a document
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert(
          "Permission needed",
          "Storage permission is required to save the PDF.",
        );
        return;
      }

      // Download the file to memory first
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        FileSystem.cacheDirectory + fileName,
      );

      if (downloadResult.status === 200) {
        // Read the downloaded file as a string (base64)
        const fileContent = await FileSystem.readAsStringAsync(
          downloadResult.uri,
          { encoding: FileSystem.EncodingType.Base64 },
        );

        // Create the file in the selected directory using SAF
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf",
        )
          .then(async (uri) => {
            // Write the content to the new file
            await FileSystem.writeAsStringAsync(uri, fileContent, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert("Success", "PDF saved successfully!");
          })
          .catch((error) => {
            throw new Error(`Failed to create file: ${error.message}`);
          });
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}`,
        );
      }
    } else {
      // For iOS, fall back to the previous method
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert(
          "Download Complete",
          `File saved to: ${downloadResult.uri}`,
        );
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}`,
        );
      }
    }
  } catch (error: any) {
    console.error("Error during PDF download or saving process:", error);
    Alert.alert(
      "Error",
      `An error occurred while saving the PDF: ${error.message}`,
    );
  }
};

export const ensureListItemsHaveIds = <T extends { id?: string }>(
  items: T[] | undefined,
): T[] => {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    id: item.id || Crypto.randomUUID(),
  }));
};
