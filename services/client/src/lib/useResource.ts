import { useCallback, useEffect, useState } from "react";
import { getJson } from "./api.ts";

export type Resource<T> = {
  status: "loading" | "ready" | "unavailable";
  data: T | null;
  /** Set while the last attempt failed but we still hold a previous result. */
  error: string | null;
  refresh: () => void;
};

type InternalState<T> = {
  status: "loading" | "ready" | "unavailable";
  data: T | null;
  error: string | null;
};

/**
 * Fetch a JSON endpoint, optionally polling.
 *
 * On failure the panel goes `unavailable` — but only if we never had data. Once
 * a poll has succeeded, a later failure keeps the last good values on screen and
 * just sets `error`, so a blip does not make the page flash empty.
 */
export function useResource<T>(path: string, pollMs = 0): Resource<T> {
  const [state, setState] = useState<InternalState<T>>({
    status: "loading",
    data: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timer: number | undefined;

    if (!path) return;

    const run = async () => {
      try {
        const data = await getJson<T>(path, controller.signal);
        if (!cancelled) setState({ status: "ready", data, error: null });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "unavailable";
        setState((previous) =>
          previous.data === null
            ? { status: "unavailable", data: null, error: message }
            : { status: "ready", data: previous.data, error: message },
        );
      }

      if (!cancelled && pollMs > 0) {
        timer = window.setTimeout(run, pollMs);
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [path, pollMs, nonce]);

  // Derived during render rather than written from the effect: an empty path
  // means there is nothing to fetch, which is knowable without a round trip.
  if (!path)
    return {
      status: "unavailable",
      data: null,
      error: "nothing to load",
      refresh,
    };

  return { ...state, refresh };
}
