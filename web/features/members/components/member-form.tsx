"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { formatRupees } from "@/lib/format";
import { useFeePlans } from "@/features/fee-plans/queries";
import { DurationPicker } from "@/features/fee-plans/components/plan-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { CreateMemberInput } from "../types";

/** Today in YYYY-MM-DD, which is the format the API expects for date fields. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Adds whole months, clamping to the shorter month (31 Jan + 1 = 28/29 Feb). */
function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y!, m! - 1 + months + 1, 0)).getUTCDate();
  const next = new Date(Date.UTC(y!, m! - 1 + months, Math.min(d!, lastDay)));
  return next.toISOString().slice(0, 10);
}

/** Whole months between two ISO dates, or null when they do not align. */
function monthsBetweenIso(from: string, to: string): number | null {
  for (let months = 1; months <= 36; months++) {
    if (addMonthsIso(from, months) === to) return months;
  }
  return null;
}

/**
 * Field-level errors come straight from the API's `details[]`, so validation
 * rules live in one place (the Zod schemas on the server) instead of being
 * duplicated and drifting here.
 */
function fieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.details.length > 0) {
    return Object.fromEntries(error.details.map((d) => [d.field, d.message]));
  }
  return {};
}

export function MemberForm({
  gymId,
  onSubmit,
  submitting,
  error,
}: {
  gymId: string;
  onSubmit: (input: CreateMemberInput) => void;
  submitting: boolean;
  error: unknown;
}) {
  const { data: plans } = useFeePlans(gymId);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    feeAmount: "",
    joinDate: todayIso(),
    nextDueDate: addMonthsIso(todayIso(), 1),
    notes: "",
  });

  const errors = fieldErrors(error);
  // Highlights the duration button matching the current start/end pair.
  const selectedMonths = monthsBetweenIso(form.joinDate, form.nextDueDate) ?? undefined;

  // Monthly-rate shortcuts, taken from whatever the gym charges for one month.
  const monthlyRates = [
    ...new Set((plans ?? []).filter((p) => p.months === 1).map((p) => p.amount)),
  ];

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setDuration(months: number) {
    setForm((prev) => ({ ...prev, nextDueDate: addMonthsIso(prev.joinDate, months) }));
  }

  function setStart(joinDate: string) {
    // Keep the covered span the same length when the start date moves.
    const months = monthsBetweenIso(form.joinDate, form.nextDueDate) ?? 1;
    setForm((prev) => ({
      ...prev,
      joinDate,
      nextDueDate: addMonthsIso(joinDate, months),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      // Omitted when blank: a fee is often agreed later.
      ...(form.feeAmount !== "" ? { feeAmount: Number(form.feeAmount) } : {}),
      joinDate: form.joinDate,
      nextDueDate: form.nextDueDate,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
  }

  const canSubmit = form.name.trim().length >= 2 && form.phone.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Naam</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Rahul Sharma"
          autoFocus
          required
          className="h-12 text-base"
        />
        {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp number</Label>
        {/* inputMode rather than type="tel": it raises the numeric keypad while
            still accepting +, spaces and dashes, which the API normalises. */}
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="98765 43210"
          inputMode="tel"
          required
          className="h-12 text-base"
        />
        {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
        <p className="text-xs text-muted-foreground">Isi number pe reminder jayega.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fee">
          Monthly fees <span className="text-muted-foreground">(optional)</span>
        </Label>
        {monthlyRates.length > 0 ? (
          <div className="flex flex-wrap gap-2 pb-1">
            {monthlyRates.map((rate) => (
              <Button
                key={rate}
                type="button"
                variant={form.feeAmount === String(rate) ? "default" : "outline"}
                onClick={() => set("feeAmount", String(rate))}
                className="tabular h-11 flex-1 basis-20"
              >
                {formatRupees(rate)}
              </Button>
            ))}
          </div>
        ) : null}
        <Input
          id="fee"
          value={form.feeAmount}
          onChange={(e) => set("feeAmount", e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="500"
          inputMode="numeric"
          className="tabular h-12 text-base"
        />
        {errors.feeAmount ? (
          <p className="text-sm text-destructive">{errors.feeAmount}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Abhi tay nahi hua? Khaali chhod do — pehli payment ke waqt bhar sakte ho.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <div>
          <Label>Fees kis period ki hai</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            End date hi agli due date banegi.
          </p>
        </div>

        <DurationPicker
          plans={plans ?? []}
          selectedMonths={selectedMonths}
          onSelect={setDuration}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="joinDate" className="text-xs text-muted-foreground">
              Start
            </Label>
            <Input
              id="joinDate"
              type="date"
              value={form.joinDate}
              onChange={(e) => setStart(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextDueDate" className="text-xs text-muted-foreground">
              End (next due)
            </Label>
            <Input
              id="nextDueDate"
              type="date"
              value={form.nextDueDate}
              onChange={(e) => set("nextDueDate", e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
        </div>
        {errors.joinDate ? (
          <p className="text-sm text-destructive">{errors.joinDate}</p>
        ) : null}
        {errors.nextDueDate ? (
          <p className="text-sm text-destructive">{errors.nextDueDate}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          className="text-base"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={submitting || !canSubmit}
      >
        {submitting ? <Spinner className="size-4" /> : null}
        Member add karo
      </Button>
    </form>
  );
}
