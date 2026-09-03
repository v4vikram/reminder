import type { Gym, Reminder } from "../../../generated/prisma/client.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import { addDays, today } from "../../shared/utils/dates.ts";
import * as membersRepo from "../members/members.repository.ts";
import {
  toResponse as toMemberResponse,
  type MemberResponse,
} from "../members/members.service.ts";
import * as repo from "./reminders.repository.ts";
import { buildReminderMessage, buildWhatsAppLink } from "./reminders.template.ts";
import type {
  ListRemindersQuery,
  LogReminderInput,
  PendingQuery,
} from "./reminders.validator.ts";

export interface PendingReminder {
  member: MemberResponse;
  messageText: string;
  waLink: string;
  lastRemindedAt: string | null;
}

export interface ReminderResponse {
  id: string;
  gymId: string;
  memberId: string;
  channel: Reminder["channel"];
  status: Reminder["status"];
  messageText: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export function toResponse(reminder: Reminder): ReminderResponse {
  return {
    id: reminder.id,
    gymId: reminder.gymId,
    memberId: reminder.memberId,
    channel: reminder.channel,
    status: reminder.status,
    messageText: reminder.messageText,
    sentAt: reminder.sentAt?.toISOString() ?? null,
    failureReason: reminder.failureReason,
    createdAt: reminder.createdAt.toISOString(),
  };
}

/**
 * Members who need a reminder, each with its message and wa.me link ready to go.
 *
 * The server builds the text and the link, not the client, so the template lives
 * in one place and Phase 1's cron consumes this same list - ignoring `waLink` and
 * sending through the WhatsApp Cloud API instead. That is the whole point of the
 * design: automation becomes a new code path, not a new contract.
 */
export async function listPending(
  gym: Gym,
  query: PendingQuery,
): Promise<PendingReminder[]> {
  const now = today();
  const soonCutoff = addDays(now, gym.reminderDaysBefore);

  const dueWindow =
    query.dueFilter === "overdue"
      ? { lt: now }
      : query.dueFilter === "due_soon"
        ? { gte: now, lte: soonCutoff }
        : // "all": everything that is overdue or coming up within the window.
          { lte: soonCutoff };

  const [members] = await membersRepo.findManyByGym(
    gym.id,
    { status: "ACTIVE", nextDueDate: dueWindow },
    0,
    // The pending screen is a work queue, not a browsable list; cap it rather
    // than paginating so the owner cannot half-send a batch.
    500,
  );

  if (members.length === 0) return [];

  const lastSent = await repo.lastSentByMember(
    gym.id,
    members.map((m) => m.id),
  );
  const lastSentByMemberId = new Map(
    lastSent.map((row) => [row.memberId, row._max.createdAt]),
  );

  return members.map((member) => {
    const messageText = buildReminderMessage(member, gym, member.nextDueDate);
    return {
      member: toMemberResponse(member, gym, now),
      messageText,
      waLink: buildWhatsAppLink(member.phone, messageText),
      lastRemindedAt: lastSentByMemberId.get(member.id)?.toISOString() ?? null,
    };
  });
}

/**
 * Records that a reminder went out.
 *
 * MVP: called by the frontend after the owner taps the wa.me link
 * (channel WHATSAPP_MANUAL). Phase 1: called by the cron after an API send
 * (channel WHATSAPP_API). Same endpoint, same row shape, no migration.
 */
export async function logReminder(
  gym: Gym,
  memberId: string,
  input: LogReminderInput,
): Promise<ReminderResponse> {
  const member = await membersRepo.findByIdInGym(gym.id, memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const reminder = await repo.create({
    gymId: gym.id,
    memberId: member.id,
    channel: input.channel,
    status: input.status,
    // Fall back to the current template when the caller does not echo the text,
    // so history is never empty for a reminder that was actually sent.
    messageText:
      input.messageText ?? buildReminderMessage(member, gym, member.nextDueDate),
    ...(input.status === "SENT" ? { sentAt: new Date() } : {}),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
  });

  return toResponse(reminder);
}

export async function listReminders(gym: Gym, query: ListRemindersQuery) {
  const skip = (query.page - 1) * query.limit;
  const [reminders, total] = await repo.findManyByGym(
    gym.id,
    query.memberId ? { memberId: query.memberId } : {},
    skip,
    query.limit,
  );
  return { items: reminders.map(toResponse), total };
}

