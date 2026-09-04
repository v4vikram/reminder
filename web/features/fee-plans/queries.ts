"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feePlansApi } from "./api";
import type { CreateFeePlanInput, UpdateFeePlanInput } from "./types";

export const feePlanKeys = {
  all: (gymId: string) => ["gyms", gymId, "fee-plans"] as const,
};

/**
 * The gym's price tiers.
 *
 * Read on the add-member and payment screens to build quick-select buttons, so
 * the owner taps "2 months - 700" instead of retyping both numbers every time.
 * Rarely changes, hence the long staleTime.
 */
export function useFeePlans(gymId: string) {
  return useQuery({
    queryKey: feePlanKeys.all(gymId),
    queryFn: () => feePlansApi.list(gymId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateFeePlan(gymId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFeePlanInput) => feePlansApi.create(gymId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feePlanKeys.all(gymId) }),
  });
}

export function useUpdateFeePlan(gymId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: UpdateFeePlanInput }) =>
      feePlansApi.update(gymId, planId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feePlanKeys.all(gymId) }),
  });
}

export function useDeleteFeePlan(gymId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => feePlansApi.remove(gymId, planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feePlanKeys.all(gymId) }),
  });
}
