"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { useSession } from "@/features/auth/queries";
import { useCreateGym } from "@/features/gyms/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function OnboardingPage() {
  const { status, gyms } = useSession();
  const router = useRouter();
  const createGym = useCreateGym();
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && gyms.length > 0) router.replace("/dashboard");
  }, [status, gyms.length, router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    createGym.mutate(
      { name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      {
        onSuccess: () => router.replace("/dashboard"),
        onError: (err) => {
          if (err instanceof ApiError && err.details.length > 0) {
            setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
          } else {
            notify.error(t("createFailed"));
          }
        },
      },
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t("gymName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Iron Fitness Gym"
                  autoFocus
                  required
                  className="h-12 text-base"
                />
                {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t("gymPhone")}{" "}
                  <span className="text-muted-foreground">{tc("optional")}</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  inputMode="tel"
                  className="h-12 text-base"
                />
                {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-base"
                disabled={createGym.isPending || name.trim().length < 2}
              >
                {createGym.isPending ? <Spinner className="size-4" /> : null}
                {t("continue")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
