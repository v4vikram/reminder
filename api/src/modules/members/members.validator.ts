import { z } from "zod";

/** Matches a plain YYYY-MM-DD calendar date. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format");

export const createMemberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  // Accepted in any common form; normalised to E.164 in the service layer.
  phone: z.string().trim().min(1),
  feeAmount: z.number().nonnegative().max(1_000_000),
  joinDate: isoDate,
  /** Optional; defaults to joinDate + 1 month. */
  nextDueDate: isoDate.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateMemberSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(1),
    feeAmount: z.number().nonnegative().max(1_000_000),
    nextDueDate: isoDate,
    status: z.enum(["ACTIVE", "INACTIVE"]),
    notes: z.string().trim().max(500),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listMembersQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  dueFilter: z.enum(["overdue", "due_soon", "upcoming"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const memberParamsSchema = z.object({
  gymId: z.string().min(1),
  memberId: z.string().min(1),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
