import { router, useNavigation } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/auth";

export default function PassReset() {
  // const url = Linking.useURL();

  // if (url) {
  //   Alert.alert("URL", url);
  //   const { hostname, path, queryParams } = Linking.parse(url);
  //   console.log(url);
  //   console.log(
  //     `Linked to app with hostname: ${hostname}, path: ${path} and data: ${JSON.stringify(
  //       queryParams,
  //     )}`,
  //   );
  // }
  const navigation = useNavigation();

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth store
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  // const session = useAuthStore((state) => state.session); // To check if user is logged in

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Toast.show({
        type: "eToast",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: "eToast",
        text1: "Error",
        text2: "Passwords do not match",
      });
      return;
    }

    // Clear any previous error before attempting to update
    // This assumes your authStore has a way to clear errors, or you manage it locally.
    useAuthStore.setState({ error: null });

    await updatePassword(password);

    // Check the error status *after* the updatePassword call resolves
    // It's better to rely on the error state from the store if it's updated by updatePassword
    const currentError = useAuthStore.getState().error;
    const currentIsLoading = useAuthStore.getState().isLoading;

    if (!currentError && !currentIsLoading) {
      Toast.show({
        type: "sToast",
        text1: "Success",
        text2: "Password updated successfully.",
      });
      router.replace("/signin"); // Navigate to signin page
    } else if (currentError) {
      // Error is already handled by the useEffect in this component
    }
  };

  // Show error if there is one from the store
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "eToast",
        text1: "Password Reset Error",
        text2: error,
      });
    }
  }, [error]);

  // if (!session) {
  //   router.replace("/signin");
  // }

  // Redirect if not authenticated (e.g., token expired or user not found for reset)
  // This useEffect might need adjustment based on how the reset link/token is handled.
  // For now, assuming the user is already in a state where they can reset (e.g., after email verification).
  // If a specific token from URL is needed, that logic would go here.

  // Configure navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true, // Show header for back button
      title: "Reset Password",
      headerStyle: {
        backgroundColor: "#161616",
      },
      headerTintColor: "#FFFFFF", // For back button and title color
      headerShadowVisible: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      <VStack className="flex-1 bg-background-500 px-6 justify-center">
        <Box className="mb-6">
          <Text className="text-white text-4xl font-bold mb-2">
            Set New Password
          </Text>
          <Text className="text-gray-400 text-lg">
            Enter your new password below.
          </Text>
        </Box>

        <Box className="mb-4">
          <Input className="mb-4 rounded-lg h-16 bg-background-400/30 border-zinc-700">
            <InputSlot className="pl-4">
              <Lock color="white" size={20} />
            </InputSlot>
            <InputField
              placeholder="New Password"
              placeholderTextColor="#9CA3AF"
              className="text-white ml-1 flex-1"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <InputSlot className="pr-4">
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color="white" size={20} />
                ) : (
                  <Eye color="white" size={20} />
                )}
              </TouchableOpacity>
            </InputSlot>
          </Input>

          <Input className="mb-4 rounded-lg h-16 bg-background-400/30 border-zinc-700">
            <InputSlot className="pl-4">
              <Lock color="white" size={20} />
            </InputSlot>
            <InputField
              placeholder="Confirm New Password"
              placeholderTextColor="#9CA3AF"
              className="text-white ml-1 flex-1"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
            />
            <InputSlot className="pr-4">
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff color="white" size={20} />
                ) : (
                  <Eye color="white" size={20} />
                )}
              </TouchableOpacity>
            </InputSlot>
          </Input>
        </Box>

        <Button
          onPress={handlePasswordReset}
          disabled={isLoading}
          size="lg"
          className="bg-primary-300 p-2 rounded-lg mb-4 h-min py-4"
        >
          <Text className="text-black font-semibold text-lg">
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Text>
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
