import { router, SplashScreen, Stack } from "expo-router";
import "../global.css";
import { useAuthStore } from "@/store/auth";
import { JSX, useEffect, useState } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { Check, CircleAlert, CircleCheck, CircleX } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/api";
import { KeyboardProvider } from "react-native-keyboard-controller";

const toastConfig = {
  success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        width: "95%",
        borderLeftWidth: 0,
        backgroundColor: "#262626",
        borderColor: "#000000",
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        color: "white",
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 13,
        color: "#A1A1AA",
      }}
      renderLeadingIcon={() => <Check color={"green"} size={20} />}
    />
  ),

  sToast: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <Box className="bg-background-400 border border-background-300/30  rounded-lg p-3 w-[95%]">
      <HStack className="items-center gap-3">
        <CircleCheck color={"#42f548"} size={20} />
        <VStack>
          <Box>
            <Text className="font-bold text-white text-lg">{props.text1}</Text>
          </Box>
          <Box>
            <Text className="font-semibold text-md text-white/70">
              {props.text2}
            </Text>
          </Box>
        </VStack>
      </HStack>
    </Box>
  ),

  eToast: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <Box className="bg-background-400 border border-background-300/30 rounded-lg p-3 w-[95%]">
      <HStack className="items-center gap-3">
        <CircleX color={"#E42A33"} size={20} />
        <VStack>
          <Box>
            <Text className="font-bold text-white text-lg">{props.text1}</Text>
          </Box>
          <Box>
            <Text className="font-semibold text-md text-white/70">
              {props.text2}
            </Text>
          </Box>
        </VStack>
      </HStack>
    </Box>
  ),

  iToast: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <Box className="bg-background-400 border border-background-300/30  rounded-lg p-3 w-[95%]">
      <HStack className="items-center gap-3">
        <CircleAlert color={"#4287f5"} size={20} />
        <VStack>
          <Box>
            <Text className="font-bold text-white text-lg">{props.text1}</Text>
          </Box>
          <Box>
            <Text className="font-semibold text-md text-white/70">
              {props.text2}
            </Text>
          </Box>
        </VStack>
      </HStack>
    </Box>
  ),
};

const handleDeepLink = async ({
  access_token,
  refresh_token,
  type, // Add a type parameter if your Supabase email link includes it
}: {
  access_token: string;
  refresh_token: string;
  type?: string; // e.g., 'recovery'
}) => {
  await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  // It's often better to let Supabase handle the session refresh internally
  // or ensure it's done before navigating.
  // await supabase.auth.refreshSession();

  // Check if the link is specifically for password recovery
  // Supabase recovery links often have type=recovery in the fragment
  if (type === "recovery") {
    // You might need to adjust how you check the link type
    router.replace("/passreset"); // Use replace to not keep the deep link in history
  } else {
    // Handle other deep link types or default to main app screen if session is valid
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      router.replace("/(protected)/(tabs)");
    } else {
      router.replace("/signin");
    }
  }
};

export default function RootLayout() {
  const url = Linking.useURL();
  const [isInitialLinkHandled, setIsInitialLinkHandled] = useState(false);

  useEffect(() => {
    if (url && !isInitialLinkHandled) {
      const parsedUrl = url.replace("#", "?");
      const { queryParams } = Linking.parse(parsedUrl);

      // console.log(`Linked to app with data: ${JSON.stringify(queryParams)}`);

      if (
        queryParams &&
        queryParams.access_token &&
        queryParams.refresh_token
      ) {
        handleDeepLink({
          access_token: queryParams.access_token as string,
          refresh_token: queryParams.refresh_token as string,
          type: queryParams.type as string, // Pass the type if available
        });
        setIsInitialLinkHandled(true); // Mark as handled
      }
    }
  }, [url, isInitialLinkHandled]);

  SplashScreen.preventAutoHideAsync();

  const refreshSession = useAuthStore((state) => state.refreshSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  useEffect(() => {
    refreshSession(); // Fetch session on app start
  }, [refreshSession]);
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  return (
    <GluestackUIProvider mode="dark">
      <SafeAreaProvider>
        <KeyboardProvider>
          <Stack>
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
          </Stack>
        </KeyboardProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
