import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
