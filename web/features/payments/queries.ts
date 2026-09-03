"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberKeys } from "@/features/members/queries";
import { dashboardKeys } from "@/features/dashboard/queries";
import { reminderKeys } from "@/features/reminders/queries";
import { paymentsApi } from "./api";
import type { RecordPaymentInput, RecordPaymentResult } from "./types";

export const paymentKeys = {
  all: (gymId: string) => ["gyms", gymId, "payments"] as const,
  forMember: (gymId: string, memberId: string) =>
    ["gyms", gymId, "payments", "member", memberId] as const,
};

export function useMemberPayments(gymId: string, memberId: string) {
  return useQuery({
    queryKey: paymentKeys.forMember(gymId, memberId),
    queryFn: () => paymentsApi.listForMember(gymId, memberId),
  });
}

/**
 * Recording a payment moves the member's due date, which ripples into the
 * member list, the dashboard counts and the pending reminders queue.
 *
 * Listing those invalidations here - rather than reloading by hand at each call
 * site, as the previous implementation did - means a new screen reading any of
 * this data stays correct without remembering to refresh itself.
 */
export function useRecordPayment(gymId: string, memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      paymentsApi.record(gymId, memberId, input),

    onSuccess: (result: RecordPaymentResult) => {
      // The response already carries the updated member; seed it rather than refetch.
      queryClient.setQueryData(memberKeys.detail(gymId, memberId), result.member);

      void queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all(gymId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all(gymId) });
      void queryClient.invalidateQueries({ queryKey: reminderKeys.all(gymId) });
    },
  });
}
