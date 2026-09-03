import { apiClient } from "@/lib/api-client";
import type { Session } from "./types";

/**
 * Transport only. No React, no caching, no business rules - each function maps
 * to exactly one endpoint so it can be read against docs/api-spec.yaml.
 */
export const authApi = {
  getSession: () => apiClient.get<Session>("/auth/me"),
  logout: () => apiClient.post<void>("/auth/logout"),
};
