"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/spinner";

/**
 * Entry point. Routing depends on auth state, which only exists in the browser
 * (the token is in localStorage), so this decision cannot be made on the server.
 */
export default function RootPage() {
  const { status, gyms } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
    else router.replace(gyms.length === 0 ? "/onboarding" : "/dashboard");
  }, [status, gyms.length, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </main>
  );
}
