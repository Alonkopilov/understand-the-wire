import type { Aws, Cluster, Flux, Health, Trace } from "../lib/types.ts";
import type { Resource } from "../lib/useResource.ts";
import { daysUntil, formatDuration, shortRevision } from "../lib/format.ts";
import { StatusDot } from "./ui.tsx";

/** Short labels for the wire. Keyed by the hop ids the API returns. */
const SHORT_LABELS: Record<string, string> = {
  dns: "DNS",
  alb: "ALB",
  tg: "Target",
  node: "Node",
  traefik: "Traefik",
  pod: "Pod",
};

const FALLBACK_HOPS = ["DNS", "ALB", "Target", "Node", "Traefik", "Pod"];

type Stat = {
  label: string;
  value: string;
  status?: "ok" | "warn" | "error" | "unknown";
};

function buildStats(
  health: Health | null,
  cluster: Cluster | null,
  flux: Flux | null,
  aws: Aws | null,
): Stat[] {
  const stats: Stat[] = [];

  if (cluster) {
    const ready = cluster.workloads.reduce((total, w) => total + w.ready, 0);
    const desired = cluster.workloads.reduce(
      (total, w) => total + w.desired,
      0,
    );
    stats.push({
      label: "pods ready",
      value: `${ready}/${desired}`,
      status: ready === desired ? "ok" : "warn",
    });
  }

  if (flux?.repository?.revision) {
    const allReady = flux.resources.every((r) => r.ready);
    stats.push({
      label: "reconciled at",
      value: shortRevision(flux.repository.revision),
      status: allReady ? "ok" : "error",
    });
  }

  if (health) {
    stats.push({
      label: "process up",
      value: formatDuration(health.uptimeSeconds),
    });
  }

  const expiry = daysUntil(aws?.certificate?.notAfter);
  if (expiry !== null) {
    stats.push({
      label: "cert valid",
      value: `${expiry}d`,
      status: expiry > 30 ? "ok" : "warn",
    });
  }

  return stats;
}

/**
 * The first thing a visitor sees: the path their own request just took, and the
 * pod that answered it. Everything here is read back from the running cluster,
 * so with the API down it degrades to the shape of the path and nothing more.
 */
export function Hero({
  trace,
  health,
  cluster,
  flux,
  aws,
  onSelect,
}: {
  trace: Resource<Trace>;
  health: Resource<Health>;
  cluster: Resource<Cluster>;
  flux: Resource<Flux>;
  aws: Resource<Aws>;
  onSelect: (nodeId: string) => void;
}) {
  const hops = trace.data?.hops;
  const labels = hops
    ? hops.map((h) => SHORT_LABELS[h.id] ?? h.title)
    : FALLBACK_HOPS;
  const live = health.status === "ready" && health.data !== null;
  const stats = buildStats(health.data, cluster.data, flux.data, aws.data);

  return (
    <div className={live ? "hero hero-live" : "hero"}>
      <div
        className="wire"
        role="img"
        aria-label={`Request path: ${labels.join(" to ")}`}
      >
        <div className="wire-track">
          <span className="wire-line" />
          {live ? <span className="wire-pulse" /> : null}
          {labels.map((label, index) => (
            <span
              className="wire-stop"
              key={label + index}
              style={{ left: `${(index / (labels.length - 1)) * 100}%` }}
            >
              <span className="wire-dot" />
              <span className="wire-label">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="hero-readout">
        {live && health.data ? (
          <>
            <p className="hero-kicker">This page was served to you by</p>
            <button
              type="button"
              className="hero-pod"
              onClick={() => onSelect("apps")}
              title="Show this pod on the map"
            >
              {health.data.pod}
            </button>
            <p className="hero-meta mono">
              {health.data.node} · {health.data.zone} · {labels.length} hops
              from your browser
            </p>
          </>
        ) : (
          <>
            <p className="hero-kicker">
              <StatusDot status="unknown" /> The API is not reporting
            </p>
            <p className="hero-meta">
              The path above is real; the values that fill it come from the
              cluster itself.
            </p>
          </>
        )}
      </div>

      {stats.length > 0 ? (
        <dl className="hero-stats">
          {stats.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd className="mono">
                {stat.status ? <StatusDot status={stat.status} /> : null}
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
