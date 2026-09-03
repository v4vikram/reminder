"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./api";

export const dashboardKeys = {
  all: (gymId: string) => ["gyms", gymId, "dashboard"] as const,
  summary: (gymId: string) => ["gyms", gymId, "dashboard", "summary"] as const,
};

export function useDashboardSummary(gymId: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(gymId),
    queryFn: () => dashboardApi.summary(gymId),
  });
}
