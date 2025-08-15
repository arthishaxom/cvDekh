import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";

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
