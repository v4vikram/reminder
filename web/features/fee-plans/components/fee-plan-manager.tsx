"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
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
          notify.success("Plan added");
        },
        onError: (err) =>
          notify.error(err instanceof ApiError ? err.message : "Could not add the plan"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fee plans</CardTitle>
        <CardDescription>
          Ek baar daal do, phir member add karte waqt aur payment lete waqt bas tap
          karna hoga. Bundle sasta ho sakta hai — jaise 1 month ₹400, 2 months ₹700.
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
                    {plan.months} {plan.months === 1 ? "month" : "months"}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete the ${plan.months} month plan`}
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
            Abhi koi plan nahi. Neeche add karo.
          </p>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-months" className="text-xs text-muted-foreground">
                Months
              </Label>
              <Input
                id="plan-months"
                value={months}
                onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="2"
                inputMode="numeric"
                className="tabular h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-amount" className="text-xs text-muted-foreground">
                Amount (₹)
              </Label>
              <Input
                id="plan-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="700"
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
            Plan add karo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
