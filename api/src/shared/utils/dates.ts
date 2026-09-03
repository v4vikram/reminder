/**
 * Date utilities.
 *
 * The gyms are in India but the server may run anywhere, so "today" is always
 * resolved in IST. Otherwise, around midnight, due status would flip based on
 * the server's timezone rather than the gym's.
 *
 * `nextDueDate` and `joinDate` are `@db.Date` columns (date-only), so all
 * comparisons normalise to UTC midnight.
 */

const GYM_TIME_ZONE = "Asia/Kolkata";
const MS_PER_DAY = 86_400_000;

/** Today's date in IST, expressed as a UTC-midnight Date. */
export function today(timeZone: string = GYM_TIME_ZONE): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

/** Strips the time component, returning UTC midnight of the same calendar day. */
export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Adds months, clamping the day to the target month's length.
 * 31 Jan + 1 month = 28/29 Feb, since 31 Feb does not exist.
 */
export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthLastDay = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month + months, Math.min(day, targetMonthLastDay)));
}

/** b - a, in whole days. Both operands are treated as date-only. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((toDateOnly(b).getTime() - toDateOnly(a).getTime()) / MS_PER_DAY);
}

export const DueStatus = {
  OVERDUE: "overdue",
  DUE_SOON: "due_soon",
  UPCOMING: "upcoming",
} as const;

export type DueStatus = (typeof DueStatus)[keyof typeof DueStatus];

/**
 * Due status is derived, never stored.
 *
 * It changes on its own as time passes. Storing it would require a daily cron
 * whose only job is refreshing statuses, and a failure in that cron would make
 * the whole dashboard wrong. See docs/schema.md §6.
 */
export function deriveDueStatus(
  nextDueDate: Date,
  reminderDaysBefore: number,
  now: Date = today(),
): DueStatus {
  const diff = daysBetween(now, nextDueDate);
  if (diff < 0) return DueStatus.OVERDUE;
  if (diff <= reminderDaysBefore) return DueStatus.DUE_SOON;
  return DueStatus.UPCOMING;
}

/** Days overdue, or 0 when not overdue. */
export function daysOverdue(nextDueDate: Date, now: Date = today()): number {
  const diff = daysBetween(now, nextDueDate);
  return diff < 0 ? Math.abs(diff) : 0;
}
