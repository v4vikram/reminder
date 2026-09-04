"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangleIcon, BellIcon, CalendarClockIcon, UsersIcon } from "lucide-react";
import { formatRupees } from "@/lib/format";
import { useSession } from "@/features/auth/queries";
import { useDashboardSummary } from "@/features/dashboard/queries";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { activeGym, user } = useSession();
  const gymId = activeGym!.id;
  const { data, error, isPending } = useDashboardSummary(gymId);
  const t = useTranslations("dashboard");

  const needsAttention = (data?.overdue ?? 0) + (data?.dueSoon ?? 0);

  return (
    <div className="space-y-5 px-4 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">
          {t("greeting")}
          {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{activeGym!.name}</h1>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>{t("loadFailed")}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* The primary action sits above the numbers: the point of the app is
          sending reminders, not reading statistics. */}
      {needsAttention > 0 && !isPending ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium">{t("needAttention", { count: needsAttention })}</p>
              <p className="tabular text-sm text-muted-foreground">
                {t("breakdown", { overdue: data!.overdue, dueSoon: data!.dueSoon })}
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/reminders" />}
              size="sm"
              className="h-11 shrink-0"
            >
              <BellIcon className="size-4" />
              {t("send")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("overdue")}
          value={data?.overdue}
          loading={isPending}
          icon={<AlertTriangleIcon className="size-4" />}
          alarming
        />
        <StatCard
          label={t("dueSoon")}
          value={data?.dueSoon}
          loading={isPending}
          icon={<CalendarClockIcon className="size-4" />}
        />
        <StatCard
          label={t("activeMembers")}
          value={data?.activeMembers}
          loading={isPending}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label={t("pendingAmount")}
          value={data ? formatRupees(data.pendingAmount) : undefined}
          loading={isPending}
        />
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">{t("collectedThisMonth")}</p>
          {isPending ? (
            <Skeleton className="mt-1 h-8 w-32" />
          ) : (
            <p className="tabular text-2xl font-semibold">
              {formatRupees(data?.collectedThisMonth ?? 0)}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        nativeButton={false}
        render={<Link href="/members" />}
        variant="outline"
        size="lg"
        className="h-12 w-full"
      >
        {t("seeAllMembers")}
      </Button>
    </div>
  );
}
