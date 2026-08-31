import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LiveContext, Status } from "../lib/types.ts";
import type { MapNode } from "../data/topology.ts";
import { EDGES, LAYERS, NODES } from "../data/topology.ts";
import { SectionHeading, StatusDot } from "./ui.tsx";

type EdgePath = {
  key: string;
  d: string;
  from: string;
  to: string;
  dashed: boolean;
};

/**
 * Pick the pair of box edges facing each other, so a connector leaves the
 * bottom of one card and arrives at the top of the next rather than cutting
 * diagonally through both.
 */
function connect(from: DOMRect, to: DOMRect, origin: DOMRect): string {
  const f = {
    left: from.left - origin.left,
    right: from.right - origin.left,
    top: from.top - origin.top,
    bottom: from.bottom - origin.top,
  };
  const t = {
    left: to.left - origin.left,
    right: to.right - origin.left,
    top: to.top - origin.top,
    bottom: to.bottom - origin.top,
  };

  const fx = (f.left + f.right) / 2;
  const fy = (f.top + f.bottom) / 2;
  const tx = (t.left + t.right) / 2;
  const ty = (t.top + t.bottom) / 2;

  if (t.top >= f.bottom - 4) {
    const bend = Math.max(18, (t.top - f.bottom) / 2);
    return `M ${fx} ${f.bottom} C ${fx} ${f.bottom + bend}, ${tx} ${t.top - bend}, ${tx} ${t.top}`;
  }
  if (t.bottom <= f.top + 4) {
    const bend = Math.max(18, (f.top - t.bottom) / 2);
    return `M ${fx} ${f.top} C ${fx} ${f.top - bend}, ${tx} ${t.bottom + bend}, ${tx} ${t.bottom}`;
  }
  if (t.left >= f.right - 4) {
    const bend = Math.max(18, (t.left - f.right) / 2);
    return `M ${f.right} ${fy} C ${f.right + bend} ${fy}, ${t.left - bend} ${ty}, ${t.left} ${ty}`;
  }

  const bend = Math.max(18, (f.left - t.right) / 2);
  return `M ${f.left} ${fy} C ${f.left - bend} ${fy}, ${t.right + bend} ${ty}, ${t.right} ${ty}`;
}

function MapNodeCard({
  node,
  status,
  selected,
  linked,
  dimmed,
  onSelect,
  onHover,
  registerRef,
}: {
  node: MapNode;
  status: Status;
  selected: boolean;
  linked: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  registerRef: (id: string, element: HTMLElement | null) => void;
}) {
  const classes = ["map-node"];
  if (selected) classes.push("map-node-selected");
  if (linked) classes.push("map-node-linked");
  if (dimmed) classes.push("map-node-dimmed");

  return (
    <button
      type="button"
      ref={(element) => registerRef(node.id, element)}
      className={classes.join(" ")}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      aria-pressed={selected}
    >
      <span className="map-node-head">
        <StatusDot status={status} />
        <span className="map-node-label">{node.label}</span>
      </span>
      {node.sublabel ? (
        <span className="map-node-sub">{node.sublabel}</span>
      ) : null}
    </button>
  );
}

export function MapZone({
  live,
  selected,
  onSelect,
}: {
  live: LiveContext;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [paths, setPaths] = useState<EdgePath[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  // Hovering wins over selection, so you can trace a second box without
  // losing the one open in the inspector.
  const focus = hovered ?? selected;

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const edge of EDGES) {
      if (edge.from === focus) set.add(edge.to);
      if (edge.to === focus) set.add(edge.from);
    }
    return set;
  }, [focus]);

  const registerRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodeRefs.current.set(id, element);
    else nodeRefs.current.delete(id);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const origin = container.getBoundingClientRect();
      setSize({ width: origin.width, height: origin.height });

      const next: EdgePath[] = [];
      for (const edge of EDGES) {
        const from = nodeRefs.current.get(edge.from);
        const to = nodeRefs.current.get(edge.to);
        if (!from || !to) continue;

        next.push({
          key: `${edge.from}->${edge.to}`,
          d: connect(
            from.getBoundingClientRect(),
            to.getBoundingClientRect(),
            origin,
          ),
          from: edge.from,
          to: edge.to,
          dashed: edge.dashed === true,
        });
      }
      setPaths(next);
    };

    compute();

    const observer = new ResizeObserver(compute);
    observer.observe(container);
    window.addEventListener("resize", compute);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [selected]);

  return (
    <section className="zone" id="map">
      <SectionHeading
        eyebrow="02 — The map"
        title="Everything Terraform builds"
        lede="Solid lines carry requests. Dashed lines are control-plane relationships — trust, reconciliation, secret reads. Hover any box to isolate what it connects to; select it to see why it exists and the code that creates it."
      />

      <div
        className={focus ? "map map-focused" : "map"}
        ref={containerRef}
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          className="map-edges"
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path className="arrow-head" d="M 0 1.5 L 9 5 L 0 8.5 z" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="11"
              markerHeight="11"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path className="arrow-head-active" d="M 0 1.5 L 9 5 L 0 8.5 z" />
            </marker>
          </defs>

          {paths.map((path) => {
            const active =
              focus !== null && (path.from === focus || path.to === focus);
            const classes = ["map-edge"];
            if (path.dashed) classes.push("map-edge-dashed");
            if (active) classes.push("map-edge-active");
            else if (focus !== null) classes.push("map-edge-muted");

            return (
              <path
                key={path.key}
                d={path.d}
                className={classes.join(" ")}
                markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
              />
            );
          })}
        </svg>

        {LAYERS.map((layer) => {
          const nodes = NODES.filter((node) => node.layer === layer.id);
          const rows = [...new Set(nodes.map((node) => node.row ?? 0))].sort(
            (a, b) => a - b,
          );

          return (
            <div className="band" key={layer.id}>
              <div className="band-label">
                <span className="band-name">{layer.label}</span>
                <span className="band-caption">{layer.caption}</span>
              </div>
              <div className="band-rows">
                {rows.map((row) => (
                  <div className="band-row" key={row}>
                    {nodes
                      .filter((node) => (node.row ?? 0) === row)
                      .map((node) => (
                        <MapNodeCard
                          key={node.id}
                          node={node}
                          status={node.status ? node.status(live) : "unknown"}
                          selected={selected === node.id}
                          linked={
                            neighbours !== null &&
                            neighbours.has(node.id) &&
                            node.id !== focus
                          }
                          dimmed={
                            neighbours !== null && !neighbours.has(node.id)
                          }
                          onSelect={onSelect}
                          onHover={setHovered}
                          registerRef={registerRef}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
