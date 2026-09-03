import { apiClient } from "@/lib/api-client";
import type { CreateGymInput, Gym, UpdateGymInput } from "./types";

export const gymsApi = {
  create: (input: CreateGymInput) => apiClient.post<Gym>("/gyms", input),
  update: (gymId: string, input: UpdateGymInput) =>
    apiClient.patch<Gym>(`/gyms/${gymId}`, input),
};
