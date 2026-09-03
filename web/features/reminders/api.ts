import { apiClient, type Paginated } from "@/lib/api-client";
import type { LogReminderInput, PendingFilter, PendingReminder, Reminder } from "./types";

export const remindersApi = {
  listPending: (gymId: string, dueFilter: PendingFilter = "all") =>
    apiClient.get<PendingReminder[]>(`/gyms/${gymId}/reminders/pending`, { dueFilter }),

  log: (gymId: string, memberId: string, input: LogReminderInput) =>
    apiClient.post<Reminder>(`/gyms/${gymId}/members/${memberId}/reminders`, input),

  history: (gymId: string, memberId?: string) =>
    apiClient.get<Paginated<Reminder>>(`/gyms/${gymId}/reminders`, { memberId }),
};
