"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { authApi } from "./api";
import { useAuthStore } from "./store";
import type { Session } from "./types";

export const authKeys = {
  session: ["auth", "session"] as const,
};

/**
 * The signed-in session.
 *
 * Enabled only once the token has been rehydrated and exists, so it never fires
 * a request that is guaranteed to 401. `retry: false` for the same reason: an
 * expired token will not become valid on a second attempt.
 */
export function useSession() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const query = useQuery<Session>({
    queryKey: authKeys.session,
    queryFn: authApi.getSession,
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const status = !hydrated || (Boolean(token) && query.isPending)
    ? "loading"
    : query.data
      ? "authenticated"
      : "unauthenticated";

  return {
    status,
    user: query.data?.user ?? null,
    gyms: query.data?.gyms ?? [],
    /** The gym being managed. One per owner today; ADR 002 leaves room for more. */
    activeGym: query.data?.gyms[0] ?? null,
    refetch: query.refetch,
  } as const;
}

/** Signs out locally and clears every cached server response. */
export function useSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(() => {
    // Fire and forget: the token is stateless, so the server has nothing to
    // revoke (ADR 010). What matters is dropping it locally.
    void authApi.logout().catch(() => {});
    signOut();
    // Without this the next user to sign in on this device briefly sees the
    // previous owner's cached members.
    queryClient.clear();
    router.replace("/login");
  }, [signOut, queryClient, router]);
}
