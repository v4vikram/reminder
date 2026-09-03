"use client";

import Link from "next/link";
import { formatDate, formatRupees } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dueStatusBadge, dueStatusVariant } from "../utils";
import type { Member } from "../types";

export function MemberCard({ member }: { member: Member }) {
  return (
    <Link href={`/members/${member.id}`} className="block">
      <Card className="transition-colors active:bg-accent">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              Due {formatDate(member.nextDueDate)} · {formatRupees(member.feeAmount)}
            </p>
          </div>
          <Badge variant={dueStatusVariant[member.dueStatus]} className="shrink-0">
            {dueStatusBadge(member.dueStatus, member.daysOverdue)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
