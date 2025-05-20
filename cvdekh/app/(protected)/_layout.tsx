import { Stack } from "expo-router";

export default function RootLayout() {
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
        name="(tabs)"
      />
    </Stack>
  );
}
