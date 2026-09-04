"use client";

import { useTranslations } from "next-intl";
import { formatRupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { FeePlan } from "../types";

/**
 * Quick-select for a gym's price tiers.
 *
 * Tapping "2 months - 700" fills both the duration and the amount, so the owner
 * is not retyping the same two numbers for every member. Anything unusual is
 * still typed by hand into the fields below - the buttons are a shortcut, never
 * the only way in.
 */
export function PlanPicker({
  plans,
  selectedMonths,
  onSelect,
}: {
  plans: FeePlan[];
  /** Highlights the tier currently in effect, if any. */
  selectedMonths?: number;
  onSelect: (plan: FeePlan) => void;
}) {
  const t = useTranslations("common");

  if (plans.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {plans.map((plan) => (
        <Button
          key={plan.id}
          type="button"
          variant={selectedMonths === plan.months ? "default" : "outline"}
          onClick={() => onSelect(plan)}
          className="h-12 flex-1 basis-24 flex-col gap-0 px-3"
        >
          <span className="tabular text-sm font-semibold">
            {formatRupees(plan.amount)}
          </span>
          <span className="text-[11px] font-normal opacity-70">
            {t("months", { count: plan.months })}
          </span>
        </Button>
      ))}
    </div>
  );
}

/**
 * Duration-only shortcut, for the add-member form.
 *
 * The member form captures a *monthly* rate (arrears are calculated as months x
 * fee), so filling it with a bundle total would be wrong. Here the tiers only
 * choose how long the opening period runs; the amount field is left alone.
 */
export function DurationPicker({
  plans,
  selectedMonths,
  onSelect,
}: {
  plans: FeePlan[];
  selectedMonths?: number;
  onSelect: (months: number) => void;
}) {
  const t = useTranslations("common");
  const durations = plans.length > 0 ? plans.map((p) => p.months) : [1, 2, 3];

  return (
    <div className="flex flex-wrap gap-2">
      {durations.map((months) => (
        <Button
          key={months}
          type="button"
          variant={selectedMonths === months ? "default" : "outline"}
          onClick={() => onSelect(months)}
          className="h-11 flex-1 basis-20"
        >
          {t("months", { count: months })}
        </Button>
      ))}
    </div>
  );
}
