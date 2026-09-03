import { apiClient } from "@/lib/api-client";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  summary: (gymId: string) =>
    apiClient.get<DashboardSummary>(`/gyms/${gymId}/dashboard/summary`),
};
