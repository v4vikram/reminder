"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
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
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (input: CreateMemberInput) => void;
  submitting: boolean;
  error: unknown;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    feeAmount: "",
    joinDate: todayIso(),
    notes: "",
  });

  const errors = fieldErrors(error);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      feeAmount: Number(form.feeAmount),
      joinDate: form.joinDate,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
  }

  const canSubmit =
    form.name.trim().length >= 2 && form.phone.trim().length > 0 && form.feeAmount !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <Label htmlFor="fee">Monthly fees (₹)</Label>
        <Input
          id="fee"
          value={form.feeAmount}
          onChange={(e) => set("feeAmount", e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="500"
          inputMode="numeric"
          required
          className="h-12 text-base"
        />
        {errors.feeAmount ? (
          <p className="text-sm text-destructive">{errors.feeAmount}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="joinDate">Join date</Label>
        <Input
          id="joinDate"
          type="date"
          value={form.joinDate}
          onChange={(e) => set("joinDate", e.target.value)}
          required
          className="h-12 text-base"
        />
        {errors.joinDate ? (
          <p className="text-sm text-destructive">{errors.joinDate}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Pehli due date iske ek mahine baad set hogi.
        </p>
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
