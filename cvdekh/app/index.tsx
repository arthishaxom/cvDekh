import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-black p-4">
      <Pressable>
        <Text className="text-white text-2xl font-bold">Login</Text>
      </Pressable>
    </View>
  );
}
