"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import type { Member } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

/** Today in YYYY-MM-DD, which is what the API expects for date fields. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMemberPage() {
  const { activeGym } = useAuth();
  const router = useRouter();
  const gymId = activeGym!.id;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    feeAmount: "",
    joinDate: todayIso(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      await api.post<Member>(`/gyms/${gymId}/members`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        feeAmount: Number(form.feeAmount),
        joinDate: form.joinDate,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      notify.success("Member added");
      router.replace("/members");
    } catch (err) {
      if (err instanceof ApiError && err.details.length > 0) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      } else {
        // A duplicate phone comes back as CONFLICT with no field details, so it
        // needs its own surfacing rather than falling into the generic branch.
        notify.error(err instanceof ApiError ? err.message : "Could not add the member");
      }
      setSaving(false);
    }
  }

  const canSubmit =
    form.name.trim().length >= 2 && form.phone.trim().length > 0 && form.feeAmount !== "";

  return (
    <div className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-2">
        <Button render={<Link href="/members" aria-label="Back to members" />} variant="ghost" size="icon" className="size-11 shrink-0">
            <ChevronLeftIcon className="size-5" />
          </Button>
        <h1 className="text-xl font-semibold tracking-tight">Naya member</h1>
      </header>

      <Card>
        <CardContent className="py-5">
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
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp number</Label>
              {/* inputMode tel rather than type=tel: it raises the numeric keypad
                  while still accepting +, spaces and dashes, which the API
                  normalises to E.164 anyway. */}
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="98765 43210"
                inputMode="tel"
                required
                className="h-12 text-base"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground">
                Isi number pe reminder jayega.
              </p>
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
              {errors.feeAmount && (
                <p className="text-sm text-destructive">{errors.feeAmount}</p>
              )}
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
              {errors.joinDate && (
                <p className="text-sm text-destructive">{errors.joinDate}</p>
              )}
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
              disabled={saving || !canSubmit}
            >
              {saving ? <Spinner className="size-4" /> : null}
              Member add karo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
