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
      "You guessed it, it's you.",
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
      "This whole process is completely managed in my Terraform and happens automatically!",
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
    why: [
      "Dictates what inbound/outbound traffic is allowed for an AWS resource.",
      "In the case of the ALB, I wanted it to be accessed from the internet using HTTP and HTTPS only. I created a security group to allow only inbound and outbound with port 80 and port 443.",
    ],
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
    why: [
      "The target group dictates where should the Load Balancer forward requests to.",
      "I set the Load Balancer to target traffic to the EC2 nodes, they host the services that serve the data you see here.",
    ],
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
    why: [
      "The NAT is an important component that allows private instances to have outbound access to the internet using IP translation. We need it here because even though our worker nodes are isolated and secured, they still need to access the internet to install packages and send requests to external services.",
      "Without having a NAT, you can't install k3s, python/node libraries and more, because my nodes sit in private subnets with no access to the internet.",
      "*Important Note* - Again, this is another notable instance where I had to balance cost vs operational overhead. I technically could've hosted an EC2 that acted as a NAT instance, but the cost of a managed AWS NAT was manageable for me personally (the infrastructure does not run 24/7), so that I wouldn't need to deal with the operational overhead, which wasn't in the learning scope of this project for me anyway.",
    ],
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
    why: [
      "Subnets are subdivisions of the VPC and allow to host resources with clear access boundaries.",
      "The control plane and worker nodes I provision sit in private subnets, they are unreachable from the public internet and can only be accessed by resources inside the VPC. This allows my instances to be safely isolated and secured.",
      "I have two private subnets spanning two availability zones to allow redundancy.",
    ],
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
    why: [
      "Allows EC2 instances with no internet egress to access the SSM API endpoints with traffic flowing completely in the AWS network.",
      "Background: I wanted to find the most secure way to connect to my nodes for testing and debugging purposes. The most common way is to open port 22 to the internet, allowing me to connect to them from my laptop using SSH. The tradeoff is that it makes the instances not entirely isolated anymore. Another way is to use the 'AWS SSM Session Manager', which allows secure traffic between me and the instance using AWS SSM as a middle man.",
      "Basically, in ec2 instances with the Amazon Linux AMI 2023, a 'SSM Agent' is installed by default, and it is the software that allows the instance to send and receive traffic to/from SSM.",
      "*Important Note* - As of writing this, the VPC endpoints are NOT USED anymore to manage costs. Since I already have a NAT Gateway provisioned for other outbound traffic, the added security of routing SSM traffic through VPC endpoints wasn't worth the extra ~$40-60/month for my use case, but it's still important to understand what's their purpose and why I used them.",
    ],
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
    why: [
      "Dictates what inbound/outbound traffic is allowed for an AWS resource.",
      "In the case of my ec2 nodes, the only traffic I needed to allow is inbound connections from the ALB and outbound connections to 0.0.0.0/0, which is crucial to allow the nodes to access the internet.",
    ],
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
    why: [
      "The actual EC2 server running the Kubernetes cluster.",
      "When the instance is provisioned, a shell script runs on startup (init-control-plane.sh.tpl) that installs everything the control plane needs.",
      "The installation includes: Creating the K3S cluster, configured with a custom ServiceAccount private signing key to support my custom OIDC issuer (more on that in the 'Identity & secrets' section). Moreover, installing FluxCD for GitOps, pointing it to my repo, and fetching relevant secrets from AWS Parameter Store.",
      "The instance is configured with IAM permissions to fetch specific secrets, upload the OIDC files to the OIDC S3 Bucket and start sessions with the AWS SSM Session Manager for remote access.",
      "About the instance type - it currently runs 'm7i-flex.large', which is essential to run all of my workloads safely with CPU and memory headroom. It started small with a free tier 't3.small', but even though K3S is lightweight, when you deploy Flux, Prometheus stack, External Secrets and two services, it does not have sufficient resources.",
    ],
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
    why: [
      "K3S is a Lightweight Kubernetes distribution, bundled in one binary. It is easy to install, very light on resources and comes with the Traefik ingress controller.",
      "The biggest choice in this project was choosing a self-managed cluster with K3S vs managed cluster with AWS EKS. The following are the tradeoffs and advantages I personally had to experience when building this project:",
      "1. The price - Running EKS is very expensive, coming to about 73$ just for the control plane, meaning that you have to also pay for the nodes themselves separately. One of my goals for this project was to deploy a Kubernetes cluster and run actual production workloads on it, but the price for EKS was way above my budget. Compare that with K3S where the control plane runs on the instance you provision.",
      "2. Operational Overhead - Giving up on EKS has a price, all of the convenience you get is yours to manage. For example: installing the control plane, configuring a custom OIDC issuer if you want IRSA in pods for short-term credentials. Also, configuring the Ingress controller, the Load Balancer integration, IAM, control plane failures... and more.",
      "3. Learning Opportunities - If learning is one of your goals, using EKS means missing out on a lot of the Kubernetes internal mechanisms that AWS manages for you. You obviously don't need to know everything, but experiencing some of those first hand helped me understand things in my work clusters that 'just work' that I took for granted.",
    ],
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
    why: [
      "Ingress Controller that comes pre-installed with the K3S Kubernetes distribution. It allows to route requests coming to the cluster to the correct pods based on ingress rules that you define.",
    ],
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
    sublabel: "branch master · path ./k8s",
    layer: "cluster",
    row: 0,
    why: [
      "The Git Repository hosting this project.",
      "My goal with this project was to show not just the ability in provisioning and managing production infrastructure/services, but to also demonstrate that I can connect all the parts with a scalable architecture that supports consistent multi-environment clusters (dev, staging, prod).",
      "That's why I decided to have everything in one repository - the infra configuration, the k8s manifests and the services themselves. Moreover, GitHub was used simply because I have most of my projects there, and it provides good CI and Image Registry that I have experience with at work.",
      "FluxCD is configured to point at this repo.",
    ],
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
    why: [
      "This is a GitOps CD tool that allows to manage the Kubernetes cluster manifests using Git as the source of truth.",
      "There was nothing manual that was applied to my cluster, what you see in my Git repo is exactly what is applied. In team development environments it allows for clarity in what's in the cluster, and if something was changed you can see what, when and who.",
      "Moreover, using the 'image.toolkit' Flux CRDs (ImageRepository, ImagePolicy, ImageUpdateAutomation), you can point images in deployment manifests at an image registry, have Flux scan the registry for new images, automatically updating the image version in the manifests and committing them to git.",
      "*Note* - Why did I choose Flux and not Argo? Both tools are great, but we specifically use Flux at work, and one of my personal goals for this project was to be able to reproduce it.",
    ],
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
    why: [
      "The controllers are mostly Helm Charts the cluster needs for some workloads and provide Kubernetes CRDs.",
      "This is best explained by looking at my Kubernetes directory structure:",
      "[apps/] - Manifests of the client and servers services.",
      "[clusters/(dev,stg,prod)/] - Manifests unique to the cluster environment (env vars, apply order).",
      "[infrastructure/controllers/] - Manifests for Helm Charts and installations (You are here).",
      "[infrastructure/configs/] - Configuration manifests for the cluster workloads.",
      "The structure is deliberate, and allows me to separate concerns and especially the apply order with Flux 'dependsOn' (cluster -> controllers -> configs -> apps).",
      "Because the cluster can't apply manifests using custom CRDs before they are installed, this apply order is crucial.",
    ],
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
    why: [
      "This directory contains configuration manifests that the cluster needs. It configures mainly external secrets.",
      "This is best explained by looking at my Kubernetes directory structure:",
      "[apps/] - Manifests of the client and servers services.",
      "[clusters/(dev,stg,prod)/] - Manifests unique to the cluster environment (env vars, apply order).",
      "[infrastructure/controllers/] - Manifests for Helm Charts and installations.",
      "[infrastructure/configs/] - Configuration manifests for the cluster workloads. (You are here)",
      "The structure is deliberate, and allows me to separate concerns and especially the apply order with Flux 'dependsOn' (cluster -> controllers -> configs -> apps).",
      "Because the cluster can't apply manifests using custom CRDs before they are installed, this apply order is crucial.",
    ],
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
    why: [
      "This directory contains the Kubernetes manifests of the actual client and server services in this repo.",
      "This is best explained by looking at my Kubernetes directory structure:",
      "[apps/] - Manifests of the client and servers services. (You are here)",
      "[clusters/(dev,stg,prod)/] - Manifests unique to the cluster environment (env vars, apply order).",
      "[infrastructure/controllers/] - Manifests for Helm Charts and installations.",
      "[infrastructure/configs/] - Configuration manifests for the cluster workloads.",
      "The structure is deliberate, and allows me to separate concerns and especially the apply order with Flux 'dependsOn' (cluster -> controllers -> configs -> apps).",
      "Because the cluster can't apply manifests using custom CRDs before they are installed, this apply order is crucial.",
    ],
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
    why: [
      "Public S3 Bucket in AWS that hosts the OIDC discovery files of the cluster. It contains the '.well-known/openid-configuration' and 'openid/v1/jwks' files. The bucket's URL is registered as a trusted OIDC issuer.",
      "*Background - why do I even need this?* - Some configurations and workloads the cluster runs require secrets that sit in AWS Parameter Store. In order for pods to access them, they need a Service Account connected to them with a role for authorization, and for authentication they need an AWS token. Now, the easiest way to do this is to create an AWS token and put it in my manifest. But it's more secure to use short-term access tokens, that the pod can issue on demand, and expire after a short time.",
      "That led me to the second option which is using IRSA with a custom OIDC provider. When you create a Service Account for a pod, the cluster signs a JWT token for it, that I configured its issuer to be the cluster itself, the audience to be AWS STS and the sub to be the service account name. In order for AWS to let the pod have a short-term token, it needs to verify that the JWT it presents was actually signed by my cluster.",
      "How does AWS verify the request actually came from my cluster? - As I said earlier, the cluster signs JWT tokens with a private RSA key that is generated in my instance startup script. A public key is also generated that can be used to verify the cluster signature - that's the key part (pun intended), I need to make that public key accessible to AWS STS so it can verify the pod. The public key is uploaded in the OIDC discovery standard format to the S3 bucket, and it's public so that AWS can easily access it, it does not contain any sensitive values.",
      "Why is it so complicated? - Once you understand the mechanism it's not that bad, but as I documented in other sections, this is one of the parts that EKS completely does for you out of the box.",
    ],
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
    why: [
      "Registers the URL of the S3 OIDC Bucket as a trusted provider for granting short-term tokens. Once it is set up, it is possible for pod service accounts to assume IAM roles that were specifically signed by that provider.",
      "*Background - why do I even need this?* - Some configurations and workloads the cluster runs require secrets that sit in AWS Parameter Store. In order for pods to access them, they need a Service Account connected to them with a role for authorization, and for authentication they need an AWS token. Now, the easiest way to do this is to create an AWS token and put it in my manifest. But it's more secure to use short-term access tokens, that the pod can issue on demand, and expire after a short time.",
      "That led me to the second option which is using IRSA with a custom OIDC provider. When you create a Service Account for a pod, the cluster signs a JWT token for it, that I configured its issuer to be the cluster itself, the audience to be AWS STS and the sub to be the service account name. In order for AWS to let the pod have a short-term token, it needs to verify that the JWT it presents was actually signed by my cluster.",
      "How does AWS verify the request actually came from my cluster? - As I said earlier, the cluster signs JWT tokens with a private RSA key that is generated in my instance startup script. A public key is also generated that can be used to verify the cluster signature - that's the key part (pun intended), I need to make that public key accessible to AWS STS so it can verify the pod. The public key is uploaded in the OIDC discovery standard format to the S3 bucket, and it's public so that AWS can easily access it, it does not contain any sensitive values.",
      "Why is it so complicated? - Once you understand the mechanism it's not that bad, but as I documented in other sections, this is one of the parts that EKS completely does for you out of the box.",
    ],
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
    why: [
      "Regular AWS IAM roles, but with a trust policy configured to allow my custom OIDC provider (described in the OIDC section) as a trusted principal - instead of the usual trust relationship with an AWS service or account.",
      "In this project, I use this to give pods fine-grained, least-privilege access to specific AWS services. For example, External Secrets Operator gets a role that can only read specific paths in Parameter Store.",
    ],
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
    why: [
      "AWS Service to store and manage parameters and sensitive data. In this project it is used to securely store secrets, like GitHub API keys, Discord webhook for alerts and Grafana credentials.",
      "Parameter access is protected behind IAM roles, which allows fine grained access to them.",
    ],
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
    why: [
      "When an AWS EC2 instance is created, it is automatically assigned an IAM role called the 'instance role'. The permissions that are given to the instance role apply to every request coming out of it, meaning that if I give it a permission to access a secret, every single pod automatically gets that access too.",
      "It is important to specify very specific permissions that the node has to have, and have other permissions scoped to the smallest unit possible for the best security.",
    ],
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
