"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOutIcon } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import { useSession, useSignOut } from "@/features/auth/queries";
import { useUpdateGym } from "@/features/gyms/queries";
import type { MessageLanguage } from "@/features/gyms/types";
import { FeePlanManager } from "@/features/fee-plans/components/fee-plan-manager";
import { LanguagePicker } from "@/features/locale/components/language-picker";
import { LOCALES, useLocaleStore, type Locale } from "@/features/locale/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

const MESSAGE_LANGUAGES: readonly MessageLanguage[] = ["HI_LATN", "EN"];

export default function SettingsPage() {
  const { activeGym, user } = useSession();
  const gym = activeGym!;
  const signOut = useSignOut();
  const updateGym = useUpdateGym(gym.id);
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const [days, setDays] = useState(String(gym.reminderDaysBefore));

  function saveDays() {
    updateGym.mutate(
      { reminderDaysBefore: Number(days) },
      {
        onSuccess: () => notify.success(t("saved")),
        onError: (err) =>
          notify.error(err instanceof ApiError ? err.message : t("saveFailed")),
      },
    );
  }

  function saveMessageLanguage(messageLanguage: MessageLanguage) {
    updateGym.mutate(
      { messageLanguage },
      {
        onSuccess: () => notify.success(t("saved")),
        onError: (err) =>
          notify.error(err instanceof ApiError ? err.message : t("saveFailed")),
      },
    );
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{gym.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{gym.plan}</Badge>
            {gym.trialEndsAt ? (
              <span>{t("trialTill", { date: formatDate(gym.trialEndsAt) })}</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="days">{t("reminderDays")}</Label>
          <div className="flex gap-2">
            <Input
              id="days"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="tabular h-12 text-base"
            />
            <Button
              onClick={saveDays}
              disabled={updateGym.isPending || days === String(gym.reminderDaysBefore)}
              className="h-12 shrink-0"
            >
              {updateGym.isPending ? <Spinner className="size-4" /> : null}
              {tc("save")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("reminderDaysHint")}</p>
        </CardContent>
      </Card>

      {/*
        Two language settings, deliberately separate. The first changes what the
        owner reads and is stored on this device; the second changes what members
        receive on WhatsApp and is stored on the gym. An owner switching the app
        to English should not silently change the language their members get.
      */}
      <Card>
        <CardContent className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>{t("appLanguage")}</Label>
            <LanguagePicker<Locale>
              options={LOCALES}
              value={locale}
              onChange={setLocale}
            />
            <p className="text-xs text-muted-foreground">{t("appLanguageHint")}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("messageLanguage")}</Label>
            <LanguagePicker<MessageLanguage>
              options={MESSAGE_LANGUAGES}
              value={gym.messageLanguage}
              onChange={saveMessageLanguage}
              disabled={updateGym.isPending}
            />
            <p className="text-xs text-muted-foreground">{t("messageLanguageHint")}</p>
          </div>
        </CardContent>
      </Card>

      <FeePlanManager gymId={gym.id} />

      <Card>
        <CardContent className="space-y-3 py-4">
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Separator />
          <Button variant="outline" onClick={signOut} className="h-12 w-full">
            <LogOutIcon className="size-4" />
            {t("signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
