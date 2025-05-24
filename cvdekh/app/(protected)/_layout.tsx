import { useAuthStore } from "@/store/auth";
import { Redirect, Stack } from "expo-router";
// useEffect is no longer needed here for refreshSession
// import { useEffect } from "react";

export default function ProtectedLayout() {
  // Expo uses file-based routing, function name is for clarity
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  // const refreshSession = useAuthStore((state) => state.refreshSession); // Removed

  // Log current state for debugging
  console.log(
    "PROTECTED_LAYOUT: Render. Session:",
    session ? "Exists" : "Null",
    "isLoading:",
    isLoading,
  );

  // useEffect(() => {
  // This call is redundant. The root _layout.tsx handles the initial session load,
  // and onAuthStateChange in store/auth.ts handles subsequent updates.
  // console.log(
  //   "PROTECTED_LAYOUT: useEffect triggered, calling refreshSession.",
  // );
  // refreshSession();
  // }, [refreshSession]); // Ensure refreshSession is stable or memoized if it causes re-renders

  // If the session is still loading, don't do anything yet.
  // Render null or a loading indicator.
  if (isLoading) {
    console.log("PROTECTED_LAYOUT: Session is loading. Rendering null.");
    return null;
  }

  // If not loading and there's no session, then redirect.
  if (!session) {
    console.log(
      "PROTECTED_LAYOUT: No session (and not loading). Redirecting to /signin.",
    );
    return <Redirect href="/signin" />;
  }

  // If a session exists and not loading, render the protected content.
  console.log(
    "PROTECTED_LAYOUT: Session exists. Rendering protected content (Stack).",
  );
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
    </Stack>
  );
}
