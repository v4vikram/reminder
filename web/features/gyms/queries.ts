"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/queries";
import { gymsApi } from "./api";
import type { CreateGymInput, UpdateGymInput } from "./types";

/**
 * Both mutations invalidate the session, because `/auth/me` is what carries the
 * gym list and its settings. Anything reading `activeGym` updates on its own.
 */
export function useCreateGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGymInput) => gymsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.session }),
  });
}

export function useUpdateGym(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGymInput) => gymsApi.update(gymId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.session }),
  });
}
