import type { Member } from "@/features/members/types";

export type PaymentMethod = "CASH" | "UPI" | "CARD" | "OTHER";

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  /** How many months this payment covered. */
  months: number;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  method: PaymentMethod;
  recordedById: string;
  createdAt: string;
}

export interface RecordPaymentInput {
  /** Members often clear several months at once, usually at a bundled rate. */
  months?: number;
  amount?: number;
  paidAt?: string;
  method?: PaymentMethod;
}

/**
 * Recording a payment returns the updated member too, because the same
 * transaction advances its due date (docs/schema.md §4).
 */
export interface RecordPaymentResult {
  payment: Payment;
  member: Member;
}
