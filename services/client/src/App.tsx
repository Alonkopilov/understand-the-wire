import { useCallback, useMemo } from "react";
import type {
  Aws,
  Cluster,
  Flux,
  Health,
  LiveContext,
  Trace,
} from "./lib/types.ts";
import { NODES_BY_ID } from "./data/topology.ts";
import { useQueryParam } from "./lib/useQueryParam.ts";
import { useResource } from "./lib/useResource.ts";
import { FluxZone } from "./components/FluxZone.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { MapZone } from "./components/MapZone.tsx";
import { ProblemsZone } from "./components/ProblemsZone.tsx";
import { TraceZone } from "./components/TraceZone.tsx";
import { Hero } from "./components/Hero.tsx";
import "./App.css";

const REPO_URL = "https://github.com/Alonkopilov/understand-the-wire";

function App() {
  const health = useResource<Health>("/health", 15000);
  const trace = useResource<Trace>("/trace");
  const cluster = useResource<Cluster>("/cluster", 15000);
  const flux = useResource<Flux>("/flux", 20000);
  const aws = useResource<Aws>("/aws", 60000);

  const live = useMemo<LiveContext>(
    () => ({
      health: health.data,
      cluster: cluster.data,
      flux: flux.data,
      aws: aws.data,
    }),
    [health.data, cluster.data, flux.data, aws.data],
  );

  const [selectedId, setSelectedId] = useQueryParam("node");
  const selected = selectedId ? (NODES_BY_ID.get(selectedId) ?? null) : null;

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      document
        .getElementById("map")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setSelectedId],
  );

  const close = useCallback(() => setSelectedId(null), [setSelectedId]);

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
          <b className="main-title">Understand The Wire</b> here.
        </h1>

        <Hero
          trace={trace}
          health={health}
          cluster={cluster}
          flux={flux}
          aws={aws}
          onSelect={select}
        />

        <p className="standfirst">
          A fully self-hosted AWS + Kubernetes stack, built with best practices and scalability and multi-environment in mind.
          Every layer - VPC networking, a k3s cluster running on EC2 in private subnets, 
          GitOps delivery via FluxCD, and even a self-hosted IRSA for pod-level IAM identity - was built,
          broken, and connected together by hand. The goal wasn't just to get a website running,
          it was to know exactly why every piece works, and how the whole wire is connected.
        </p>
      </header>

      <main>
        <TraceZone trace={trace} health={health} onSelect={select} />
        <MapZone live={live} selected={selectedId} onSelect={select} />
        <FluxZone flux={flux} cluster={cluster} />
        <ProblemsZone onSelect={select} />
      </main>

      <footer className="colophon">
        <p className="colophon-statement">
          <b>Note:</b> The AWS architecture, Terraform, Kubernetes
          configurations and the Python backend service to power this website{" "}
          <b>were written completely on my own</b>, following best practices
          from my own personal experience, as well as my own research using
          LLMs, videos and articles.
          <br />
          <br />
          The code for the <b>frontend service</b> was written using
          Claude Code (Opus 5)
        </p>
        <p>
          All of it - infrastructure, manifests and this app - lives in{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            one repository
          </a>
          .
        </p>
        <p className="muted">
          eu-central-1 · k3s · Flux · external-secrets · IRSA via a self-hosted
          OIDC issuer
        </p>
      </footer>

      <Inspector node={selected} live={live} onClose={close} />
    </>
  );
}

export default App;
