"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import { useSession, useSignOut } from "@/features/auth/queries";
import { useUpdateGym } from "@/features/gyms/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export default function SettingsPage() {
  const { activeGym, user } = useSession();
  const gym = activeGym!;
  const signOut = useSignOut();
  const updateGym = useUpdateGym(gym.id);
  const [days, setDays] = useState(String(gym.reminderDaysBefore));

  function save() {
    updateGym.mutate(
      { reminderDaysBefore: Number(days) },
      {
        onSuccess: () => notify.success("Settings saved"),
        onError: (err) =>
          notify.error(
            err instanceof ApiError ? err.message : "Could not save settings",
          ),
      },
    );
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
              onClick={save}
              disabled={updateGym.isPending || days === String(gym.reminderDaysBefore)}
              className="h-12 shrink-0"
            >
              {updateGym.isPending ? <Spinner className="size-4" /> : null}
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
