import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

/**
 * Inter for the interface.
 *
 * This screen is mostly small text and numbers - amounts, phone numbers, dates -
 * read on a phone, often quickly. Inter is drawn for exactly that: a tall
 * x-height that stays legible at 12-14px, and unambiguous 1/l/I and 0/O, which
 * matters when a mistyped digit is a wrong phone number.
 *
 * `display: swap` shows fallback text immediately rather than blocking on the
 * font, which is the right trade on a phone connection.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Fee Reminder",
  description: "Track membership fees and send reminders from your phone",
};

/**
 * Phone-first: the owner uses this on a handset, never a laptop
 * (requirements.md N1). `viewportFit` keeps the bottom nav clear of the
 * home indicator on modern iPhones.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
