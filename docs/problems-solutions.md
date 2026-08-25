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


<!-- ### Dealing with Spot instances
**What happened? -** 

**What it looked like? -** 

**What it turned out to be? -** 

**How did I solve it? -**  -->