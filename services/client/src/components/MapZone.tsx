import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { LiveContext, Status } from '../lib/types.ts'
import type { MapNode } from '../data/topology.ts'
import { EDGES, LAYERS, NODES } from '../data/topology.ts'
import { SectionHeading, StatusDot } from './ui.tsx'

type EdgePath = { key: string; d: string; dashed: boolean }

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
  }
  const t = {
    left: to.left - origin.left,
    right: to.right - origin.left,
    top: to.top - origin.top,
    bottom: to.bottom - origin.top,
  }

  const fx = (f.left + f.right) / 2
  const fy = (f.top + f.bottom) / 2
  const tx = (t.left + t.right) / 2
  const ty = (t.top + t.bottom) / 2

  if (t.top >= f.bottom - 4) {
    const bend = Math.max(18, (t.top - f.bottom) / 2)
    return `M ${fx} ${f.bottom} C ${fx} ${f.bottom + bend}, ${tx} ${t.top - bend}, ${tx} ${t.top}`
  }
  if (t.bottom <= f.top + 4) {
    const bend = Math.max(18, (f.top - t.bottom) / 2)
    return `M ${fx} ${f.top} C ${fx} ${f.top - bend}, ${tx} ${t.bottom + bend}, ${tx} ${t.bottom}`
  }
  if (t.left >= f.right - 4) {
    const bend = Math.max(18, (t.left - f.right) / 2)
    return `M ${f.right} ${fy} C ${f.right + bend} ${fy}, ${t.left - bend} ${ty}, ${t.left} ${ty}`
  }

  const bend = Math.max(18, (f.left - t.right) / 2)
  return `M ${f.left} ${fy} C ${f.left - bend} ${fy}, ${t.right + bend} ${ty}, ${t.right} ${ty}`
}

function MapNodeCard({
  node,
  status,
  selected,
  onSelect,
  registerRef,
}: {
  node: MapNode
  status: Status
  selected: boolean
  onSelect: (id: string) => void
  registerRef: (id: string, element: HTMLElement | null) => void
}) {
  return (
    <button
      type="button"
      ref={(element) => registerRef(node.id, element)}
      className={selected ? 'map-node map-node-selected' : 'map-node'}
      onClick={() => onSelect(node.id)}
      aria-pressed={selected}
    >
      <span className="map-node-head">
        <StatusDot status={status} />
        <span className="map-node-label">{node.label}</span>
      </span>
      {node.sublabel ? <span className="map-node-sub">{node.sublabel}</span> : null}
    </button>
  )
}

export function MapZone({
  live,
  selected,
  onSelect,
}: {
  live: LiveContext
  selected: string | null
  onSelect: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef(new Map<string, HTMLElement>())
  const [paths, setPaths] = useState<EdgePath[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })

  const registerRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodeRefs.current.set(id, element)
    else nodeRefs.current.delete(id)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const compute = () => {
      const origin = container.getBoundingClientRect()
      setSize({ width: origin.width, height: origin.height })

      const next: EdgePath[] = []
      for (const edge of EDGES) {
        const from = nodeRefs.current.get(edge.from)
        const to = nodeRefs.current.get(edge.to)
        if (!from || !to) continue

        next.push({
          key: `${edge.from}->${edge.to}`,
          d: connect(from.getBoundingClientRect(), to.getBoundingClientRect(), origin),
          dashed: edge.dashed === true,
        })
      }
      setPaths(next)
    }

    compute()

    const observer = new ResizeObserver(compute)
    observer.observe(container)
    window.addEventListener('resize', compute)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [selected])

  return (
    <section className="zone" id="map">
      <SectionHeading
        eyebrow="02 — The map"
        title="Everything Terraform builds"
        lede="Solid lines carry requests. Dashed lines are control-plane relationships — trust, reconciliation, secret reads. Select any box to see why it exists and the code that creates it."
      />

      <div className="map" ref={containerRef}>
        <svg
          className="map-edges"
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" />
            </marker>
          </defs>
          {paths.map((path) => (
            <path
              key={path.key}
              d={path.d}
              className={path.dashed ? 'map-edge map-edge-dashed' : 'map-edge'}
              markerEnd="url(#arrow)"
            />
          ))}
        </svg>

        {LAYERS.map((layer) => {
          const nodes = NODES.filter((node) => node.layer === layer.id)
          const rows = [...new Set(nodes.map((node) => node.row ?? 0))].sort((a, b) => a - b)

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
                          status={node.status ? node.status(live) : 'unknown'}
                          selected={selected === node.id}
                          onSelect={onSelect}
                          registerRef={registerRef}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
