"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiState<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

/**
 * Runs `fetcher` on mount and whenever `deps` change (deps must be primitives) or `reload()` is called.
 * `fetcher` is read through a ref, so callers can pass an inline arrow without causing a refetch loop.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const ref = useRef(fetcher);
  useEffect(() => {
    ref.current = fetcher;
  });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([tick, ...deps]);
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    ref.current().then(
      (data) => live && setResult({ key, data, error: null }),
      (e: unknown) => live && setResult({ key, data: null, error: e instanceof Error ? e.message : "Something went wrong" }),
    );
    return () => {
      live = false;
    };
  }, [key]);

  const settled = result?.key === key;
  return { data: settled ? result.data : null, error: settled ? result.error : null, loading: !settled, reload };
}
