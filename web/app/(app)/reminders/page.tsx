"use client";

import { useState } from "react";
import { BellIcon } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { useSession } from "@/features/auth/queries";
import { useLogReminder, usePendingReminders } from "@/features/reminders/queries";
import { PendingReminderCard } from "@/features/reminders/components/pending-reminder-card";
import type { PendingFilter, PendingReminder } from "@/features/reminders/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The core screen of the MVP.
 *
 * The server hands back a ready-made message and wa.me link for each member
 * (ADR 007); this page only opens the link and reports the send back. When
 * Phase 1 automates sending, the screen keeps working - it just stops being the
 * only way reminders happen.
 */
export default function RemindersPage() {
  const { activeGym } = useSession();
  const gymId = activeGym!.id;
  const [filter, setFilter] = useState<PendingFilter>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data, isPending } = usePendingReminders(gymId, filter);
  const logReminder = useLogReminder(gymId);

  function handleSend(item: PendingReminder) {
    setSendingId(item.member.id);

    // Opened synchronously inside the click handler. After an await the browser
    // treats it as an unrequested popup and blocks it.
    window.open(item.waLink, "_blank", "noopener,noreferrer");

    logReminder.mutate(
      {
        memberId: item.member.id,
        input: {
          channel: "WHATSAPP_MANUAL",
          status: "SENT",
          messageText: item.messageText,
        },
      },
      {
        onSuccess: () => notify.success("Reminder logged", item.member.name),
        // The message may well have been sent even though logging failed, so
        // this says what actually happened rather than claiming a failed send.
        onError: (err) =>
          notify.error(
            "Could not record the reminder",
            err instanceof ApiError ? err.message : undefined,
          ),
        onSettled: () => setSendingId(null),
      },
    );
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground">
          Tap karo, WhatsApp khulega, message pehle se likha hoga.
        </p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as PendingFilter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="due_soon">Due soon</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {!isPending && data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <BellIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">Koi reminder pending nahi</p>
            <p className="text-sm text-muted-foreground">
              Sab members ki fees time pe hai.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {data?.map((item) => (
          <PendingReminderCard
            key={item.member.id}
            item={item}
            onSend={handleSend}
            sending={sendingId === item.member.id}
          />
        ))}
      </div>
    </div>
  );
}
