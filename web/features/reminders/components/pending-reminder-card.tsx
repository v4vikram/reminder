"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("reminders");
  const tm = useTranslations("members");
  const { member } = item;
  const { pending } = member;

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
              ? t("overdueBadge", { days: member.daysOverdue })
              : t("dueSoonBadge")}
          </Badge>
        </div>

        {pending ? (
          /* For someone several months behind, the amount owed and the span it
             covers matter more than the next due date on its own. */
          <div className="tabular space-y-0.5 rounded-md bg-destructive/5 px-3 py-2">
            <p className="text-sm font-medium text-destructive">
              {tm("pending", { count: pending.months })}
              {pending.amount !== null ? ` · ${formatRupees(pending.amount)}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(pending.from)} – {formatDate(pending.to)}
            </p>
          </div>
        ) : (
          <div className="tabular flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {tm("due", { date: formatDate(member.nextDueDate) })}
            </span>
            {member.feeAmount !== null ? (
              <span className="font-medium">{formatRupees(member.feeAmount)}</span>
            ) : null}
          </div>
        )}

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
          {item.lastRemindedAt ? t("sendAgain") : t("send")}
        </Button>

        {item.lastRemindedAt ? (
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <CheckIcon className="size-3" />
            {t("lastReminder", { when: formatRelativeDate(item.lastRemindedAt) })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
