"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboardIcon, UsersIcon, BellIcon, SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboardIcon },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/reminders", label: "Reminders", icon: BellIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

/**
 * Authenticated shell.
 *
 * Navigation sits at the bottom because this is used one-handed on a phone
 * (requirements.md N1) - the top of a 6" screen is out of thumb reach.
 * `pb-safe` padding keeps it clear of the iOS home indicator.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status, gyms } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && gyms.length === 0) router.replace("/onboarding");
  }, [status, gyms.length, router]);

  if (status !== "authenticated" || gyms.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Bottom nav is fixed, so content needs room to scroll past it. */}
      <main className="flex-1 pb-24">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  /* min-h-16 keeps every target well above the 44px minimum. */
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
