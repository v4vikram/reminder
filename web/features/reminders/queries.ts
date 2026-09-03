"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { remindersApi } from "./api";
import type { LogReminderInput, PendingFilter } from "./types";

export const reminderKeys = {
  all: (gymId: string) => ["gyms", gymId, "reminders"] as const,
  pending: (gymId: string, filter: PendingFilter) =>
    ["gyms", gymId, "reminders", "pending", filter] as const,
  history: (gymId: string, memberId?: string) =>
    ["gyms", gymId, "reminders", "history", memberId ?? "all"] as const,
};

export function usePendingReminders(gymId: string, filter: PendingFilter) {
  return useQuery({
    queryKey: reminderKeys.pending(gymId, filter),
    queryFn: () => remindersApi.listPending(gymId, filter),
    placeholderData: (previous) => previous,
  });
}

export function useReminderHistory(gymId: string, memberId?: string) {
  return useQuery({
    queryKey: reminderKeys.history(gymId, memberId),
    queryFn: () => remindersApi.history(gymId, memberId),
  });
}

/**
 * Records that a reminder went out.
 *
 * MVP: called after the owner taps the wa.me link (WHATSAPP_MANUAL). Phase 1:
 * the cron will call the same endpoint with WHATSAPP_API, which is why nothing
 * here is specific to the manual flow.
 */
export function useLogReminder(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, input }: { memberId: string; input: LogReminderInput }) =>
      remindersApi.log(gymId, memberId, input),
    // Refreshes lastRemindedAt on the pending queue.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all(gymId) }),
  });
}
