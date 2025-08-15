import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useNavigation } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { AppState, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { Input, InputField, InputSlot } from "@/components/ui/input";
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
import { VStack } from "@/components/ui/vstack";
import { supabase } from "@/config/supabase.config"; // Added for Supabase client
import { useAuthStore } from "@/store/auth";

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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign in and sign up
  const [showModal, setShowModal] = useState(false);
  const [emailToReset, setEmailToReset] = useState("");

  // Auth store
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const session = useAuthStore((state) => state.session);

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
      ? await signUpWithEmail(email, password, displayName)
      : await signInWithEmail(email, password);

    if (success) {
      Toast.show({
        type: "sToast",
        text1: "Success",
        text2: `Signed ${isSignUp ? "up" : "in"} successfully`,
      });
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      Toast.show({
        type: "sToast",
        text1: "Success",
        text2: `Signed ${isSignUp ? "up" : "in"} successfully`,
      });
    }
  };

  const handleResetPassword = async () => {
    if (!emailToReset.trim()) {
      Toast.show({
        type: "eToast",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }
    await resetPassword(emailToReset);
    setShowModal(false);
  };

  // Show error if there is one
  useEffect(() => {
    if (error) {
      if (error.includes("confirm")) {
        Toast.show({
          type: "iToast",
          text1: "Check Email",
          text2: "After Confirming Try Login Again",
        });
      } else {
        Toast.show({
          type: "eToast",
          text1: "Auth Error",
          text2: error,
        });
      }
    }
  }, [error]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.replace("/(protected)/(tabs)");
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
    <SafeAreaView className="flex-1 bg-background-500">
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
          {isSignUp && (
            <Input className="mb-4 rounded-lg h-16 bg-background-400/30 border-zinc-700">
              <InputSlot className="pl-4">
                <User color="white" size={20} />
              </InputSlot>
              <InputField
                placeholder="Display Name"
                placeholderTextColor="#9CA3AF"
                className="text-white ml-1"
                value={displayName}
                onChangeText={setDisplayName}
                keyboardType="default"
                autoCapitalize="none"
                autoComplete="name"
              />
            </Input>
          )}
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
            <Pressable onPress={() => setShowModal(true)}>
              <Text className="text-primary-300 text-right">
                Forgot Password?
              </Text>
            </Pressable>
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
          action="secondary"
          className="p-2 h-min rounded-lg border border-white/30 bg-background-400/30 flex-row items-center justify-center gap-1 py-4"
        >
          <AntDesign name="google" size={20} color="white" className="" />
          <Text className="text-white font-semibold">Google</Text>
        </Button>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
          }}
          size="lg"
        >
          <ModalBackdrop />
          <ModalContent className="bg-background-500">
            <ModalHeader>
              <Heading size="md" className="text-typography-950">
                Reset Password
              </Heading>
              <ModalCloseButton>
                <Icon
                  as={CloseIcon}
                  size="md"
                  className="stroke-background-100 group-[:hover]/modal-close-button:stroke-background-100 group-[:active]/modal-close-button:stroke-background-100 group-[:focus-visible]/modal-close-button:stroke-background-100"
                />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Input className="rounded-lg h-16 bg-background-400/30 border-zinc-700">
                <InputSlot className="pl-4">
                  <Mail color="white" size={20} />
                </InputSlot>
                <InputField
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  className="text-white ml-1"
                  value={emailToReset}
                  onChangeText={setEmailToReset}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Input>
            </ModalBody>
            <ModalFooter>
              <VStack className="w-full">
                <Button
                  className={`w-full h-12 rounded-lg ${
                    isLoading ? "opacity-50" : ""
                  } ${isLoading ? "bg-background-500" : ""}`}
                  onPress={handleResetPassword} // Updated onPress handler
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ButtonText className="text-white">Sending</ButtonText>
                  ) : (
                    <ButtonText>Send Reset Link</ButtonText>
                  )}
                </Button>
              </VStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </SafeAreaView>
  );
}
