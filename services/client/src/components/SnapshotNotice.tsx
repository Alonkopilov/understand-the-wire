import { useEffect, useState } from "react";
import type { SnapshotMeta } from "../lib/types.ts";
import type { Source } from "../lib/useResource.ts";
import { SNAPSHOT_META_URL, getJson } from "../lib/api.ts";

function formatCapturedAt(iso: string): string | null {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;

  return when.toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Mounted only once something has actually fallen back, so the meta file is
 * never requested on the live site.
 */
function SnapshotBanner() {
  const [capturedAt, setCapturedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getJson<SnapshotMeta>(SNAPSHOT_META_URL, controller.signal)
      .then((meta) => setCapturedAt(formatCapturedAt(meta.capturedAt)))
      .catch(() => {
        // The banner is worth showing with or without a timestamp.
      });

    return () => controller.abort();
  }, []);

  return (
    <aside className="snapshot-notice" role="status">
      <span className="dot dot-warn" aria-hidden="true" />
      <p>
        <b>You are viewing a static snapshot.</b> The infrastructure behind this
        page is destroyed every night and rebuilt every morning, so right now
        there is no cluster to ask. Everything below was captured
        {capturedAt ? ` on ${capturedAt}` : " before the last teardown"} and is
        frozen at that moment — come back during the day and it will be live.
      </p>
    </aside>
  );
}

/** Renders nothing while any of the panels are still being served live. */
export function SnapshotNotice({ sources }: { sources: { source: Source }[] }) {
  const snapshotted = sources.some((entry) => entry.source === "snapshot");
  return snapshotted ? <SnapshotBanner /> : null;
}
