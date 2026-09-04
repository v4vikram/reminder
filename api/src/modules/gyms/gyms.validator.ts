import { z } from "zod";

export const createGymSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(1).optional(),
  address: z.string().trim().max(300).optional(),
});

export const updateGymSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(1),
    address: z.string().trim().max(300),
    reminderDaysBefore: z.coerce.number().int().min(0).max(30),
    /** Language of the WhatsApp text members receive - not the owner UI. */
    messageLanguage: z.enum(["EN", "HI_LATN"]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateGymInput = z.infer<typeof createGymSchema>;
export type UpdateGymInput = z.infer<typeof updateGymSchema>;
