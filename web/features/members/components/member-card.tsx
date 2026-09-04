"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate, formatRupees } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dueStatusVariant } from "../utils";
import type { Member } from "../types";

export function MemberCard({ member }: { member: Member }) {
  const t = useTranslations("members");
  const ts = useTranslations("dueStatus");
  const { pending } = member;

  return (
    <Link href={`/members/${member.id}`} className="block">
      <Card className="transition-colors active:bg-accent">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-medium">{member.name}</p>

            {pending ? (
              <>
                {/*
                  Arrears read as a span. "3 months pending · ₹1,200" over
                  "20 Jun – 19 Sep" tells the owner how far behind this member
                  is and for which period - a single due date and one month's
                  fee said neither.
                */}
                <p className="tabular text-sm font-medium text-destructive">
                  {t("pending", { count: pending.months })}
                  {pending.amount !== null ? ` · ${formatRupees(pending.amount)}` : ""}
                </p>
                <p className="tabular text-xs text-muted-foreground">
                  {formatDate(pending.from)} – {formatDate(pending.to)}
                </p>
              </>
            ) : (
              <p className="tabular text-sm text-muted-foreground">
                {t("due", { date: formatDate(member.nextDueDate) })}
                {member.feeAmount !== null ? ` · ${formatRupees(member.feeAmount)}` : ""}
              </p>
            )}
          </div>

          <Badge variant={dueStatusVariant[member.dueStatus]} className="shrink-0">
            {member.dueStatus === "overdue"
              ? ts("overdueShort", { days: member.daysOverdue })
              : ts(member.dueStatus)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
