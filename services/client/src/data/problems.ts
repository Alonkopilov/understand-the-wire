/**
 * The failures worth writing up, transcribed from docs/problems-solutions.md.
 *
 * Entries with an empty `title` are skipped when rendering, so this can be
 * filled in one at a time. `nodeId` links a card to a box on the map.
 */
export type Problem = {
  id: string;
  title: string;
  symptom: string;
  cause: string;
  fix: string;
  nodeId?: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "ssm-agent",
    title: "AWS SSM Agent not working",
    symptom:
      "I wanted a way to connect to my EC2 worker nodes while considering good security practices. I didn't want to open port 22 to the world for SSH as is commonly done, so I decided to use AWS SSM Session Manager, and created VPC endpoints to allow internal connection between AWS and my instance. It just didn't work in the beginning - AWS showed the Session Manager connection status as disconnected.",
    cause:
      "In order to create the instance in Terraform I used an aws_ami data block with the wildcard al2023-ami-*-x86_64. Apparently this matched a special AWS minimal AMI (al2023-ami-minimal-...x86_64) that does not contain the SSM Agent, along with some other things.",
    fix: "Simple - I just fixed the wildcard to a more specific one that contains the image I want: al2023-ami-2023*-x86_64.",
    nodeId: "ec2",
  },
  {
    id: "spot",
    title: "Dealing with Spot instances",
    symptom:
      'Spot instances are a cheap way to create instances because you basically "borrow" the instance. I wanted to try it to minimise costs, but quickly found out that instances disappear and you cannot stop or start them. Instance action buttons were greyed out in the EC2 console, and instances vanished at random.',
    cause:
      "All of that is expected behaviour. The catch with spot instances is that AWS lets you host them very cheaply, but can take them away with about two minutes of notice.",
    fix: "I analysed both options. In a mature multi-node cluster you can add mechanisms to request a new instance whenever you get an alert for instance termination, but in this project I set everything up from scratch with (as of writing) a single node to minimise costs. The cost of using an on-demand instance is manageable compared to getting unexpected interruptions.",
    nodeId: "ec2",
  },
  {
    id: "gitops-layout",
    title: "GitOps Kubernetes directory structure",
    symptom:
      "When dealing with FluxCD and Kubernetes manifests, sometimes I needed specific ordering for what Flux applies first or there would be errors. I kept getting Flux reconciliation error messages.",
    cause:
      "Some manifests I have use CRDs installed via Helm charts. I had nothing to enforce apply order, so I got 'kind: X does not exist' errors.",
    fix: "I read about Flux's Kustomization files, which help enforce this. After adding them I realised my entire directory structure was not intuitive enough and was messy for adding Flux apply ordering. I revamped it according to best practices: clusters/ for Flux related manifests only, infrastructure/controllers/ for Helm repositories and releases, infrastructure/configs/ for cluster-wide configuration (depends on controllers), and apps/ for regular services (depends on configs).",
    nodeId: "flux",
  },
  {
    id: "double-kustomization",
    title: "Flux Kustomization vs Kustomize Kustomization",
    symptom: "I had Flux reconciliation errors that seemed random.",
    cause:
      "I had Kustomize kustomization.yaml files referencing a directory that was also referenced in a Flux Kustomization resource - which is not correct.",
    fix: "The intended behaviour is that if a Flux Kustomization resource references a folder, it executes kustomize build in the background for it. So having a kustomization.yaml reference it as well created double referencing, which broke the apply order.",
    nodeId: "flux",
  },
  {
    id: "flux-write-key",
    title: "Flux unable to push commits to my repo",
    symptom:
      "I set up Flux ImageRepository, ImageUpdateAutomation and ImagePolicy manifests to automatically detect and update deployment image versions, but got an error that the token I used didn't have write permissions.",
    cause:
      "It turned out that I missed a flag, --read-write-key, in the flux bootstrap command. That flag creates a read-write key which allows Flux to push commits.",
    fix: "I found this error by connecting into the instance with SSM Session Manager and debugging the source of the problem with flux and kubectl. I just added the missing flag later.",
    nodeId: "github",
  },
  {
    id: "pod-api-access",
    title: "Accessing the Kubernetes API server from a pod",
    symptom:
      "I needed a way to allow my backend pod to access the information of other pods, deployments and nodes, to gather data to show on the client.",
    cause:
      "A pod is not granted access to the API server by default. Permissions are given to an identity, and the identity a pod uses is its service account.",
    fix: "I added an RBAC role like we used at work, and created a service account for my backend pod so that I could connect the RBAC to it. Because I also needed access to read node data, I created a ClusterRole and not a regular namespaced role.",
    nodeId: "apps",
  },
  {
    id: "disk-pressure",
    title: "Disk pressure outage",
    symptom:
      "I deployed a new version of my backend and suddenly saw hundreds of evicted pods on my node, stuck in a loop. The node spammed backend pods and most of them were in error or evicted states.",
    cause:
      "After running kubectl describe on one of the pods and on the node, I saw that the node had declared a Disk Pressure state. Node storage got so low that Kubernetes tried to remove pods, but they were just created again and it got stuck in a loop.",
    fix: "I had forgotten to add a custom disk to my instance, so it got the default 8GB of storage, which is not enough at all. I bumped the storage up to 30GB by creating a gp3 SSD in Terraform for the instance.",
    nodeId: "ec2",
  },
  {
    id: "irsa-on-k3s",
    title: "How can pods access AWS with short-term tokens on K3s?",
    symptom:
      "Some configurations and workloads the cluster runs require secrets that sit in AWS Parameter Store. For pods to access them they need a service account connected to a role for authorisation, and an AWS token for authentication. The easiest way is to create an AWS token and put it in my manifest - but it is far more secure to use short-term access tokens that the pod can issue on demand and that expire after a short time.",
    cause:
      "That led me to IRSA with a custom OIDC provider. The problem started when I realised that compared to a self-managed K3s cluster, the managed AWS EKS option does it all for you: all you need is a simple eks.amazonaws.com/role-arn annotation, and the OIDC provider is already set up by default.",
    fix: "The only way is to host your own OIDC provider. When you create a service account for a pod, the cluster signs a JWT for it - I configured its issuer to be the cluster itself, the audience to be AWS STS, and the sub to be the service account name. For AWS to give the pod a short-term token, it needs to verify that the JWT it presents was actually signed by my cluster. The cluster signs JWTs with a private RSA key generated in my instance startup script, and a public key is generated alongside it that can be used to verify the signature - that's the key part (pun intended). The public key is uploaded in the OIDC discovery standard format to an S3 bucket, and it is public so that AWS can easily access it. It does not contain any sensitive values.",
    nodeId: "oidc-provider",
  },
  {
    id: "node-zone",
    title: "How to get the availability zone of the pod?",
    symptom:
      "I needed to show the zone in my client, so I used the Kubernetes API server to get the topology.kubernetes.io/zone label - and it just didn't exist.",
    cause:
      "EKS is very integrated: worker nodes and the pods running on them are populated with useful labels, one of which is the availability zone of the node. In a self-managed K3s cluster that label does not exist.",
    fix: "Because I wanted to show the zone on my website, I had to get the information from AWS itself using the AWS API.",
    nodeId: "k3s",
  },
];
