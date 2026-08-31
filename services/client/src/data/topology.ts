import type { Fact, LiveContext, Status } from "../lib/types.ts";

export type LayerId = "edge" | "network" | "compute" | "cluster" | "identity";

export type Layer = {
  id: LayerId;
  label: string;
  caption: string;
};

export type SourceRef = {
  path: string;
  label: string;
};

export type MapNode = {
  id: string;
  label: string;
  sublabel?: string;
  layer: LayerId;
  /** Nodes sharing a row key sit side by side inside their band. */
  row?: number;
  /** One paragraph per entry, in your words. Empty renders as "not written yet". */
  why: string[];
  sources: SourceRef[];
  live?: (context: LiveContext) => Fact[];
  status?: (context: LiveContext) => Status;
};

export type MapEdge = {
  from: string;
  to: string;
  label?: string;
  /** Dashed edges are control-plane relationships, not request traffic. */
  dashed?: boolean;
};

export const LAYERS: Layer[] = [
  { id: "edge", label: "Edge", caption: "DNS and TLS, outside AWS" },
  {
    id: "network",
    label: "AWS network",
    caption: "VPC 10.50.0.0/16 · eu-central-1",
  },
  { id: "compute", label: "Compute", caption: "One EC2 node running k3s" },
  { id: "cluster", label: "Cluster", caption: "Reconciled from git by Flux" },
  { id: "identity", label: "Identity & secrets", caption: "IRSA without EKS" },
];

export const NODES: MapNode[] = [
  /* ------------------------------------------------------------------ edge */
  {
    id: "visitor",
    label: "Visitor",
    sublabel: "browser / curl",
    layer: "edge",
    row: 0,
    why: [
      "You guessed it, its you.",
      "The person visiting this website from the browser. You just finished typing 'www.understand-the-wire.com', and pressed Enter.",
    ],
    sources: [],
  },
  {
    id: "cloudflare",
    label: "Cloudflare DNS",
    sublabel: "zone understand-the-wire.com",
    layer: "edge",
    row: 0,
    why: [
      "The network knows to route packets with IPs, it has no idea how to route 'www.understand-the-wire.com'. The browser needs to send a DNS request to resolve the IP that serves the website, and someone has to hold this domain and give answers.",
      "I decided to use Cloudflare to host my domain, because it is well known and has a strong Terraform integration, allowing me to automatically create CNAME records to point at my Load Balancer and verify my TLS certificate to allow HTTPS (more on both of them later)",
      "*Important Note* - When reading the explanations I want you to remember the mindset: the project is ephemeral, the infra is fully managed in Terraform allowing me to apply the infrastructure in the morning, and destroy it when I am done working on it for the day. That means networking endpoints like Load Balancer endpoints, certificates and DNS records change between applies, and my Terraform configuration is designed to deal with that, to have fully working infrastructure without manual steps after applying.",
      "Having the infrastructure fully managed allows me to save significant amounts of money and manual work.",
    ],
    sources: [
      {
        path: "infrastructure/modules/cloudflare/main.tf",
        label: "cloudflare/main.tf",
      },
      { path: "infrastructure/envs/prod/main.tf", label: "envs/prod/main.tf" },
    ],
  },
  {
    id: "acm",
    label: "ACM certificate",
    sublabel: "*.understand-the-wire.com",
    layer: "edge",
    row: 0,
    why: [
      "Every modern secure website has to have encryption in transit (HTTPS). In order to have that, the browser needs to verify that I own the domain 'understand-the-wire.com', and it verifies it by looking at the certificate sent by AWS.",
      "Where does AWS get the certificate? - It is the one that holds it. The certificate for 'under...com' is created in AWS ACM, but it still means nothing on its own, because everyone can create a certificate for anything, if it is actually verified is a different thing.",
      "How did I verify the certificate? - AWS ACM gives me DNS validation records, that I have to set in Cloudflare where I host my domain. If they are set, it means that I actually control the domain and AWS signs this certificate.",
      "The browser sees that the certificate is signed by the AWS Root CA and it is one of the CAs it trusts, allowing me to have HTTPS.",
      "This whole process is completely mananged in my Terraform and happens automatically!",
    ],
    sources: [
      { path: "infrastructure/modules/acm/main.tf", label: "acm/main.tf" },
      { path: "infrastructure/envs/prod/main.tf", label: "envs/prod/main.tf" },
    ],
    live: ({ aws }) => {
      if (!aws?.certificate) return [];
      return [
        { label: "Domain", value: aws.certificate.domain, mono: true },
        { label: "Status", value: aws.certificate.status },
        { label: "Expires", value: aws.certificate.notAfter },
      ];
    },
  },

  /* --------------------------------------------------------------- network */
  {
    id: "vpc",
    label: "VPC",
    sublabel: "10.50.0.0/16",
    layer: "network",
    row: 0,
    why: [
      "This is the isolated private network inside AWS that hosts network resources, Subnets, Instances, ELBs and more live in it, and it allows a boundary of access.",
      "If you open an AWS account you get a default VPC, but to allow more control I created a custom one in Terraform with a defined IP range.",
    ],
    sources: [
      {
        path: "infrastructure/modules/network/vpc.tf",
        label: "network/vpc.tf",
      },
      {
        path: "infrastructure/modules/network/variables.tf",
        label: "network/variables.tf",
      },
    ],
    live: ({ aws }) => {
      if (!aws?.vpc) return [];
      return [
        { label: "VPC id", value: aws.vpc.id, mono: true },
        { label: "CIDR", value: aws.vpc.cidr, mono: true },
        { label: "Region", value: aws.region },
      ];
    },
  },
  {
    id: "public-subnets",
    label: "Public subnets",
    sublabel: "eu-central-1a · 1b",
    layer: "network",
    row: 1,
    why: [
      "Subnets are subdivisions of the VPC and allow to host resources with clear access boundaries.",
      "The Application Load Balancer I provision sits in public subnets, and makes for the only entity that can be reached by the internet. The subnet is associated with a route table that rules 0.0.0.0/0 -> Internet Gateway, which allows internet access and is what actually makes this subnet defined as 'public'.",
      "I have two public subnets spanning two availability zones to allow redundancy.",
    ],
    sources: [
      {
        path: "infrastructure/modules/network/subnets.tf",
        label: "network/subnets.tf",
      },
      {
        path: "infrastructure/modules/network/route-tables.tf",
        label: "network/route-tables.tf",
      },
    ],
    live: ({ aws }) => {
      if (!aws) return [];
      return aws.subnets
        .filter((subnet) => subnet.public)
        .map(
          (subnet): Fact => ({
            label: subnet.zone,
            value: `${subnet.cidr} · ${subnet.id}`,
            mono: true,
          }),
        );
    },
  },
  {
    id: "igw",
    label: "Internet Gateway",
    layer: "network",
    row: 1,
    why: [
      "Network entity that makes inbound and outbound access to the internet possible.",
      "Once I provision an Internet Gateway, I can have my route table associate it with my public subnets, allowing internet traffic to it. Without it nothing could reach my Load Balancer.",
    ],
    sources: [
      {
        path: "infrastructure/modules/network/internet-gateway.tf",
        label: "network/internet-gateway.tf",
      },
    ],
  },
  {
    id: "alb",
    label: "Application Load Balancer",
    sublabel: "utw-prod-alb · internet-facing",
    layer: "network",
    row: 2,
    why: [
      "The Load Balancer works in layer 7 of the network and allows to inspect and redirect incoming requests to whichever targets I choose, and literally load balance requests between them.",
      "Moreover, I automatically get a public DNS endpoint that I can point my domain to, I can do health checks and if I wanted to add another worker node I could easily do it.",
      "It comes at a cost though, approximately 16$ per month if running 24/7.",
      "*Important Note* - a big theme that I felt while making this project is finding the balance between using managed resources that cost more money, to self-manage resources that save money, but are traded off with more operational overhead.",
      "For example, using a managed EKS cluster against running your own cluster with K3S on EC2 instances. I decided to self-manage components that I wanted to learn their mechanics more deeply, or when the cost differentiator was just a lot better.",
    ],
    sources: [
      {
        path: "infrastructure/modules/load-balancer/main.tf",
        label: "load-balancer/main.tf",
      },
      {
        path: "infrastructure/modules/load-balancer/listeners.tf",
        label: "load-balancer/listeners.tf",
      },
    ],
    status: ({ aws }) => {
      if (!aws?.loadBalancer) return "unknown";
      const targets = aws.loadBalancer.targets;
      if (targets.length === 0) return "warn";
      return targets.every((target) => target.health === "healthy")
        ? "ok"
        : "warn";
    },
    live: ({ aws }) => {
      if (!aws?.loadBalancer) return [];
      return [
        { label: "DNS name", value: aws.loadBalancer.dnsName, mono: true },
        { label: "Scheme", value: aws.loadBalancer.scheme },
        ...aws.loadBalancer.targets.map(
          (target): Fact => ({
            label: `Target ${target.id}`,
            value: `${target.health} · ${target.zone}`,
            mono: true,
            status: target.health === "healthy" ? "ok" : "warn",
          }),
        ),
      ];
    },
  },
  {
    id: "alb-sg",
    label: "ALB security group",
    sublabel: "utw-prod-allow-tcp-to-alb",
    layer: "network",
    row: 2,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/load-balancer/security-groups.tf",
        label: "load-balancer/security-groups.tf",
      },
    ],
  },
  {
    id: "target-group",
    label: "Target group",
    sublabel: "utw-prod-tg · HTTP :80",
    layer: "network",
    row: 2,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/load-balancer/target-groups.tf",
        label: "load-balancer/target-groups.tf",
      },
      { path: "k8s/apps/health.yaml", label: "apps/health.yaml" },
    ],
  },
  {
    id: "nat",
    label: "NAT Gateway",
    sublabel: "+ Elastic IP",
    layer: "network",
    row: 3,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/network/nat.tf",
        label: "network/nat.tf",
      },
    ],
  },
  {
    id: "private-subnets",
    label: "Private subnets",
    sublabel: "eu-central-1a · 1b",
    layer: "network",
    row: 3,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/network/subnets.tf",
        label: "network/subnets.tf",
      },
    ],
    live: ({ aws }) => {
      if (!aws) return [];
      return aws.subnets
        .filter((subnet) => !subnet.public)
        .map(
          (subnet): Fact => ({
            label: subnet.zone,
            value: `${subnet.cidr} · ${subnet.id}`,
            mono: true,
          }),
        );
    },
  },
  {
    id: "endpoints",
    label: "VPC interface endpoints",
    sublabel: "ssm · ssmmessages · ec2messages",
    layer: "network",
    row: 4,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/network/endpoints.tf",
        label: "network/endpoints.tf",
      },
      {
        path: "infrastructure/modules/network/security-groups.tf",
        label: "network/security-groups.tf",
      },
    ],
  },
  {
    id: "node-sg",
    label: "Node security group",
    sublabel: "utw-prod-private-ec2-sg",
    layer: "network",
    row: 4,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/control-plane-node/security-groups.tf",
        label: "control-plane-node/security-groups.tf",
      },
    ],
  },

  /* --------------------------------------------------------------- compute */
  {
    id: "ec2",
    label: "EC2 control-plane node",
    sublabel: "m7i-flex.large · AL2023",
    layer: "compute",
    row: 0,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/control-plane-node/main.tf",
        label: "control-plane-node/main.tf",
      },
      {
        path: "infrastructure/modules/control-plane-node/iam.tf",
        label: "control-plane-node/iam.tf",
      },
    ],
    live: ({ cluster }) => {
      const node = cluster?.nodes[0];
      if (!node) return [];
      return [
        { label: "Node", value: node.name, mono: true },
        {
          label: "Ready",
          value: node.ready ? "true" : "false",
          status: node.ready ? "ok" : "error",
        },
        { label: "Kubelet", value: node.kubeletVersion, mono: true },
        ...(node.zone ? [{ label: "Zone", value: node.zone }] : []),
      ];
    },
    status: ({ cluster }) => {
      const node = cluster?.nodes[0];
      if (!node) return "unknown";
      return node.ready ? "ok" : "error";
    },
  },
  {
    id: "k3s",
    label: "k3s",
    sublabel: "single node · custom OIDC issuer",
    layer: "compute",
    row: 0,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/control-plane-node/init-control-plane.sh.tpl",
        label: "init-control-plane.sh.tpl",
      },
    ],
  },
  {
    id: "traefik",
    label: "Traefik",
    sublabel: "k3s default ingress controller",
    layer: "compute",
    row: 0,
    why: [],
    sources: [
      {
        path: "k8s/apps/frontend/ingress.yaml",
        label: "apps/frontend/ingress.yaml",
      },
    ],
  },

  /* --------------------------------------------------------------- cluster */
  {
    id: "github",
    label: "GitHub repository",
    sublabel: "branch develop · path ./k8s",
    layer: "cluster",
    row: 0,
    why: [],
    sources: [
      {
        path: "k8s/clusters/prod/flux-system/gotk-sync.yaml",
        label: "flux-system/gotk-sync.yaml",
      },
    ],
  },
  {
    id: "flux",
    label: "Flux",
    sublabel: "GitOps reconciliation",
    layer: "cluster",
    row: 0,
    why: [],
    sources: [
      {
        path: "k8s/clusters/prod/infrastructure-configs.yaml",
        label: "clusters/prod/infrastructure-configs.yaml",
      },
      { path: "k8s/clusters/prod/vars.yaml", label: "clusters/prod/vars.yaml" },
    ],
    status: ({ flux }) => {
      if (!flux || flux.resources.length === 0) return "unknown";
      return flux.resources.every((resource) => resource.ready)
        ? "ok"
        : "error";
    },
  },
  {
    id: "controllers",
    label: "Controllers",
    sublabel: "external-secrets · kube-prometheus-stack",
    layer: "cluster",
    row: 1,
    why: [],
    sources: [
      {
        path: "k8s/infrastructure/controllers/helm-external-secrets.yaml",
        label: "helm-external-secrets.yaml",
      },
      {
        path: "k8s/infrastructure/controllers/helm-prometheus-community.yaml",
        label: "helm-prometheus-community.yaml",
      },
    ],
  },
  {
    id: "configs",
    label: "Cluster configs",
    sublabel: "ClusterSecretStore · ExternalSecret",
    layer: "cluster",
    row: 1,
    why: [],
    sources: [
      {
        path: "k8s/infrastructure/configs/cluster-secret-store.yaml",
        label: "cluster-secret-store.yaml",
      },
      {
        path: "k8s/infrastructure/configs/external-secrets-grafana.yaml",
        label: "external-secrets-grafana.yaml",
      },
    ],
  },
  {
    id: "apps",
    label: "Applications",
    sublabel: "this frontend · the API behind it",
    layer: "cluster",
    row: 1,
    why: [],
    sources: [
      {
        path: "k8s/apps/frontend/deployment.yaml",
        label: "apps/frontend/deployment.yaml",
      },
      { path: "k8s/apps/kustomization.yaml", label: "apps/kustomization.yaml" },
    ],
    live: ({ cluster }) => {
      if (!cluster) return [];
      return cluster.workloads.map(
        (workload): Fact => ({
          label: `${workload.namespace}/${workload.name}`,
          value: `${workload.ready}/${workload.desired} ready`,
          status: workload.ready === workload.desired ? "ok" : "warn",
        }),
      );
    },
  },

  /* -------------------------------------------------------------- identity */
  {
    id: "oidc-bucket",
    label: "OIDC discovery bucket",
    sublabel: "public S3 · JWKS + discovery doc",
    layer: "identity",
    row: 0,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/oidc-bucket/main.tf",
        label: "oidc-bucket/main.tf",
      },
      {
        path: "infrastructure/modules/control-plane-node/init-control-plane.sh.tpl",
        label: "init-control-plane.sh.tpl",
      },
    ],
  },
  {
    id: "oidc-provider",
    label: "IAM OIDC provider",
    sublabel: "trusts the cluster issuer",
    layer: "identity",
    row: 0,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/oidc-bucket/main.tf",
        label: "oidc-bucket/main.tf",
      },
      {
        path: "infrastructure/modules/service-account/main.tf",
        label: "service-account/main.tf",
      },
    ],
  },
  {
    id: "irsa",
    label: "IRSA roles",
    sublabel: "one role per service account",
    layer: "identity",
    row: 1,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/service-account/main.tf",
        label: "service-account/main.tf",
      },
      { path: "infrastructure/envs/prod/main.tf", label: "envs/prod/main.tf" },
    ],
  },
  {
    id: "ssm-params",
    label: "Parameter Store",
    sublabel: "/utw/prod/*",
    layer: "identity",
    row: 1,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/parameter-store/main.tf",
        label: "parameter-store/main.tf",
      },
      { path: "infrastructure/envs/prod/main.tf", label: "envs/prod/main.tf" },
    ],
  },
  {
    id: "instance-role",
    label: "Instance role",
    sublabel: "SSM + scoped reads",
    layer: "identity",
    row: 1,
    why: [],
    sources: [
      {
        path: "infrastructure/modules/control-plane-node/iam.tf",
        label: "control-plane-node/iam.tf",
      },
    ],
  },
];

export const EDGES: MapEdge[] = [
  { from: "visitor", to: "cloudflare", label: "DNS" },
  { from: "cloudflare", to: "alb", label: "CNAME" },
  { from: "acm", to: "alb", label: "TLS", dashed: true },
  { from: "alb", to: "target-group" },
  { from: "target-group", to: "ec2", label: ":80" },
  { from: "igw", to: "alb", dashed: true },
  { from: "nat", to: "private-subnets", dashed: true },
  { from: "endpoints", to: "ec2", label: "SSM", dashed: true },
  { from: "ec2", to: "k3s" },
  { from: "k3s", to: "traefik" },
  { from: "traefik", to: "apps", label: "Host header" },
  { from: "github", to: "flux", label: "pull", dashed: true },
  { from: "flux", to: "controllers", dashed: true },
  { from: "flux", to: "configs", dashed: true },
  { from: "flux", to: "apps", dashed: true },
  { from: "k3s", to: "oidc-bucket", label: "JWKS", dashed: true },
  { from: "oidc-bucket", to: "oidc-provider", dashed: true },
  { from: "oidc-provider", to: "irsa", dashed: true },
  { from: "irsa", to: "ssm-params", label: "AssumeRole", dashed: true },
  { from: "configs", to: "ssm-params", label: "reads", dashed: true },
];

export const NODES_BY_ID = new Map(NODES.map((node) => [node.id, node]));
