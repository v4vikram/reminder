import en from "@/messages/en.json";
import hiLatn from "@/messages/hi-Latn.json";
import type { Locale } from "./store";

/**
 * Both bundles are imported statically rather than fetched per locale.
 *
 * There are two of them and they are a few kilobytes; splitting them would add
 * a loading state to every language switch to save less than one image.
 */
export const messages = {
  en,
  "hi-Latn": hiLatn,
} satisfies Record<Locale, unknown>;

/** English is the source of truth for the key shape. */
export type Messages = typeof en;
