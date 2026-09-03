import { apiClient, type Paginated } from "@/lib/api-client";
import type { Payment, RecordPaymentInput, RecordPaymentResult } from "./types";

export const paymentsApi = {
  record: (gymId: string, memberId: string, input: RecordPaymentInput) =>
    apiClient.post<RecordPaymentResult>(
      `/gyms/${gymId}/members/${memberId}/payments`,
      input,
    ),

  listForMember: (gymId: string, memberId: string) =>
    apiClient.get<Paginated<Payment>>(`/gyms/${gymId}/members/${memberId}/payments`),

  listForGym: (gymId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<Paginated<Payment>>(`/gyms/${gymId}/payments`, params),
};
