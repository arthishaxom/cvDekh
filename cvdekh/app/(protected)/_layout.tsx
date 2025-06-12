import { useAuthStore } from "@/store/auth";
import { Redirect, Stack } from "expo-router";
// useEffect is no longer needed here for refreshSession
// import { useEffect } from "react";

export default function ProtectedLayout() {
  // Expo uses file-based routing, function name is for clarity
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return null;
  }

  // If not loading and there's no session, then redirect.
  if (!session) {
    return <Redirect href="/signin" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        options={{
          title: "cvDekh",
        }}
        name="(tabs)" // This is what makes it navigate to your tabs layout
      />
      <Stack.Screen name="forms" />
      <Stack.Screen name="resume-details/[id]" />
    </Stack>
  );
}
