import type { Health, Trace, TraceHop } from "../lib/types.ts";
import type { Resource } from "../lib/useResource.ts";
import {
  FactList,
  Panel,
  SectionHeading,
  StatusDot,
  Unavailable,
} from "./ui.tsx";
import { formatDuration } from "../lib/format.ts";

/**
 * Shown when /api/trace is not answering. The shape of the path is knowable
 * from the configuration alone — only the live values need the backend.
 */
const STATIC_HOPS: TraceHop[] = [
  {
    id: "dns",
    title: "Cloudflare DNS",
    subtitle: "CNAME, not proxied",
    nodeId: "cloudflare",
    facts: [],
  },
  {
    id: "alb",
    title: "Application Load Balancer",
    subtitle: ":443 · TLS terminated here",
    nodeId: "alb",
    facts: [],
  },
  {
    id: "tg",
    title: "Target group",
    subtitle: "HTTP :80 · health check /health",
    nodeId: "target-group",
    facts: [],
  },
  {
    id: "node",
    title: "EC2 node",
    subtitle: "private subnet · no public address",
    nodeId: "ec2",
    facts: [],
  },
  {
    id: "traefik",
    title: "Traefik",
    subtitle: "routes by Host header",
    nodeId: "traefik",
    facts: [],
  },
  {
    id: "pod",
    title: "Pod",
    subtitle: "the process that answered you",
    nodeId: "apps",
    facts: [],
  },
];

export function TraceZone({
  trace,
  health,
  onSelect,
}: {
  trace: Resource<Trace>;
  health: Resource<Health>;
  onSelect: (nodeId: string) => void;
}) {
  const live = trace.data !== null;
  const hops = trace.data?.hops ?? STATIC_HOPS;

  return (
    <section className="zone" id="trace">
      <SectionHeading
        eyebrow="01 — The trace"
        title="How this page reached you"
        lede="Every hop your request actually took, from the name lookup to the process that rendered the bytes you are reading."
        actions={
          <span className={live ? "pill" : "pill pill-muted"}>
            <StatusDot status={live ? "ok" : "unknown"} />
            {live
              ? "live"
              : trace.status === "loading"
                ? "checking…"
                : "shape only"}
          </span>
        }
      />

      <ol className="trace">
        {hops.map((hop, index) => (
          <li className="trace-hop" key={hop.id}>
            <div className="trace-rail" aria-hidden="true">
              <span className="trace-index">{index + 1}</span>
            </div>
            <Panel className="trace-card">
              <div className="trace-card-head">
                <div>
                  <h3>
                    {hop.title}
                    {hop.status ? <StatusDot status={hop.status} /> : null}
                  </h3>
                  <p className="trace-subtitle">{hop.subtitle}</p>
                </div>
                {hop.nodeId ? (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelect(hop.nodeId as string)}
                  >
                    inspect
                  </button>
                ) : null}
              </div>
              <FactList facts={hop.facts} />
            </Panel>
          </li>
        ))}

        <li className="trace-hop trace-terminal">
          <div className="trace-rail" aria-hidden="true">
            <span className="trace-index">•</span>
          </div>
          <Panel className="trace-card trace-you">
            <h3>You are here</h3>
            {health.status === "ready" && health.data ? (
              <FactList
                facts={[
                  {
                    label: "Served by pod",
                    value: health.data.pod,
                    mono: true,
                  },
                  { label: "On node", value: health.data.node, mono: true },
                  { label: "Zone", value: health.data.zone },
                  {
                    label: "Process uptime",
                    value: formatDuration(health.data.uptimeSeconds),
                  },
                ]}
              />
            ) : (
              <Unavailable what="The API" detail={health.error} />
            )}
          </Panel>
        </li>
      </ol>
    </section>
  );
}
