"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { formatRupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCreateFeePlan, useDeleteFeePlan, useFeePlans } from "../queries";

/**
 * Manages the gym's price tiers.
 *
 * These exist so the owner enters each price once, then taps it every time
 * afterwards. Deleting one is safe: a plan is a shortcut for entering figures,
 * not a record of anything - payments keep their own amount and month count.
 */
export function FeePlanManager({ gymId }: { gymId: string }) {
  const { data: plans, isPending } = useFeePlans(gymId);
  const createPlan = useCreateFeePlan(gymId);
  const deletePlan = useDeleteFeePlan(gymId);
  const t = useTranslations("feePlans");
  const tc = useTranslations("common");

  const [months, setMonths] = useState("");
  const [amount, setAmount] = useState("");

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    createPlan.mutate(
      { months: Number(months), amount: Number(amount) },
      {
        onSuccess: () => {
          setMonths("");
          setAmount("");
          notify.success(t("added"));
        },
        onError: (err) =>
          notify.error(err instanceof ApiError ? err.message : t("addFailed")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : plans && plans.length > 0 ? (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="tabular text-sm">
                  <span className="font-medium">{formatRupees(plan.amount)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {tc("months", { count: plan.months })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("deleteLabel", { months: plan.months })}
                  onClick={() => deletePlan.mutate(plan.id)}
                  disabled={deletePlan.isPending}
                  className="size-11 shrink-0 text-destructive"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-months" className="text-xs text-muted-foreground">
                {t("months")}
              </Label>
              <Input
                id="plan-months"
                value={months}
                onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={t("monthsPlaceholder")}
                inputMode="numeric"
                className="tabular h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-amount" className="text-xs text-muted-foreground">
                {t("amount")}
              </Label>
              <Input
                id="plan-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={t("amountPlaceholder")}
                inputMode="numeric"
                className="tabular h-12 text-base"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full"
            disabled={createPlan.isPending || months === "" || amount === ""}
          >
            {createPlan.isPending ? <Spinner className="size-4" /> : <PlusIcon className="size-4" />}
            {t("add")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
