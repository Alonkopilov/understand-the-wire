#!/bin/bash
set -euxo pipefail

# Set up Kubernetes with K3S
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="--write-kubeconfig-mode=644" \
  sh -

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

until kubectl get nodes >/dev/null 2>&1; do
    echo "Waiting for Kubernetes..."
    sleep 5
done

# Set up FluxCD
curl -s https://fluxcd.io/install.sh | sudo bash

export GITHUB_USER="${repo_owner}"
export GITHUB_TOKEN="$(aws ssm get-parameter \
  --name /production/github/token \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)"

flux bootstrap github \
  --owner=${repo_owner} \
  --repository=${repo_name} \
  --branch=${branch} \
  --path=./k8s \
  --personal