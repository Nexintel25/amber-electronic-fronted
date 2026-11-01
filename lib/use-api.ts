"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiState<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

/**
 * Runs `fetcher` on mount and whenever `deps` change (deps must be primitives) or `reload()` is called.
 * `fetcher` is read through a ref, so callers can pass an inline arrow without causing a refetch loop.
 * With `enabled: false` nothing is fetched (e.g. a dialog that is closed); it loads as soon as it turns true.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], { enabled = true }: { enabled?: boolean } = {}): ApiState<T> {
  const ref = useRef(fetcher);
  useEffect(() => {
    ref.current = fetcher;
  });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([tick, ...deps]);
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    ref.current().then(
      (data) => live && setResult({ key, data, error: null }),
      (e: unknown) => live && setResult({ key, data: null, error: e instanceof Error ? e.message : "Something went wrong" }),
    );
    return () => {
      live = false;
    };
  }, [key, enabled]);

  const settled = result?.key === key;
  return { data: settled ? result.data : null, error: settled ? result.error : null, loading: enabled && !settled, reload };
}
