import { Box } from "@/components/ui/box";
import { WithLocalSvg } from "react-native-svg/css";
import { Text } from "@/components/ui/text";
import { useEffect } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { useAuthStore } from "@/store/auth";

export default function Tab() {
  useEffect(() => {
    useResumeStore.getState().fetchResumeData(useAuthStore.getState().session);
  }, []);

  return (
    <Box className="flex-1 bg-background-500 items-center justify-center">
      {/* <Text>Hello</Text> */}
      <Box className="flex flex-col items-center">
        <WithLocalSvg
          asset={require("@/assets/images/Document_empty.svg")}
          width={120}
          height={120}
          color={"#ffffff"}
        />
        <Text className="font-semibold text-xl py-2">No jobs/resume found</Text>
        <Text className="text-lg text-white/40 text-center w-[24rem]">
          Make sure you have a resume added, if yes then add a job using +
          button
        </Text>
      </Box>
    </Box>
  );
}
