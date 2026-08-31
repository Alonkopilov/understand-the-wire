/**
 * The contract between this client and the Python API.
 *
 * Every endpoint is optional at runtime: if it is missing, slow, or broken the
 * matching panel degrades to an "unavailable" state and the rest of the page
 * keeps working. That lets the frontend ship before the backend exists.
 */

export type Status = "ok" | "warn" | "error" | "unknown";

/** A single label/value pair rendered in an inspector or hop card. */
export type Fact = {
  label: string;
  value: string;
  /** Render the value in a monospace face — ids, ARNs, CIDRs, SHAs. */
  mono?: boolean;
  status?: Status;
};

/* -------------------------------------------------------------- /api/health */

export type Health = {
  status: string;
  version: string;
  /** Name of the pod that answered — `metadata.name` via the downward API. */
  pod: string;
  /** Node the pod is scheduled on — `spec.nodeName`. */
  node: string;
  /** Availability zone of that node. */
  zone: string;
  uptimeSeconds: number;
};

/* --------------------------------------------------------------- /api/trace */

export type TraceHop = {
  id: string;
  /** Short title, e.g. "Application Load Balancer". */
  title: string;
  /** One line of context, e.g. "TLS terminated · ACM certificate". */
  subtitle: string;
  /** Optional id in the topology graph, so the hop can open the inspector. */
  nodeId?: string;
  status?: Status;
  facts: Fact[];
};

export type Trace = {
  /** Ordered browser → pod. */
  hops: TraceHop[];
  /** ISO timestamp the backend handled this request. */
  servedAt: string;
};

/* ------------------------------------------------------------- /api/cluster */

export type PodInfo = {
  name: string;
  phase: string;
  ready: boolean;
  restarts: number;
  node: string;
  ageSeconds: number;
};

export type Workload = {
  name: string;
  namespace: string;
  kind: string;
  ready: number;
  desired: number;
  pods: PodInfo[];
};

export type ClusterNode = {
  name: string;
  ready: boolean;
  kubeletVersion: string;
  instanceType?: string;
  zone?: string;
  cpuPercent?: number;
  memoryPercent?: number;
};

export type Cluster = {
  nodes: ClusterNode[];
  workloads: Workload[];
};

/* ---------------------------------------------------------------- /api/flux */

export type FluxResource = {
  name: string;
  namespace: string;
  kind: "Kustomization" | "HelmRelease";
  ready: boolean;
  suspended?: boolean;
  /** e.g. "develop@sha1:637f31c..." or a bare SHA. */
  revision?: string;
  /** ISO timestamp of the last successful apply. */
  lastApplied?: string;
  message?: string;
  /** Repo path this Kustomization reconciles. */
  path?: string;
};

export type Flux = {
  resources: FluxResource[];
  repository?: {
    url: string; // GitRepository.spec.url
    branch: string; // GitRepository.spec.ref.branch
    revision?: string; // GitRepository.status.artifact.revision
  };
};

/* ----------------------------------------------------------------- /api/aws */

export type AwsTarget = {
  id: string;
  health: string;
  zone: string;
  port: number;
};

export type Aws = {
  region: string;
  accountId: string;
  vpc: { id: string; cidr: string };
  subnets: { id: string; cidr: string; zone: string; public: boolean }[];
  loadBalancer: {
    name: string;
    dnsName: string;
    scheme: string;
    targets: AwsTarget[];
  } | null;
  certificate: {
    domain: string;
    status: string;
    notAfter: string;
  } | null;
};

/* -------------------------------------------------------------- /api/source */

export type Language = "hcl" | "yaml" | "bash" | "text";

export type SourceFile = {
  path: string;
  language: Language;
  content: string;
  /** Permalink back to GitHub for "open the real thing". */
  url: string;
  sha?: string;
};

/** Everything the inspector's Live tab can select from. */
export type LiveContext = {
  health: Health | null;
  cluster: Cluster | null;
  flux: Flux | null;
  aws: Aws | null;
};
