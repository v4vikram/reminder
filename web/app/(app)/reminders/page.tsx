"use client";

import { useState } from "react";
import { BellIcon, CheckIcon, MessageCircleIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import { formatDate, formatPhone, formatRelativeDate, formatRupees } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { PendingReminder } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | "overdue" | "due_soon";

/**
 * The core screen of the MVP.
 *
 * The server hands back a ready-made message and wa.me link for each member
 * (ADR 007), so this page only opens the link and reports back that a reminder
 * went out. When Phase 1 automates sending, this screen keeps working - it just
 * stops being the only way reminders happen.
 */
export default function RemindersPage() {
  const { activeGym } = useAuth();
  const gymId = activeGym!.id;
  const [filter, setFilter] = useState<Filter>("all");
  const [sending, setSending] = useState<string | null>(null);

  const { data, loading, reload } = useResource<PendingReminder[]>(
    () => api.get<PendingReminder[]>(`/gyms/${gymId}/reminders/pending`, { dueFilter: filter }),
    `pending:${gymId}:${filter}`,
  );

  async function handleSend(item: PendingReminder) {
    setSending(item.member.id);

    // Open WhatsApp first, synchronously inside the click handler. Doing it
    // after an await would make it a popup the browser blocks.
    window.open(item.waLink, "_blank", "noopener,noreferrer");

    try {
      await api.post(`/gyms/${gymId}/members/${item.member.id}/reminders`, {
        channel: "WHATSAPP_MANUAL",
        status: "SENT",
        messageText: item.messageText,
      });
      notify.success("Reminder logged", item.member.name);
      await reload();
    } catch (err) {
      // The message may well have been sent even though logging failed, so this
      // says what actually happened rather than claiming the send failed.
      notify.error(
        "Could not record the reminder",
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground">
          Tap karo, WhatsApp khulega, message pehle se likha hoga.
        </p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="due_soon">Due soon</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && data?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <BellIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">Koi reminder pending nahi</p>
            <p className="text-sm text-muted-foreground">
              Sab members ki fees time pe hai.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((item) => (
          <Card key={item.member.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(item.member.phone)}
                  </p>
                </div>
                <Badge variant={item.member.dueStatus === "overdue" ? "destructive" : "default"}>
                  {item.member.dueStatus === "overdue"
                    ? `${item.member.daysOverdue}d overdue`
                    : "Due soon"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Due {formatDate(item.member.nextDueDate)}
                </span>
                <span className="font-medium">{formatRupees(item.member.feeAmount)}</span>
              </div>

              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {item.messageText}
              </p>

              <Button
                onClick={() => handleSend(item)}
                disabled={sending === item.member.id}
                size="lg"
                className="h-12 w-full"
              >
                <MessageCircleIcon className="size-4" />
                {item.lastRemindedAt ? "Dobara bhejo" : "WhatsApp pe bhejo"}
              </Button>

              {item.lastRemindedAt && (
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckIcon className="size-3" />
                  Last reminder {formatRelativeDate(item.lastRemindedAt)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
