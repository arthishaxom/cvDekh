import React, { useEffect } from "react";
import { router, useNavigation } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Eye, Lock, Mail } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import AntDesign from "@expo/vector-icons/AntDesign";
import { supabase } from "@/lib/api"; // Added for Supabase client
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin"; // Added for Google Sign-In
import { AppState } from "react-native";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Signin() {
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      // Check if Play Services are available
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Prompts the user to select a Google account
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        // Sign in to Supabase with the Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.data.idToken,
        });

        if (error) {
          console.error("Supabase Google sign-in error:", error.message);
          alert(`Error signing in with Google: ${error.message}`);
          return;
        }
        console.log("Google sign-in successful, Supabase session data:", data);
        router.replace("./(protected)");
      } else {
        throw new Error("Google Sign In failed: No ID token received.");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the Google login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google sign in is in progress already");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Google Play services not available or outdated");
        alert("Google Play Services not available or outdated. Please update.");
      } else {
        // Some other error happened
        console.error("Google sign-in error:", error);
        alert(
          `Google Sign-In Error: ${
            error.message || "An unknown error occurred"
          }`,
        );
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: "",
      headerStyle: {
        backgroundColor: "#161616",
      },
      headerShadowVisible: false,
      headerTitleStyle: {},
    });
  }, [navigation]);

  return (
    <Box className="flex-1 bg-background-500 p-12 justify-center">
      <Box className="gap-4">
        <Text className="font-extrabold text-5xl">Hello,</Text>
        <Text className="font-extrabold text-5xl">Welcome</Text>
        <Text className="font-extrabold text-5xl">Back</Text>
        <Input className="p-5 h-min rounded-lg mt-4">
          <InputSlot>
            <Mail color={"grey"} size={20} />
          </InputSlot>
          <InputField placeholder="Email" />
        </Input>
        <Input className="p-5 h-min rounded-lg mt-1">
          <InputSlot>
            <Lock color={"grey"} size={20} />
          </InputSlot>
          <InputField placeholder="Password" />
          <InputSlot>
            <Eye color={"grey"} />
          </InputSlot>
        </Input>
        <Text className="font-bold text-right">Forgot Password?</Text>
        <Button
          onPress={() => {}}
          className="bg-primary-300 p-5 rounded-lg h-min"
        >
          <Text className="text-background-800 font-bold tracking-widest text-lg">
            Login
          </Text>
        </Button>
        <Text className="text-background-300 text-center">
          or continue with
        </Text>
        <Button
          variant="outline"
          className="p-5 rounded-lg h-min"
          onPress={handleLogin} // This button will now trigger Google Sign-In
        >
          <AntDesign name="google" size={20} color="white" />
          <Text className="text-white font-bold tracking-widest text-lg">
            Google
          </Text>
        </Button>
      </Box>
    </Box>
  );
}
