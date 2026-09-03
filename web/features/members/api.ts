import { apiClient, type Paginated } from "@/lib/api-client";
import type {
  CreateMemberInput,
  Member,
  MemberListFilters,
  UpdateMemberInput,
} from "./types";

export const membersApi = {
  list: (gymId: string, filters: MemberListFilters = {}) =>
    apiClient.get<Paginated<Member>>(`/gyms/${gymId}/members`, filters),

  getById: (gymId: string, memberId: string) =>
    apiClient.get<Member>(`/gyms/${gymId}/members/${memberId}`),

  create: (gymId: string, input: CreateMemberInput) =>
    apiClient.post<Member>(`/gyms/${gymId}/members`, input),

  update: (gymId: string, memberId: string, input: UpdateMemberInput) =>
    apiClient.patch<Member>(`/gyms/${gymId}/members/${memberId}`, input),

  /** Soft delete: the member becomes INACTIVE, the row and its history survive. */
  deactivate: (gymId: string, memberId: string) =>
    apiClient.delete<void>(`/gyms/${gymId}/members/${memberId}`),
};
