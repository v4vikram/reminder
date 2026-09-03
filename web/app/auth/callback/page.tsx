"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Lands here after Google, with the session token in the URL fragment.
 *
 * The fragment is used rather than a query string so the token never reaches a
 * server, an access log or the Referer header (ADR 010). It is only readable
 * from the browser, which is why this page must be a client component.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // React runs effects twice in development. Without this the fragment has
  // already been cleared by the second pass, and the page falsely reports
  // that sign-in failed.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function completeSignIn() {
      const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
      if (!token) throw new Error("Sign-in did not return a token.");

      tokenStore.set(token);
      // Drop the token from the address bar so it is not left in history.
      window.history.replaceState(null, "", window.location.pathname);

      await refresh();
      router.replace("/");
    }

    // setError lives in the rejection callback, not the effect body, so it
    // cannot cause a cascading render on mount.
    void completeSignIn().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    });
  }, [refresh, router]);

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button render={<Link href="/login" />}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <Spinner className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </main>
  );
}
