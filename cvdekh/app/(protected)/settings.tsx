import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/auth";
import { router, useNavigation } from "expo-router";

export default function Settings() {
  const { signOut } = useAuthStore();

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      // headerShown: false,
      title: "Settings",
      headerStyle: {
        backgroundColor: "#161616",
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/signin"); // Redirect to sign-in page after sign out
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#161616", // Match your app's background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
});
