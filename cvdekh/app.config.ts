import type { ConfigContext, ExpoConfig } from "@expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";
const versionCode = process.env.ANDROID_VERSION_CODE
  ? parseInt(process.env.ANDROID_VERSION_CODE)
  : 21;
const versionName = process.env.APP_VERSION || "1.1.1";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.justashish.cvdekh.dev";
  }

  if (IS_PREVIEW) {
    return "com.justashish.cvdekh.preview";
  }

  return "com.justashish.cvdekh";
};

const getAppName = () => {
  if (IS_DEV) {
    return "cvDekh (Dev)";
  }

  if (IS_PREVIEW) {
    return "cvDekh (Preview)";
  }

  return "cvDekh";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "cvdekh",
  version: versionName,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "cvdekh",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    blockedPermissions: [
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#161616",
    },
    edgeToEdgeEnabled: true,
    package: getUniqueIdentifier(),
    versionCode: versionCode,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#161616",
      },
    ],
    "expo-secure-store",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "8d8a1f64-a605-4736-8303-10acbd8fd0be",
    },
  },
});
