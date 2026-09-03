"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "./api";
import type {
  CreateMemberInput,
  Member,
  MemberListFilters,
  UpdateMemberInput,
} from "./types";

/**
 * Query keys are built from one factory so invalidation cannot miss a variant.
 * `all` is a prefix of every other key, which is what lets a mutation clear
 * every filtered list in a single call.
 */
export const memberKeys = {
  all: (gymId: string) => ["gyms", gymId, "members"] as const,
  list: (gymId: string, filters: MemberListFilters) =>
    ["gyms", gymId, "members", "list", filters] as const,
  detail: (gymId: string, memberId: string) =>
    ["gyms", gymId, "members", memberId] as const,
};

export function useMembers(gymId: string, filters: MemberListFilters = {}) {
  return useQuery({
    queryKey: memberKeys.list(gymId, filters),
    queryFn: () => membersApi.list(gymId, filters),
    // Keeps the previous page visible while a new filter or search loads,
    // instead of flashing skeletons on every keystroke.
    placeholderData: (previous) => previous,
  });
}

export function useMember(gymId: string, memberId: string) {
  return useQuery({
    queryKey: memberKeys.detail(gymId, memberId),
    queryFn: () => membersApi.getById(gymId, memberId),
  });
}

export function useCreateMember(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMemberInput) => membersApi.create(gymId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) }),
  });
}

export function useUpdateMember(gymId: string, memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMemberInput) =>
      membersApi.update(gymId, memberId, input),
    onSuccess: (updated: Member) => {
      // Seed the detail cache from the response so the screen does not refetch
      // what the server just handed back.
      queryClient.setQueryData(memberKeys.detail(gymId, memberId), updated);
      void queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) });
    },
  });
}

export function useDeactivateMember(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => membersApi.deactivate(gymId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) }),
  });
}
