import type { Member } from "@/features/members/types";

export type ReminderChannel = "WHATSAPP_MANUAL" | "WHATSAPP_API" | "SMS";
export type ReminderStatus = "PENDING" | "SENT" | "FAILED";

export interface Reminder {
  id: string;
  gymId: string;
  memberId: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  messageText: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

/**
 * A due member with the message and link the server already prepared.
 *
 * The client never composes the text or the link: the template lives on the
 * server so Phase 1's cron sends exactly the same wording (ADR 007).
 */
export interface PendingReminder {
  member: Member;
  messageText: string;
  waLink: string;
  lastRemindedAt: string | null;
}

export type PendingFilter = "all" | "overdue" | "due_soon";

export interface LogReminderInput {
  channel: ReminderChannel;
  status?: ReminderStatus;
  messageText?: string;
  failureReason?: string;
}
