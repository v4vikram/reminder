import { z } from "zod";

export const createFeePlanSchema = z.object({
  /** 1 = one month, 2 = two months, and so on. */
  months: z.number().int().min(1).max(36),
  amount: z.number().nonnegative().max(1_000_000),
});

export const updateFeePlanSchema = z
  .object({
    months: z.number().int().min(1).max(36),
    amount: z.number().nonnegative().max(1_000_000),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateFeePlanInput = z.infer<typeof createFeePlanSchema>;
export type UpdateFeePlanInput = z.infer<typeof updateFeePlanSchema>;
