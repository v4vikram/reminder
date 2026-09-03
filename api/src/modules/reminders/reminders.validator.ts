import { z } from "zod";

export const logReminderSchema = z.object({
  channel: z.enum(["WHATSAPP_MANUAL", "WHATSAPP_API", "SMS"]),
  status: z.enum(["PENDING", "SENT", "FAILED"]).default("SENT"),
  /** The text actually sent, so history stays accurate when the template changes. */
  messageText: z.string().max(1000).optional(),
  failureReason: z.string().max(500).optional(),
});

export const pendingQuerySchema = z.object({
  dueFilter: z.enum(["overdue", "due_soon", "all"]).default("all"),
});

export const listRemindersQuerySchema = z.object({
  memberId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LogReminderInput = z.infer<typeof logReminderSchema>;
export type PendingQuery = z.infer<typeof pendingQuerySchema>;
export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>;
