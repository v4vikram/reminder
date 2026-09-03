export type GymPlan = "TRIAL" | "FREE" | "PAID";

export interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  plan: GymPlan;
  monthlyPrice: number | null;
  trialEndsAt: string | null;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGymInput {
  name: string;
  phone?: string;
  address?: string;
}

export interface UpdateGymInput {
  name?: string;
  phone?: string;
  address?: string;
  reminderDaysBefore?: number;
}
