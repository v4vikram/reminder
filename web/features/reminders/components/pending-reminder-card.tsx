"use client";

import { CheckIcon, MessageCircleIcon } from "lucide-react";
import { formatDate, formatPhone, formatRelativeDate, formatRupees } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PendingReminder } from "../types";

export function PendingReminderCard({
  item,
  onSend,
  sending,
}: {
  item: PendingReminder;
  onSend: (item: PendingReminder) => void;
  sending: boolean;
}) {
  const { member } = item;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">{formatPhone(member.phone)}</p>
          </div>
          <Badge variant={member.dueStatus === "overdue" ? "destructive" : "default"}>
            {member.dueStatus === "overdue"
              ? `${member.daysOverdue}d overdue`
              : "Due soon"}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Due {formatDate(member.nextDueDate)}
          </span>
          <span className="font-medium">{formatRupees(member.feeAmount)}</span>
        </div>

        {/* Shown so the owner knows exactly what is about to be sent. */}
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {item.messageText}
        </p>

        <Button
          onClick={() => onSend(item)}
          disabled={sending}
          size="lg"
          className="h-12 w-full"
        >
          <MessageCircleIcon className="size-4" />
          {item.lastRemindedAt ? "Dobara bhejo" : "WhatsApp pe bhejo"}
        </Button>

        {item.lastRemindedAt ? (
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <CheckIcon className="size-3" />
            Last reminder {formatRelativeDate(item.lastRemindedAt)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
