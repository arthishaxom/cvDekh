import React, { useState, useEffect } from "react";
import { router, useNavigation } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import AntDesign from "@expo/vector-icons/AntDesign";
import { supabase } from "@/lib/api"; // Added for Supabase client
import { useAuthStore } from "@/store/auth";
import { TouchableOpacity, AppState } from "react-native";
import { VStack } from "@/components/ui/vstack";
import Toast from "react-native-toast-message";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Signin() {
  const navigation = useNavigation();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign in and sign up

  // Auth store
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isLoading,
    error,
    session,
  } = useAuthStore();

  // Handle email/password authentication
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: "eToast",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }

    const success = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    // if (success) {
    //   router.replace("./(protected)");
    // }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    // if (success) {
    //   router.replace("./(protected)");
    // }
  };

  // Show error if there is one
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "eToast",
        text1: "Auth Error",
        text2: error,
      });
    }
  }, [error]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.replace("./(protected)");
    }
  }, [session]);

  // Configure navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: "",
      headerStyle: {
        backgroundColor: "#161616",
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  return (
    <VStack className="flex-1 bg-background-500 px-6 justify-center">
      <Box className="mb-6">
        <Text className="text-white text-5xl font-bold mb-2">
          {isSignUp ? "Create" : "Hello,"}
        </Text>
        <Text className="text-white text-5xl font-bold">
          {isSignUp ? "Account" : "Welcome Back"}
        </Text>
      </Box>

      <Box className="mb-4">
        <Input className="mb-4 rounded-lg h-16 bg-background-400/30 border-zinc-700">
          <InputSlot className="pl-4">
            <Mail color="white" size={20} />
          </InputSlot>
          <InputField
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            className="text-white ml-1"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Input>

        <Input className="mb-4 rounded-lg h-16 bg-background-400/30 border-zinc-700">
          <InputSlot className="pl-4">
            <Lock color="white" size={20} />
          </InputSlot>
          <InputField
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            className="text-white ml-1 flex-1"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
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

        {!isSignUp && (
          <TouchableOpacity>
            <Text className="text-primary-300 text-right">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}
      </Box>

      <Button
        onPress={handleEmailAuth}
        disabled={isLoading}
        size="lg"
        className="bg-primary-300 p-2 rounded-lg mb-4 h-min py-4"
      >
        <Text className="text-black font-semibold text-lg">
          {isLoading
            ? isSignUp
              ? "Creating Account..."
              : "Signing In..."
            : isSignUp
            ? "Create Account"
            : "Login"}
        </Text>
      </Button>

      <Box className="flex-row items-center justify-center mb-4">
        <Text className="text-gray-400">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
        </Text>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text className="text-primary-300 font-semibold">
            {isSignUp ? "Sign In" : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </Box>

      <Box className="flex-row items-center justify-center mb-4">
        <Box className="flex-1 h-px bg-gray-600" />
        <Text className="text-gray-400 mx-4">or continue with</Text>
        <Box className="flex-1 h-px bg-gray-600" />
      </Box>

      <Button
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        size="lg"
        className="bg-white p-2 h-min rounded-lg flex-row items-center justify-center gap-1 py-4"
      >
        <AntDesign name="google" size={20} color="black" className="" />
        <Text className="text-black font-semibold">Google</Text>
      </Button>
    </VStack>
  );
}
