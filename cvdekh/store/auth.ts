import { create } from "zustand";
import { authClient } from "@/lib/api";

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
    const session = await authClient.getSession();
    set({ session, isLoading: false });
  },
  signOut: async () => {
    await authClient.signOut();
    set({ session: null });
  },
}));
