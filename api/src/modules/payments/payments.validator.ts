import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format");

export const recordPaymentSchema = z.object({
  /** Defaults to the member's current feeAmount when omitted. */
  amount: z.number().nonnegative().max(1_000_000).optional(),
  /** Defaults to now. Allows back-dating an entry the owner forgot to record. */
  paidAt: z.iso.datetime().optional(),
  method: z.enum(["CASH", "UPI", "CARD", "OTHER"]).default("CASH"),
});

export const listPaymentsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
