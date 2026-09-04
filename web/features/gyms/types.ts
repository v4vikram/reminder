export type GymPlan = "TRIAL" | "FREE" | "PAID";

/**
 * Language of the WhatsApp reminder members receive.
 *
 * Separate from the owner interface language, which is a per-device client
 * preference: the owner may read the app in English while their members are
 * better served in Hinglish. HI_LATN is Hindi in Latin script.
 */
export type MessageLanguage = "EN" | "HI_LATN";

export interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  plan: GymPlan;
  monthlyPrice: number | null;
  trialEndsAt: string | null;
  reminderDaysBefore: number;
  messageLanguage: MessageLanguage;
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
  messageLanguage?: MessageLanguage;
}
