import { SplashScreen, Stack } from "expo-router";
import "../global.css";
import { useAuthStore } from "@/store/auth";
import { JSX, useEffect } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";
import { Box } from "@/components/ui/box";
import { Check, CircleAlert, CircleCheck, CircleX } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

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
        <CircleAlert color={"#262626"} size={20} />
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

export default function RootLayout() {
  SplashScreen.preventAutoHideAsync();
  const session = useAuthStore((state) => state.session);
  // Log the session object itself for more detail
  console.log(
    "ROOT_LAYOUT: Current session state:",
    session ? "Exists" : "Null",
    session,
  );

  const refreshSession = useAuthStore((state) => state.refreshSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  useEffect(() => {
    // console.log("ROOT_LAYOUT: useEffect triggered, calling refreshSession.");
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
        <Stack>
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
