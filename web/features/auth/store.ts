"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  /** The session JWT, or null when signed out. */
  token: string | null;
  /** False until the persisted token has been read back from localStorage. */
  hydrated: boolean;
  setHydrated: () => void;
  signIn: (token: string) => void;
  signOut: () => void;
}

/**
 * Client state only: the session token.
 *
 * Server state - the user, their gyms, members, payments - lives in React Query
 * instead. Keeping that line sharp is the point: Zustand holds what the client
 * owns and must persist across reloads, React Query holds what the server owns
 * and can always refetch.
 *
 * The token is persisted to localStorage because it arrives in a URL fragment
 * that the Next server never sees (ADR 010) - there is nothing to read during
 * SSR and no cookie to send.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      signIn: (token) => set({ token }),
      signOut: () => set({ token: null }),
    }),
    {
      name: "gymreminder.auth",
      storage: createJSONStorage(() => localStorage),
      // Only the token is persisted; `hydrated` is runtime state.
      partialize: (state) => ({ token: state.token }),
      // Nothing may assume a token before storage has been read, otherwise the
      // first paint flashes the sign-in screen at an authenticated user.
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
