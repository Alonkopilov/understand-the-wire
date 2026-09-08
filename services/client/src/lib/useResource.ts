import { useCallback, useEffect, useState } from "react";
import { apiUrl, getJson, snapshotUrl } from "./api.ts";

/**
 * Where the data on screen came from.
 *
 * `snapshot` means the live API did not answer and the client fell back to the
 * copy captured by the nightly workflow — in practice, the infrastructure has
 * been destroyed for the night and this build is being served from S3.
 */
export type Source = "live" | "snapshot";

export type Resource<T> = {
  status: "loading" | "ready" | "unavailable";
  data: T | null;
  /** Set while the last attempt failed but we still hold a previous result. */
  error: string | null;
  source: Source;
  refresh: () => void;
};

type InternalState<T> = {
  status: "loading" | "ready" | "unavailable";
  data: T | null;
  error: string | null;
  source: Source;
};

/** Once we are on the snapshot the cluster is gone, so stop polling hard. */
const SNAPSHOT_POLL_MS = 60000;

/**
 * Fetch a JSON endpoint, optionally polling.
 *
 * Live first, snapshot second. The same bundle therefore works both when it is
 * served from the cluster and when it is served as a static build with no
 * backend behind it, which means the fallback path is exercised every day
 * rather than only on the night it is needed.
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
    source: "live",
  });
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timer: number | undefined;

    if (!path) return;

    const run = async () => {
      let source: Source = "live";

      try {
        const data = await getJson<T>(apiUrl(path), controller.signal);
        if (!cancelled)
          setState({ status: "ready", data, error: null, source });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "unavailable";
        const fallback = snapshotUrl(path);
        let recovered = false;

        if (fallback) {
          try {
            const data = await getJson<T>(fallback, controller.signal);
            if (cancelled) return;
            source = "snapshot";
            recovered = true;
            setState({ status: "ready", data, error: null, source });
          } catch {
            // No snapshot either — fall through to the degraded panel below.
          }
        }

        if (!recovered) {
          if (cancelled || controller.signal.aborted) return;
          setState((previous) =>
            previous.data === null
              ? {
                  status: "unavailable",
                  data: null,
                  error: message,
                  source: previous.source,
                }
              : {
                  status: "ready",
                  data: previous.data,
                  error: message,
                  source: previous.source,
                },
          );
        }
      }

      if (!cancelled && pollMs > 0) {
        // Keep retrying the live API even on the snapshot, so the page heals
        // itself when the cluster comes back in the morning.
        const wait = source === "snapshot" ? SNAPSHOT_POLL_MS : pollMs;
        timer = window.setTimeout(run, wait);
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
      source: "live",
      refresh,
    };

  return { ...state, refresh };
}
