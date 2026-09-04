import type { Gym } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";
import { normalizePhone } from "../../shared/utils/phone.ts";
import type { CreateGymInput, UpdateGymInput } from "./gyms.validator.ts";

export interface GymResponse {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  plan: Gym["plan"];
  monthlyPrice: number | null;
  trialEndsAt: string | null;
  reminderDaysBefore: number;
  messageLanguage: Gym["messageLanguage"];
  createdAt: string;
  updatedAt: string;
}

export function toResponse(gym: Gym): GymResponse {
  return {
    id: gym.id,
    name: gym.name,
    phone: gym.phone,
    address: gym.address,
    plan: gym.plan,
    monthlyPrice: gym.monthlyPrice === null ? null : Number(gym.monthlyPrice),
    trialEndsAt: gym.trialEndsAt?.toISOString() ?? null,
    reminderDaysBefore: gym.reminderDaysBefore,
    messageLanguage: gym.messageLanguage,
    createdAt: gym.createdAt.toISOString(),
    updatedAt: gym.updatedAt.toISOString(),
  };
}

const TRIAL_DAYS = 30;

/**
 * Onboarding: the first thing a newly signed-in owner does.
 *
 * The trial window is written as data on the row rather than inferred from
 * createdAt, so extending one gym's trial is an UPDATE and not a code change
 * (docs/schema.md §3.6).
 */
export async function createGym(
  ownerId: string,
  input: CreateGymInput,
): Promise<GymResponse> {
  const trialEndsAt = new Date();
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + TRIAL_DAYS);

  const gym = await prisma.gym.create({
    data: {
      ownerId,
      name: input.name,
      ...(input.phone ? { phone: normalizePhone(input.phone) } : {}),
      ...(input.address ? { address: input.address } : {}),
      plan: "TRIAL",
      trialEndsAt,
    },
  });

  return toResponse(gym);
}

/**
 * `gym` comes from tenantGuard, which already proved ownership, so there is no
 * second check here - see docs/adr/008.
 */
export async function updateGym(gym: Gym, input: UpdateGymInput): Promise<GymResponse> {
  const updated = await prisma.gym.update({
    where: { id: gym.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: normalizePhone(input.phone) } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.reminderDaysBefore !== undefined
        ? { reminderDaysBefore: input.reminderDaysBefore }
        : {}),
      ...(input.messageLanguage !== undefined
        ? { messageLanguage: input.messageLanguage }
        : {}),
    },
  });

  return toResponse(updated);
}
