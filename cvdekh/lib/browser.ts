import * as DocumentPicker from "expo-document-picker";

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
