"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { ApiError } from "./api";

interface Result<T> {
  /** The `key#nonce` this result belongs to. */
  token: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Minimal data-fetching hook: load on mount, reload when `key` changes, plus a
 * manual `reload()`.
 *
 * `key` is a string rather than a dependency array because a variable array
 * cannot be statically checked - and it hides real bugs when the list drifts
 * from what the fetcher actually reads.
 *
 * Two details worth knowing:
 *
 * - `loading` is derived by comparing the key that produced the current result
 *   against the key being requested, so it never needs to be assigned inside an
 *   effect (which would cause a cascading render on mount).
 * - In-flight responses are discarded when the key changes or the component
 *   unmounts. Without that, typing quickly in the members search lets a slow
 *   earlier response land after a faster later one and show results for a query
 *   the user has already moved past.
 *
 * Deliberately not TanStack Query: each screen shows one resource, so caching
 * and background revalidation would be machinery without a problem to solve.
 */
export function useResource<T>(fetcher: () => Promise<T>, key: string) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [nonce, setNonce] = useState(0);

  const token = `${key}#${nonce}`;

  // Lets the effect call the latest fetcher without listing it as a dependency
  // (it is a new closure every render) and without writing a ref during render.
  const runFetch = useEffectEvent(() => fetcher());

  useEffect(() => {
    let cancelled = false;

    runFetch()
      .then((data) => {
        if (!cancelled) setResult({ token, data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult({
          token,
          data: null,
          error:
            err instanceof ApiError
              ? err
              : new ApiError("INTERNAL_ERROR", "Unexpected error", 0),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: result?.token === token ? result.data : null,
    error: result?.token === token ? result.error : null,
    loading: result?.token !== token,
    reload,
  };
}
