import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

/**
 * Created per browser session rather than at module scope: a module-level
 * client would be shared across requests during SSR and leak one user's data
 * into another's response.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 401/403/404 will not resolve itself on a retry; only genuine
        // network or server faults are worth attempting again.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
