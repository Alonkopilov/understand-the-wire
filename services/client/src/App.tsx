import { useCallback, useMemo } from 'react'
import type { Aws, Cluster, Flux, Health, LiveContext, Trace } from './lib/types.ts'
import { NODES_BY_ID } from './data/topology.ts'
import { useQueryParam } from './lib/useQueryParam.ts'
import { useResource } from './lib/useResource.ts'
import { FluxZone } from './components/FluxZone.tsx'
import { Inspector } from './components/Inspector.tsx'
import { MapZone } from './components/MapZone.tsx'
import { ProblemsZone } from './components/ProblemsZone.tsx'
import { TraceZone } from './components/TraceZone.tsx'
import { StatusDot } from './components/ui.tsx'
import './App.css'

const REPO_URL = 'https://github.com/Alonkopilov/understand-the-wire'

function App() {
  const health = useResource<Health>('/health', 15000)
  const trace = useResource<Trace>('/trace')
  const cluster = useResource<Cluster>('/cluster', 15000)
  const flux = useResource<Flux>('/flux', 20000)
  const aws = useResource<Aws>('/aws', 60000)

  const live = useMemo<LiveContext>(
    () => ({ health: health.data, cluster: cluster.data, flux: flux.data, aws: aws.data }),
    [health.data, cluster.data, flux.data, aws.data],
  )

  const [selectedId, setSelectedId] = useQueryParam('node')
  const selected = selectedId ? (NODES_BY_ID.get(selectedId) ?? null) : null

  const select = useCallback(
    (id: string) => {
      setSelectedId(id)
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [setSelectedId],
  )

  const close = useCallback(() => setSelectedId(null), [setSelectedId])

  const connected = health.status === 'ready'

  return (
    <>
      <header className="masthead">
        <div className="masthead-top">
          <p className="wordmark">understand&#8203;-the&#8203;-wire</p>
          <nav className="nav">
            <a href="#trace">Trace</a>
            <a href="#map">Map</a>
            <a href="#gitops">GitOps</a>
            <a href="#problems">Problems</a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Source
            </a>
          </nav>
        </div>

        <h1>
          Scalable Infrastructure. Zero Clicks.
          <br />
          <b className='main-title'>Understand The Wire</b> here.
        </h1>

        <p className="standfirst">
          "Infrastructure as Code" in AWS declared entirely in Terraform: powering a K3S cluster running on EC2
          instances inside private subnets. The cluster is GitOps friendly with FluxCD, and written with scalability
          in mind to allow multiple environments.
        </p>

        <p className="colophon-statement">
          <b>Note:</b> The AWS architecture, Terraform, Kubernetes configurations and the Python backend service to power
          this website <b>were written completely on my own</b>, following best practices from my own personal experience,
          as well as my own research using LLMs, videos, articles.
          <br/><br/>
          The code for the <b>frontend service only</b>, was written using Claude Code (Opus 5)
        </p>

        <div className="status-strip">
          <span className="pill">
            <StatusDot status={connected ? 'ok' : 'unknown'} />
            {connected ? 'API connected' : 'API not reporting'}
          </span>
          {health.data ? (
            <span className="pill pill-muted mono">
              pod {health.data.pod} · {health.data.zone}
            </span>
          ) : null}
        </div>
      </header>

      <main>
        <TraceZone trace={trace} health={health} onSelect={select} />
        <MapZone live={live} selected={selectedId} onSelect={select} />
        <FluxZone flux={flux} cluster={cluster} />
        <ProblemsZone onSelect={select} />
      </main>

      <footer className="colophon">
        <p>
          All of it — infrastructure, manifests and this app — lives in{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            one repository
          </a>
          .
        </p>
        <p className="muted">
          eu-central-1 · k3s · Flux · external-secrets · IRSA via a self-hosted OIDC issuer
        </p>
      </footer>

      <Inspector node={selected} live={live} onClose={close} />
    </>
  )
}

export default App
