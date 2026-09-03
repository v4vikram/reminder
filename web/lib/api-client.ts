import axios, { AxiosError, type AxiosInstance } from "axios";
import { useAuthStore } from "@/features/auth/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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

/** The API's error envelope, surfaced as a typed error. */
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

  /** Field-level message for a form input, when the API supplied one. */
  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  error: { code: ErrorCode; message: string; details?: FieldError[] };
}

export const http: AxiosInstance = axios.create({ baseURL: BASE_URL });

/**
 * Request interceptor: attach the bearer token.
 *
 * Read from the store at call time rather than captured once, so a sign-in or
 * sign-out takes effect on the very next request without rebuilding the client.
 */
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Response interceptor: unwrap the `{ success, data }` envelope and normalise
 * every failure into an ApiError.
 *
 * Doing it here means no caller ever touches `response.data.data`, and React
 * Query's `error` is always an ApiError with a usable `code`.
 */
http.interceptors.response.use(
  (response) => {
    const body = response.data as SuccessEnvelope<unknown> | undefined;
    // 204 responses have no body at all.
    response.data = body && "data" in body ? body.data : undefined;
    return response;
  },
  (error: AxiosError<ErrorEnvelope>) => {
    if (!error.response) {
      return Promise.reject(new ApiError("NETWORK_ERROR", "Could not reach the server", 0));
    }

    const { status, data } = error.response;

    // The stored token is gone or expired; drop it so the UI falls back to the
    // sign-in screen instead of looping on failed requests.
    if (status === 401) useAuthStore.getState().signOut();

    return Promise.reject(
      new ApiError(
        data?.error?.code ?? "INTERNAL_ERROR",
        data?.error?.message ?? "Something went wrong",
        status,
        data?.error?.details ?? [],
      ),
    );
  },
);

/** Typed helpers so features do not repeat the generic dance. */
export const apiClient = {
  // `params` is a plain object rather than Record<string, unknown>: interfaces
  // have no implicit index signature, so a typed filter object would not satisfy
  // that constraint. axios accepts any object and drops undefined values.
  get: async <T>(url: string, params?: object): Promise<T> =>
    (await http.get<T>(url, { params })).data,
  post: async <T>(url: string, body?: unknown): Promise<T> =>
    (await http.post<T>(url, body)).data,
  patch: async <T>(url: string, body?: unknown): Promise<T> =>
    (await http.patch<T>(url, body)).data,
  delete: async <T>(url: string): Promise<T> => (await http.delete<T>(url)).data,
};

export const googleSignInUrl = `${BASE_URL}/auth/google`;

/** Shared pagination envelope, returned by every list endpoint. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}
