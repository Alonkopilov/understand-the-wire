## Unexpected Problems and bugs I faced - with solutions 

### AWS SSM Agent not working
**What happened? -** I wanted a way to connect to my EC2 worker nodes, while considering good security practices. I didn't want to open port 22 to the world for ssh as commonly done, so I decided to use the **AWS SSM Session Manager**.
I created VPC endpoints to allow internal connection between AWS and my instance, and it just didn't work in the beginning.

**What it looked like? -** AWS showing `Session Manager connection status` to be disconnected.

**What it turned out to be? -** In order to create the instance in Terraform, I used an `aws_ami` `data` block, with the wildcard `al2023-ami-*-x86_64`. Apparently, this matched a special AWS AMI `minimal` version (al2023-ami-minimal-...x86_64), that **does not contain the SSM Agent** along some other things.

**How did I solve it? -** Simple, I just fixed the wildcard to a more specific one, that contains the image I want (`al2023-ami-2023*-x86_64`).

---

### Dealing with Spot instances
**What happened? -** Spot instances are a cheap way to create instances because you basically **"borrow" the instance**. I wanted to try to use it in my personal project to minimize costs, but quickly found out that instances disappear and you can't stop/start them.

**What it looked like? -** Grayed out buttons in AWS EC2 related to instance actions, and instances disappear randomly.

**What it turned out to be? -** All of that is expected behavior. The catch with spot instances is that AWS lets you host the instances for very cheap, but can take it away with like **two minute notice**.

**How did I solve it? -** I analyzed both options. In a mature multi-node cluster, you can add mechanisms to request a new instance whenever you get an alert for instance termination, but in this project I set up everything from scratch with (as of writing) single node to minimize costs. The cost of using an on-demand instance is manageable compared to getting unexpected interruptions.

---

### GitOps Kubernetes directory structure

**What happened? -** When dealing with FluxCD and Kubernetes manifests, sometimes I needed specific ordering to what Flux will apply first or there would have been errors.

**What it looked like? -** Flux reconciliation error messages

**What it turned out to be? -** Some manifests I have use CRDs installed via Helm charts. I had nothing to enforce apply order, so I got 'kind: X' does not exist errors.  

**How did I solve it? -** I read about Flux's Kustomization files that help enforce this. After adding them I realized my entire directory structure is not intuitive enough and messy for adding Flux apply ordering. I revamped the directory structure according to best practices:
- `clusters/` - Flux related manifests only
- `infrastructure/controllers/` - Helm Repositories and releases
- `infrastructure/configs` - cluster wide configurations (depends on controllers)
- `apps/` - Regular services (depends on configs)

---

### Flux Kustomization vs Kustomize Kustomization

**What happened? -** I had Flux reconciliation errors that seemed random.

**What it turned out to be? -** I have Kustomize Kustomization.yaml files referencing a directory that was also referenced in a Flux Kustomization resource - which is not correct. 

**How did I solve it? -** The intended behavior is that if a Flux Kustomization resource references a folder, it executes `kustomize build` in the background for it, so having a `Kustomization.yaml` reference it created double referencing that broke the apply order.

---

### Flux unable to push commits to my repo

**What happened? -** I set up Flux `ImageRepository`, `ImageUpdateAutomation` and `ImagePolicy` manifests to automatically detect and update deployment image versions, but got an error that the token I used didn't have 'write' permissions 

**What it turned out to be? -** Turned out that I missed a flag `--read-write-key` in the `flux bootstrap` command, that allows to create a read-write key to allow flux to push commits.

**How did I solve it? -** I found this error by connecting into the instance with `SSM Session Manager`, and debugging the source of the problem with flux and kubectl. I just added the missing flag later.

---

### Accessing Kubernetes API Server from a Pod

**What happened? -** I needed a way to allow my backend pod to access the information of other pods, deployments and nodes to gather data to show on the client.

**How did I solve it? -** I added an RBAC role like we used at work, and created a service account for my backend pod so that I could connect the RBAC to it. Because I also needed access to read node data, I created a Cluster RBAC role and not a regular role. 

---

### Disk Pressure Outage

**What happened? -** I deployed a new version for my backend, and suddenly I see **hundreds of evicted pods** in my nodes, and its stuck in a loop.

**What it looked like? -** The node spammed backend pods, and most of them had errors or evicted states. 

**What it turned out to be? -** After running `kubectl describe` on one of the pods and the nodes, I seen that the node declared a **Disk Pressure** state. The node storage got too low, that Kubernetes tried to remove pods but they were just created again and got stuck in a loop. 

**How did I solve it? -** I forgot to add a custom disk to my instance, so it got a default 8GB storage, which is not enough at all. I bumped up the storage to 30GB by creating a gp3 SSD in Terraform for the instance.

---

### How can pods access AWS services?

**What happened? -** 

**What it looked like? -** 

**What it turned out to be? -** 

**How did I solve it? -**  -->

<!-- ### Dealing with Spot instances
**What happened? -** 

**What it looked like? -** 

**What it turned out to be? -** 

**How did I solve it? -**  -->