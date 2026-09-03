import type { Gym, Payment, Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import { addDays, addMonths, toDateOnly } from "../../shared/utils/dates.ts";
import * as membersRepo from "../members/members.repository.ts";
import { toResponse as toMemberResponse } from "../members/members.service.ts";
import * as repo from "./payments.repository.ts";
import type { ListPaymentsQuery, RecordPaymentInput } from "./payments.validator.ts";

export interface PaymentResponse {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  method: Payment["method"];
  recordedById: string;
  createdAt: string;
}

function toIsoDate(date: Date | null): string | null {
  return date ? toDateOnly(date).toISOString().slice(0, 10) : null;
}

export function toResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    gymId: payment.gymId,
    memberId: payment.memberId,
    amount: Number(payment.amount),
    paidAt: payment.paidAt.toISOString(),
    periodStart: toIsoDate(payment.periodStart),
    periodEnd: toIsoDate(payment.periodEnd),
    method: payment.method,
    recordedById: payment.recordedById,
    createdAt: payment.createdAt.toISOString(),
  };
}

/**
 * Records a payment and advances the member's due date.
 *
 * These two writes are the critical invariant of this system and happen in one
 * transaction. If they were allowed to diverge, either the gym takes money and
 * the member still shows as due (so the owner chases someone who already paid),
 * or the due date moves without a revenue record. See docs/schema.md §4.
 *
 * Advancing by exactly one cycle from the *existing* due date - rather than from
 * today - means a member three months behind stays behind after paying for one
 * month, which is the correct accounting.
 */
export async function recordPayment(
  gym: Gym,
  memberId: string,
  input: RecordPaymentInput,
  recordedById: string,
) {
  const member = await membersRepo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const periodStart = toDateOnly(member.nextDueDate);
  const newDueDate = addMonths(periodStart, 1);
  // Inclusive end of the cycle this payment covers.
  const periodEnd = addDays(newDueDate, -1);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await repo.createTx(tx, {
      gymId: gym.id,
      memberId: member.id,
      amount: input.amount ?? Number(member.feeAmount),
      ...(input.paidAt ? { paidAt: new Date(input.paidAt) } : {}),
      periodStart,
      periodEnd,
      method: input.method,
      recordedById,
    });

    const updatedMember = await membersRepo.advanceDueDateTx(tx, member.id, newDueDate);

    return { payment, updatedMember };
  });

  return {
    payment: toResponse(result.payment),
    // The updated member goes back in the response so the client does not
    // need a second round trip to refresh the row it just acted on.
    member: toMemberResponse(result.updatedMember, gym),
  };
}

function dateRangeWhere(query: ListPaymentsQuery): Prisma.PaymentWhereInput {
  if (!query.from && !query.to) return {};

  return {
    paidAt: {
      ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
      // `to` is inclusive, so extend to the end of that day.
      ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    },
  };
}

export async function listGymPayments(gym: Gym, query: ListPaymentsQuery) {
  const skip = (query.page - 1) * query.limit;
  const [payments, total] = await repo.findManyByGym(
    gym.id,
    dateRangeWhere(query),
    skip,
    query.limit,
  );
  return { items: payments.map(toResponse), total };
}

export async function listMemberPayments(
  gym: Gym,
  memberId: string,
  query: ListPaymentsQuery,
) {
  const member = await membersRepo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const skip = (query.page - 1) * query.limit;
  const [payments, total] = await repo.findManyByGym(
    gym.id,
    { memberId, ...dateRangeWhere(query) },
    skip,
    query.limit,
  );
  return { items: payments.map(toResponse), total };
}
