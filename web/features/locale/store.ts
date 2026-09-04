"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * `hi-Latn` is Hindi written in Latin script - the correct BCP-47 tag for what
 * people call Hinglish, which has no code of its own.
 */
export const LOCALES = ["en", "hi-Latn"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "hi-Latn";

interface LocaleState {
  locale: Locale;
  /** False until the persisted choice has been read back from localStorage. */
  hydrated: boolean;
  setHydrated: () => void;
  setLocale: (locale: Locale) => void;
}

/**
 * The owner's interface language.
 *
 * Client state, persisted per device: it is a display preference, so it needs
 * no schema column, no API round-trip and no migration. The trade is that a new
 * device starts at the default again.
 *
 * Separate from the gym's message language, which decides what *members* read on
 * WhatsApp and therefore lives on the server.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "gymreminder.locale",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
