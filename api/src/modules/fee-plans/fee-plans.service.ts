import type { FeePlan, Gym } from "../../../generated/prisma/client.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import * as repo from "./fee-plans.repository.ts";
import type { CreateFeePlanInput, UpdateFeePlanInput } from "./fee-plans.validator.ts";

export interface FeePlanResponse {
  id: string;
  months: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export function toResponse(plan: FeePlan): FeePlanResponse {
  return {
    id: plan.id,
    months: plan.months,
    amount: Number(plan.amount),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * A gym's price tiers, shortest duration first.
 *
 * These drive the quick-select buttons on the add-member and payment screens,
 * so the owner taps "2 months - 700" instead of retyping both numbers each time.
 */
export async function listPlans(gym: Gym): Promise<FeePlanResponse[]> {
  const plans = await repo.findManyByGym(gym.id);
  return plans.map(toResponse);
}

export async function createPlan(
  gym: Gym,
  input: CreateFeePlanInput,
): Promise<FeePlanResponse> {
  const existing = await repo.findByMonthsInGym(gym.id, input.months);
  if (existing) {
    throw ApiError.conflict(`A plan for ${input.months} month(s) already exists`);
  }

  const plan = await repo.create({
    gymId: gym.id,
    months: input.months,
    amount: input.amount,
  });
  return toResponse(plan);
}

export async function updatePlan(
  gym: Gym,
  planId: string,
  input: UpdateFeePlanInput,
): Promise<FeePlanResponse> {
  const plan = await repo.findByIdInGym(gym.id, planId);
  if (!plan) throw ApiError.notFound("Fee plan not found");

  // Changing the duration could collide with another tier for the same gym.
  if (input.months !== undefined && input.months !== plan.months) {
    const clash = await repo.findByMonthsInGym(gym.id, input.months);
    if (clash) {
      throw ApiError.conflict(`A plan for ${input.months} month(s) already exists`);
    }
  }

  const updated = await repo.update(plan.id, {
    ...(input.months !== undefined ? { months: input.months } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
  });
  return toResponse(updated);
}

export async function deletePlan(gym: Gym, planId: string): Promise<void> {
  const plan = await repo.findByIdInGym(gym.id, planId);
  if (!plan) throw ApiError.notFound("Fee plan not found");

  // Hard delete is safe here: a plan is a convenience for entering figures, not
  // a record of anything. Payments store their own amount and month count.
  await repo.remove(plan.id);
}
