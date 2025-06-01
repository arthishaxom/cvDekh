import { create } from "zustand";
import { supabase } from "@/lib/api";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

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
  session: any | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: true, // Start with isLoading: true
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
  signOut: async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      }
      set({ session: null });
    } catch (error) {
      console.error("Error revoking Google access:", error);
    }
  },
}));

// Set up auth state change listener
