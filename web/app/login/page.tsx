"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/queries";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status !== "unauthenticated") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Gym Fee Reminder</h1>
          <p className="text-sm text-muted-foreground">
            Fees track karo, reminder ek tap me bhejo.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>
              Apne Google account se sign in karo. Koi password yaad rakhne ki
              zaroorat nahi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSignInButton />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Gym owners ke liye. Members ko koi app install nahi karni.
        </p>
      </div>
    </main>
  );
}
