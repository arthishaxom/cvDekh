import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { ChevronLeft, HelpCircle, LogOut } from "lucide-react-native";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import * as Linking from "expo-linking";

export default function Settings() {
  const signOut = useAuthStore((state) => state.signOut);
  const isLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);

  const handleSignOut = async () => {
    await signOut();
    // router.replace("/signin"); // Redirect to sign-in page after sign out
  };

  return (
    <SafeAreaView className="flex-1 bg-background-500">
      <VStack className=" w-full flex-1 px-4 items-center jus">
        <HStack className="items-center w-full justify-between py-2">
          <ChevronLeft
            color={"white"}
            size={24}
            onPress={() => {
              router.back();
            }}
          />
          <Heading className="text-2xl flex-1 text-center">Settings</Heading>
          <Box className="w-[22px]"></Box>
        </HStack>
        <VStack className="flex-1 w-full items-center py-4 gap-4">
          <VStack className="items-center">
            <Heading>{session?.user.user_metadata.full_name}</Heading>
            <Heading size="md" className="opacity-80 font-semibold">
              {session?.user.email}
            </Heading>
          </VStack>
          <VStack className="w-full gap-4">
            <Button
              onPress={() => {
                const mailtoUrl = `mailto:pothal.builds@gmail.com?subject=${encodeURIComponent(
                  "cvDekh - Need Help",
                )}`;
                Linking.openURL(mailtoUrl);
              }}
              size="lg"
              action="secondary"
              disabled={isLoading}
              className="p-2 px-4 w-full h-min rounded-lg border border-white/30 bg-background-400/30 flex-row items-center justify-start gap-2 py-4"
            >
              <HelpCircle color="white" size={22} />
              <Text className="text-white font-semibold">Need Help?</Text>
            </Button>
            <Button
              onPress={handleSignOut}
              disabled={isLoading}
              size="lg"
              action="secondary"
              className="p-2 px-4 w-full h-min rounded-lg border border-white/30 bg-background-400/30 flex-row items-center justify-start gap-2 py-4"
            >
              <LogOut color="#E42A33" size={22} />
              <Text className="text-white font-semibold">Logout</Text>
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}
