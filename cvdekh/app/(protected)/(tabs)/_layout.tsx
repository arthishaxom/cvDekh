import { Tabs } from "expo-router";
import { FileText, Home } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#161616",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: "#ebfffa",
          fontWeight: "bold",
          letterSpacing: 2,
        },
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#A3FF41",
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 12,
          height: 64,
          backgroundColor: "#161616",
          borderTopWidth: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: "Resume",
          tabBarIcon: ({ color }) => <FileText size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
