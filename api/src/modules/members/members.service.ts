import type { Gym, Member, Prisma } from "../../../generated/prisma/client.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import { normalizePhone } from "../../shared/utils/phone.ts";
import {
  addDays,
  addMonths,
  daysOverdue,
  deriveDueStatus,
  pendingPeriod,
  today,
  toDateOnly,
  type DueStatus,
} from "../../shared/utils/dates.ts";
import * as repo from "./members.repository.ts";
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from "./members.validator.ts";

/**
 * Business logic for members. Deliberately knows nothing about req/res, so it
 * stays unit-testable and can be reused by a cron or CLI later - which is
 * exactly what Phase 1 does with the reminders module.
 */

export interface MemberResponse {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  /** Null when the owner has not agreed a fee for this member yet. */
  feeAmount: number | null;
  joinDate: string;
  nextDueDate: string;
  status: Member["status"];
  dueStatus: DueStatus;
  daysOverdue: number;
  /**
   * Arrears as a span, not a single date. A member three months behind owes
   * three months; reporting one due date and one month's fee understated it.
   * Null when nothing is overdue.
   */
  pending: {
    months: number;
    from: string;
    to: string;
    /** months x feeAmount, or null when no fee is set. */
    amount: number | null;
  } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toPending(member: Member, now: Date): MemberResponse["pending"] {
  const period = pendingPeriod(member.nextDueDate, now);
  if (!period) return null;

  return {
    months: period.months,
    from: toIsoDate(period.from),
    to: toIsoDate(period.to),
    amount:
      member.feeAmount === null ? null : Number(member.feeAmount) * period.months,
  };
}

/** Serialises a member for the wire, adding the derived due fields. */
export function toResponse(member: Member, gym: Gym, now = today()): MemberResponse {
  return {
    id: member.id,
    gymId: member.gymId,
    name: member.name,
    phone: member.phone,
    // Prisma returns Decimal; the wire format is a plain number.
    feeAmount: member.feeAmount === null ? null : Number(member.feeAmount),
    joinDate: toIsoDate(member.joinDate),
    nextDueDate: toIsoDate(member.nextDueDate),
    status: member.status,
    dueStatus: deriveDueStatus(member.nextDueDate, gym.reminderDaysBefore, now),
    daysOverdue: daysOverdue(member.nextDueDate, now),
    pending: toPending(member, now),
    notes: member.notes,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

function toIsoDate(date: Date): string {
  return toDateOnly(date).toISOString().slice(0, 10);
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Translates the dueFilter query parameter into a date range.
 *
 * The thresholds mirror deriveDueStatus() so the filtered list and each row's
 * dueStatus badge can never disagree. See docs/schema.md §6.
 */
function dueFilterToWhere(
  filter: ListMembersQuery["dueFilter"],
  reminderDaysBefore: number,
  now: Date,
): Prisma.MemberWhereInput {
  if (!filter) return {};

  const soonCutoff = addDays(now, reminderDaysBefore);

  switch (filter) {
    case "overdue":
      return { nextDueDate: { lt: now } };
    case "due_soon":
      return { nextDueDate: { gte: now, lte: soonCutoff } };
    case "upcoming":
      return { nextDueDate: { gt: soonCutoff } };
  }
}

/**
 * Builds the search clause.
 *
 * The phone branch is only added when the term actually contains digits.
 * Without that guard a text search like "priya" strips to an empty string,
 * and `phone contains ""` matches every row - silently disabling the filter.
 */
function searchToWhere(search: string | undefined): Prisma.MemberWhereInput {
  if (!search) return {};

  const clauses: Prisma.MemberWhereInput[] = [
    { name: { contains: search, mode: "insensitive" } },
  ];

  const digits = search.replace(/D/g, "");
  if (digits.length > 0) clauses.push({ phone: { contains: digits } });

  return { OR: clauses };
}

export async function listMembers(gym: Gym, query: ListMembersQuery) {
  const now = today();

  const where: Prisma.MemberWhereInput = {
    // Default to active members; inactive ones are soft-deleted.
    status: query.status ?? "ACTIVE",
    ...dueFilterToWhere(query.dueFilter, gym.reminderDaysBefore, now),
    ...searchToWhere(query.search),
  };

  const skip = (query.page - 1) * query.limit;
  const [members, total] = await repo.findManyByGym(gym.id, where, skip, query.limit);

  return {
    items: members.map((m) => toResponse(m, gym, now)),
    total,
  };
}

export async function getMember(gym: Gym, memberId: string): Promise<MemberResponse> {
  const member = await repo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");
  return toResponse(member, gym);
}

export async function createMember(
  gym: Gym,
  input: CreateMemberInput,
): Promise<MemberResponse> {
  const phone = normalizePhone(input.phone);

  const existing = await repo.findByPhoneInGym(gym.id, phone);
  if (existing) {
    throw ApiError.conflict("A member with this phone number already exists in this gym");
  }

  const joinDate = parseDate(input.joinDate);
  // Default the first due date to one billing cycle after joining.
  const nextDueDate = input.nextDueDate
    ? parseDate(input.nextDueDate)
    : addMonths(joinDate, 1);

  const member = await repo.create({
    gymId: gym.id,
    name: input.name,
    phone,
    // Omitted rather than set to null, so Prisma leaves the column unset
    // when no fee has been agreed yet.
    ...(input.feeAmount !== undefined ? { feeAmount: input.feeAmount } : {}),
    joinDate,
    nextDueDate,
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });

  return toResponse(member, gym);
}

export async function updateMember(
  gym: Gym,
  memberId: string,
  input: UpdateMemberInput,
): Promise<MemberResponse> {
  const member = await repo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const data: Prisma.MemberUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.feeAmount !== undefined) data.feeAmount = input.feeAmount;
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.nextDueDate !== undefined) data.nextDueDate = parseDate(input.nextDueDate);

  if (input.phone !== undefined) {
    const phone = normalizePhone(input.phone);
    if (phone !== member.phone) {
      const clash = await repo.findByPhoneInGym(gym.id, phone);
      if (clash) {
        throw ApiError.conflict(
          "A member with this phone number already exists in this gym",
        );
      }
      data.phone = phone;
    }
  }

  const updated = await repo.update(memberId, data);
  return toResponse(updated, gym);
}

export async function deactivateMember(gym: Gym, memberId: string): Promise<void> {
  const member = await repo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");
  await repo.deactivate(memberId);
}
