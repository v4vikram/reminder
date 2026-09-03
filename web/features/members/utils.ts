import type { DueStatus } from "./types";

/**
 * Member-specific display rules.
 *
 * These live with the feature rather than in lib/format so that the labels and
 * colours for a due status cannot drift between the list, the detail screen and
 * the reminders queue.
 */
export const dueStatusLabel: Record<DueStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  upcoming: "Upcoming",
};

export const dueStatusVariant: Record<
  DueStatus,
  "destructive" | "default" | "secondary"
> = {
  overdue: "destructive",
  due_soon: "default",
  upcoming: "secondary",
};

/** Short badge text: days count when overdue, otherwise the plain label. */
export function dueStatusBadge(dueStatus: DueStatus, daysOverdue: number): string {
  return dueStatus === "overdue" ? `${daysOverdue}d` : dueStatusLabel[dueStatus];
}
