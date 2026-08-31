import { useCallback, useEffect, useState } from "react";

function read(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * A single query-string parameter as React state.
 *
 * Deep links (`?node=alb`) and the browser back button both work, and unlike a
 * router this needs no `try_files` rewrite in the nginx image serving this app.
 */
export function useQueryParam(
  key: string,
): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(() => read(key));

  useEffect(() => {
    const onPopState = () => setValue(read(key));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [key]);

  const update = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(window.location.search);

      if (next === null) params.delete(key);
      else params.set(key, next);

      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ""}`;

      window.history.pushState(null, "", url);
      setValue(next);
    },
    [key],
  );

  return [value, update];
}
