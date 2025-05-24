import { create } from "zustand";
import { supabase } from "@/lib/api";

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    useAuthStore.getState().refreshSession();
  } else if (event === "SIGNED_OUT") {
    useAuthStore.setState({ session: null });
  }
});
type AuthState = {
  session: any | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  refreshSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error refreshing session:", error.message);
    }
    set({ session, isLoading: false });
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    set({ session: null });
  },
}));

// Set up auth state change listener
