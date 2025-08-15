import { router, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FormLayout() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background-500">
      <Stack
        screenOptions={{
          headerShown: true,
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
              <ArrowLeft
                size={24}
                color="white"
                onPress={() => router.back()}
              />
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
        <Stack.Screen
          options={{
            title: "Work Experience",
          }}
          name="ExperienceScreen" // This is what makes it navigate to your tabs layout
        />
        <Stack.Screen
          options={{
            title: "Projects",
          }}
          name="ProjectsScreen" // This is what makes it navigate to your tabs layout
        />

        <Stack.Screen
          options={{
            title: "Education",
          }}
          name="EducationScreen" // This is what makes it navigate to your tabs layout
        />
        <Stack.Screen
          options={{
            title: "Skills",
          }}
          name="SkillsScreen" // This is what makes it navigate to your tabs layout
        />
      </Stack>
    </SafeAreaView>
  );
}
