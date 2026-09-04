"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { messages } from "./messages";
import { DEFAULT_LOCALE, useLocaleStore } from "./store";

/**
 * next-intl without locale routing.
 *
 * The usual App Router setup puts the locale in the URL (/en/dashboard) and
 * resolves it in middleware. This app is entirely client-rendered and sits
 * behind auth, so there is no SEO to serve and no server render to localise -
 * the locale comes from the store and is handed to the provider directly.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const hydrated = useLocaleStore((s) => s.hydrated);

  // Before hydration the persisted choice is unknown, so render the default
  // rather than flashing one language and swapping to the other.
  const active = hydrated ? locale : DEFAULT_LOCALE;

  return (
    <NextIntlClientProvider
      locale={active}
      messages={messages[active]}
      // Dates and numbers are the gym's, not the browser's.
      timeZone="Asia/Kolkata"
    >
      {children}
    </NextIntlClientProvider>
  );
}
