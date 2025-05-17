import { authClient } from "@/lib/api";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/(tabs)", // this will be converted to a deep link (eg. `myapp://dashboard`) on native
    });
  };
  return (
    <View className="flex-1 items-center justify-center bg-black p-4">
      <Pressable onPress={handleLogin} className="bg-blue-500 p-2 rounded-lg">
        <Text className="text-white text-2xl font-bold">Login</Text>
      </Pressable>
    </View>
  );
}
