import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

export const downloadPDFToDevice = async (
  pdfUrl: string,
  fileName: string = "resume.pdf"
) => {
  try {
    // For Android, use Storage Access Framework
    if (Platform.OS === "android") {
      // Request permission to create a document
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Toast.show({
          type: "iToast",
          text1: "Permission Required",
          text2: "Storage permission is required to save the PDF.",
        });
        return;
      }

      // Download the file to memory first
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        FileSystem.cacheDirectory + fileName
      );

      if (downloadResult.status === 200) {
        // Read the downloaded file as a string (base64)
        const fileContent = await FileSystem.readAsStringAsync(
          downloadResult.uri,
          { encoding: FileSystem.EncodingType.Base64 }
        );

        // Create the file in the selected directory using SAF
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf"
        )
          .then(async (uri) => {
            // Write the content to the new file
            await FileSystem.writeAsStringAsync(uri, fileContent, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Toast.show({
              type: "sToast",
              text1: "Success",
              text2: "PDF saved successfully!",
            });
          })
          .catch((error) => {
            throw new Error(`Failed to create file: ${error.message}`);
          });
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}`
        );
      }
    } else {
      // For iOS, fall back to the previous method
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        Toast.show({
          type: "sToast",
          text1: "Success",
          text2: `PDF saved to: ${downloadResult.uri}`,
        });
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}`
        );
      }
    }
  } catch (error: any) {
    console.error("Error during PDF download or saving process:", error);
    Toast.show({
      type: "eToast",
      text1: "Error",
      text2: `An error occurred while saving the PDF: ${error.message}`,
    });
  }
};

export const ensureListItemsHaveIds = <T extends { id?: string }>(
  items: T[] | undefined
): T[] => {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    id: item.id || Crypto.randomUUID(),
  }));
};

export async function handleBrowse() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: false,
      type: ["application/pdf"],
    });
    if (!result.canceled) {
      return result.assets[0];
    }
  } catch (err) {
    // Handle error
    console.error(err);
    return null;
  }
}
