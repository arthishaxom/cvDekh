import { create } from "zustand";
import { supabase } from "@/lib/api";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Session } from "@supabase/supabase-js";
import { useResumeStore } from "./resume/resumeStore";

// Configure Google Sign-In globally when this module is loaded
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

supabase.auth.onAuthStateChange((event, session) => {
  console.log(
    "AUTH_STORE: onAuthStateChange event:",
    event,
    "session:",
    session ? "Exists" : "Null",
  );
  if (event === "INITIAL_SESSION") {
    // This event means getSession() has completed.
    // isLoading should be false, session might be null or have a value.
    useAuthStore.setState({ session, isLoading: false });
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    useAuthStore.setState({ session, isLoading: false });
  } else if (event === "SIGNED_OUT") {
    useAuthStore.setState({ session: null, isLoading: false });
  }
  // No need to handle USER_UPDATED or PASSWORD_RECOVERY specifically for isLoading or session here
  // unless your logic requires it.
});

type AuthState = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: true, // Start with isLoading: true
  error: null,
  refreshSession: async () => {
    // Only set isLoading to true if it's not already true to avoid redundant updates
    if (!get().isLoading) {
      set({ isLoading: true });
    }
    console.log("AUTH_STORE: refreshSession called");
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("AUTH_STORE: Error refreshing session:", error.message);
      // Even on error, we've finished loading
      set({ session: null, isLoading: false });
    } else {
      console.log(
        "AUTH_STORE: Session refreshed, session:",
        session ? "Exists" : "Null",
      );
      // onAuthStateChange with INITIAL_SESSION should handle this,
      // but setting it here ensures isLoading is false after refreshSession completes.
      set({ session, isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Session will be set automatically by onAuthStateChange
      return true;
    } catch (error: any) {
      set({
        error: error.message || "An unexpected error occurred",
        isLoading: false,
      });
      return false;
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        set({
          error: "Please check your email to confirm your account",
          isLoading: false,
        });
        return false;
      }

      // Session will be set automatically by onAuthStateChange
      return true;
    } catch (error: any) {
      set({
        error: error.message || "An unexpected error occurred",
        isLoading: false,
      });
      return false;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      // Check if Play Services are available
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get user info from Google
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("No ID token received from Google");
      }

      // Sign in to Supabase with Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Session will be set automatically by onAuthStateChange
      return true;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred";

      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = "Sign in was cancelled";
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = "Sign in already in progress";
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = "Google Play Services not available";
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      const provider = get().session?.user.app_metadata.provider;
      if (provider === "google") {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      }
      set({ session: null });
      useResumeStore.getState().resetStore();
    } catch (error) {
      console.error("Error revoking Google access:", error);
    }
  },
}));
