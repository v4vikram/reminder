import { apiClient } from "@/lib/api-client";
import type { CreateFeePlanInput, FeePlan, UpdateFeePlanInput } from "./types";

export const feePlansApi = {
  list: (gymId: string) => apiClient.get<FeePlan[]>(`/gyms/${gymId}/fee-plans`),

  create: (gymId: string, input: CreateFeePlanInput) =>
    apiClient.post<FeePlan>(`/gyms/${gymId}/fee-plans`, input),

  update: (gymId: string, planId: string, input: UpdateFeePlanInput) =>
    apiClient.patch<FeePlan>(`/gyms/${gymId}/fee-plans/${planId}`, input),

  remove: (gymId: string, planId: string) =>
    apiClient.delete<void>(`/gyms/${gymId}/fee-plans/${planId}`),
};
