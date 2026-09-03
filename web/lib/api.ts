import type { Paginated } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TOKEN_KEY = "gymreminder.token";

/**
 * The session token lives in localStorage.
 *
 * It arrives in the callback URL fragment (see docs/adr/010), which the Next
 * server never sees - so this dashboard is client-rendered throughout and
 * cannot use server-side data fetching or a route guard in proxy.ts.
 * That is a deliberate consequence of the Bearer-token design, not an oversight.
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      // Private browsing and blocked site data both throw here.
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* nothing useful to do; the session simply will not persist */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: FieldError[];

  constructor(code: ErrorCode, message: string, status: number, details: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** Field-level message for a form input, if the API supplied one. */
  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Single entry point for every API call.
 *
 * Unwraps the `{ success, data }` envelope so callers deal in plain values, and
 * turns the `{ success: false, error }` shape into a typed ApiError. Because the
 * envelope is uniform (docs/api-contract.md §1.2), this is written once.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = payload?.error;
    // A 401 means the stored token is gone or expired; drop it so the UI
    // falls back to the sign-in screen rather than looping on failed calls.
    if (response.status === 401) tokenStore.clear();

    throw new ApiError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Something went wrong",
      response.status,
      error?.details ?? [],
    );
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const googleSignInUrl = `${BASE_URL}/auth/google`;

export type { Paginated };
