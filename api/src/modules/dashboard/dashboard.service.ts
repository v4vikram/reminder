import type { Gym } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";
import { addDays, today } from "../../shared/utils/dates.ts";

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  dueToday: number;
  dueSoon: number;
  overdue: number;
  collectedThisMonth: number;
  pendingAmount: number;
}

/** First day of the current month, in the gym's timezone. */
function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Counts for the dashboard landing screen.
 *
 * Every figure is derived at read time from nextDueDate and the payments table
 * rather than stored, so nothing can drift out of date (docs/schema.md §6).
 *
 * Issued as one $transaction so all seven numbers come from a single consistent
 * snapshot; separately they could straddle a payment being recorded and show,
 * for example, a member counted as both overdue and paid this month.
 */
export async function getSummary(gym: Gym): Promise<DashboardSummary> {
  const now = today();
  const soonCutoff = addDays(now, gym.reminderDaysBefore);
  const tomorrow = addDays(now, 1);
  const monthStart = startOfMonth(now);

  const active = { gymId: gym.id, status: "ACTIVE" } as const;

  const [
    totalMembers,
    activeMembers,
    dueToday,
    dueSoon,
    overdue,
    collected,
    pending,
  ] = await prisma.$transaction([
    prisma.member.count({ where: { gymId: gym.id } }),
    prisma.member.count({ where: active }),
    prisma.member.count({
      where: { ...active, nextDueDate: { gte: now, lt: tomorrow } },
    }),
    prisma.member.count({
      where: { ...active, nextDueDate: { gte: now, lte: soonCutoff } },
    }),
    prisma.member.count({ where: { ...active, nextDueDate: { lt: now } } }),
    prisma.payment.aggregate({
      where: { gymId: gym.id, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    // What the gym is owed right now: the fees of everyone already past due.
    prisma.member.aggregate({
      where: { ...active, nextDueDate: { lt: now } },
      _sum: { feeAmount: true },
    }),
  ]);

  return {
    totalMembers,
    activeMembers,
    dueToday,
    dueSoon,
    overdue,
    collectedThisMonth: Number(collected._sum.amount ?? 0),
    pendingAmount: Number(pending._sum.feeAmount ?? 0),
  };
}
