/** Compact duration: 4d 3h, 3h 12m, 12m 5s, 45s. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";

  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/** "12m ago" / "just now" from an ISO timestamp. */
export function formatRelative(iso: string | undefined): string {
  if (!iso) return "—";

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";

  const elapsed = Math.max(0, (Date.now() - then) / 1000);
  if (elapsed < 10) return "just now";
  return `${formatDuration(elapsed)} ago`;
}

/** Days until an ISO date, for certificate expiry. */
export function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  return Math.floor((then - Date.now()) / 86400000);
}

/**
 * Flux revisions arrive as `develop@sha1:637f31c...`. Keep the branch and the
 * first 7 characters of the hash, which is what you would compare by eye.
 */
export function shortRevision(revision: string | undefined): string {
  if (!revision) return "—";

  const [branch, hash] = revision.split("@");
  if (!hash) return revision.slice(0, 12);

  const bare = hash.includes(":") ? hash.slice(hash.indexOf(":") + 1) : hash;
  return `${branch}@${bare.slice(0, 7)}`;
}

/** Last path segment, for compact file labels. */
export function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}
