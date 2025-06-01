import { router, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function FormLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#161616",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: "#ebfffa",
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
        headerLeft: ({ canGoBack }) =>
          canGoBack && (
            <ArrowLeft size={24} color="white" onPress={() => router.back()} />
          ),
      }}
    >
      <Stack.Screen
        options={{
          title: "General Info",
        }}
        name="GeneralInfoScreen" // This is what makes it navigate to your tabs layout
      />
      <Stack.Screen
        options={{
          title: "Profile Summary",
        }}
        name="ProfileSummaryScreen" // This is what makes it navigate to your tabs layout
      />
    </Stack>
  );
}
