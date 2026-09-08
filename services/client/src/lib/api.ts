import type { Language } from "./types.ts";

/**
 * Same-origin by default: Traefik routes `/api/*` to the Python service and
 * everything else to this app's nginx, so there is no CORS to configure.
 * Override with VITE_API_BASE when running the two apart.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

const TIMEOUT_MS = 8000;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Endpoints the nightly workflow captures before `terraform destroy`, written
 * into the static build as `/snapshot/<name>.json`.
 *
 * `/source` is deliberately absent: it takes a `?path=` argument, so there is
 * no fixed set of responses to capture. Its panel degrades to "unavailable",
 * which is already how it behaves when the backend is missing.
 */
const SNAPSHOT_FILES: Record<string, string> = {
  "/health": "health",
  "/trace": "trace",
  "/cluster": "cluster",
  "/flux": "flux",
  "/aws": "aws",
};

export const SNAPSHOT_META_URL = "/snapshot/meta.json";

/** The captured copy of an endpoint, or null if that endpoint is not captured. */
export function snapshotUrl(path: string): string | null {
  const name = SNAPSHOT_FILES[path];
  return name ? `/snapshot/${name}.json` : null;
}

/**
 * Fetch JSON from a URL, treating every failure mode the same way: a thrown
 * Error whose message is safe to show a visitor. Callers turn that into a
 * degraded panel rather than a broken page.
 */
export async function getJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText || "error"}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      // nginx's own 404 page, or S3's XML when the static build is being served
      // and nothing is behind /api. Either way there is no endpoint here.
      throw new Error("endpoint not available");
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error("timed out");
    }
    throw error instanceof Error ? error : new Error("request failed");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Guess a highlighter grammar from a file path, for when the API omits it. */
export function languageFor(path: string): Language {
  if (path.endsWith(".tf") || path.endsWith(".hcl") || path.endsWith(".tfvars"))
    return "hcl";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".sh") || path.endsWith(".tpl")) return "bash";
  return "text";
}
