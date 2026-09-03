"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  loading,
  icon,
  alarming = false,
}: {
  label: string;
  value: number | string | undefined;
  loading: boolean;
  icon?: ReactNode;
  /** Renders the number in the destructive colour when it is above zero. */
  alarming?: boolean;
}) {
  const highlight = alarming && Number(value) > 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-14" />
        ) : (
          <p
            className={
              highlight
                ? "text-2xl font-semibold text-destructive"
                : "text-2xl font-semibold"
            }
          >
            {value ?? "—"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
