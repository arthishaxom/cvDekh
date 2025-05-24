import { SplashScreen, Stack } from "expo-router";
import "../global.css";
import { useAuthStore } from "@/store/auth";
import { useEffect } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
    console.log("ROOT_LAYOUT: useEffect triggered, calling refreshSession.");
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
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
