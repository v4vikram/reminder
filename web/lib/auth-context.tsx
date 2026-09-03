"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, tokenStore } from "./api";
import type { Gym, User } from "./types";

interface MeResponse {
  user: User;
  gyms: Gym[];
}

type Status = "loading" | "authenticated" | "unauthenticated";

interface Session {
  status: Status;
  user: User | null;
  gyms: Gym[];
}

const SIGNED_OUT: Session = { status: "unauthenticated", user: null, gyms: [] };

interface AuthValue extends Session {
  /** The gym being managed. One per owner today; ADR 002 leaves room for more. */
  activeGym: Gym | null;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Resolves the current session. Never throws: a failure means signed out. */
async function loadSession(): Promise<Session> {
  if (!tokenStore.get()) return SIGNED_OUT;

  try {
    const me = await api.get<MeResponse>("/auth/me");
    return { status: "authenticated", user: me.user, gyms: me.gyms };
  } catch {
    // request() already cleared the token on a 401.
    return SIGNED_OUT;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    status: "loading",
    user: null,
    gyms: [],
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // State is set from the promise callback rather than the effect body: the
    // token check is synchronous, and assigning it inline would be a cascading
    // render the moment this provider mounts.
    void loadSession().then((next) => {
      if (!cancelled) setSession(next);
    });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = useCallback(async () => {
    setSession(await loadSession());
  }, []);

  const signOut = useCallback(() => {
    // Fire and forget: the token is stateless, so the server has nothing to
    // revoke (ADR 010). What matters is dropping it locally.
    void api.post("/auth/logout").catch(() => {});
    tokenStore.clear();
    setSession(SIGNED_OUT);
    setNonce((n) => n + 1);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ...session,
      activeGym: session.gyms[0] ?? null,
      refresh,
      signOut,
    }),
    [session, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
