import type { DueStatus } from "./types";

/**
 * Member-specific display rules.
 *
 * Only the colour mapping lives here now - the labels moved into the message
 * bundles so they translate with everything else. Keeping the variant here
 * means the list, the detail screen and the reminders queue cannot disagree
 * about what "overdue" looks like.
 */
export const dueStatusVariant: Record<
  DueStatus,
  "destructive" | "default" | "secondary"
> = {
  overdue: "destructive",
  due_soon: "default",
  upcoming: "secondary",
};
