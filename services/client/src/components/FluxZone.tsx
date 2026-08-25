import type { Cluster, Flux } from '../lib/types.ts'
import type { Resource } from '../lib/useResource.ts'
import { formatRelative, shortRevision } from '../lib/format.ts'
import { Panel, SectionHeading, Skeleton, StatusDot, Unavailable } from './ui.tsx'

function WorkloadRow({ name, ready, desired }: { name: string; ready: number; desired: number }) {
  return (
    <div className="workload">
      <StatusDot status={ready === desired && desired > 0 ? 'ok' : 'warn'} />
      <span className="mono workload-name">{name}</span>
      <span className="muted">
        {ready}/{desired}
      </span>
    </div>
  )
}

export function FluxZone({ flux, cluster }: { flux: Resource<Flux>; cluster: Resource<Cluster> }) {
  return (
    <section className="zone" id="gitops">
      <SectionHeading
        eyebrow="03 — Reconciliation"
        title="What the cluster thinks it should be"
        lede="Nothing here was applied by hand. Flux pulls the repository and converges the cluster on it — push a commit and this revision changes within a minute."
      />

      <div className="split">
        <Panel>
          <h3 className="panel-title">Flux resources</h3>

          {flux.status === 'loading' ? <Skeleton rows={4} /> : null}

          {flux.status === 'unavailable' ? (
            <Unavailable what="Flux" detail={flux.error} />
          ) : null}

          {flux.data ? (
            <>
              {flux.data.repository ? (
                <p className="repo-line">
                  <span className="mono">{flux.data.repository.branch}</span>
                  <span className="muted"> · </span>
                  <span className="mono">{shortRevision(flux.data.repository.revision)}</span>
                </p>
              ) : null}

              <table className="table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Revision</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {flux.data.resources.map((resource) => (
                    <tr key={`${resource.kind}/${resource.namespace}/${resource.name}`}>
                      <td>
                        <StatusDot
                          status={resource.suspended ? 'warn' : resource.ready ? 'ok' : 'error'}
                          title={resource.message}
                        />
                        <span className="mono">{resource.name}</span>
                        <span className="muted kind"> {resource.kind}</span>
                      </td>
                      <td className="mono">{shortRevision(resource.revision)}</td>
                      <td className="muted">{formatRelative(resource.lastApplied)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </Panel>

        <Panel>
          <h3 className="panel-title">Workloads</h3>

          {cluster.status === 'loading' ? <Skeleton rows={4} /> : null}

          {cluster.status === 'unavailable' ? (
            <Unavailable what="The Kubernetes API" detail={cluster.error} />
          ) : null}

          {cluster.data ? (
            <>
              <div className="workloads">
                {cluster.data.workloads.map((workload) => (
                  <WorkloadRow
                    key={`${workload.namespace}/${workload.name}`}
                    name={`${workload.namespace}/${workload.name}`}
                    ready={workload.ready}
                    desired={workload.desired}
                  />
                ))}
              </div>

              {cluster.data.nodes.map((node) => (
                <p className="node-line" key={node.name}>
                  <StatusDot status={node.ready ? 'ok' : 'error'} />
                  <span className="mono">{node.name}</span>
                  <span className="muted"> · {node.kubeletVersion}</span>
                  {node.instanceType ? <span className="muted"> · {node.instanceType}</span> : null}
                </p>
              ))}
            </>
          ) : null}
        </Panel>
      </div>
    </section>
  )
}
