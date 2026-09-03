"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import type { Gym } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { activeGym, user, refresh, signOut } = useAuth();
  const gym = activeGym!;
  const [days, setDays] = useState(String(gym.reminderDaysBefore));
  const [saving, setSaving] = useState(false);

  async function saveDays() {
    setSaving(true);
    try {
      await api.patch<Gym>(`/gyms/${gym.id}`, { reminderDaysBefore: Number(days) });
      await refresh();
      notify.success("Settings saved");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{gym.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{gym.plan}</Badge>
            {gym.trialEndsAt ? <span>Trial till {formatDate(gym.trialEndsAt)}</span> : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="days">Reminder kitne din pehle</Label>
          <div className="flex gap-2">
            <Input
              id="days"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-12 text-base"
            />
            <Button
              onClick={saveDays}
              disabled={saving || days === String(gym.reminderDaysBefore)}
              className="h-12 shrink-0"
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Due date se itne din pehle member &quot;due soon&quot; dikhega.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Separator />
          <Button variant="outline" onClick={signOut} className="h-12 w-full">
            <LogOutIcon className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
