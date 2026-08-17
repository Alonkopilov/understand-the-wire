#!/bin/bash
set -euxo pipefail

OIDC_ISSUER="${oidc_bucket_url}"          # The url that links to the public keys of our issuer
OIDC_BUCKET_NAME="${oidc_bucket_name}"    # Bucket name to copy the OIDC files to
REPO_OWNER="${repo_owner}"                # The GitHub username of the repo owner for FluxCD
REPO_NAME="${repo_name}"                  # The GitHub repository to listen to 
BRANCH="${branch}"                        # The git branch to listen to 
KEY_DIR="/etc/rancher/k3s/keys"           # Will contain the private signing key and the public key to verify it

# Generate a custom signing key for ServiceAccounts
mkdir -p "$KEY_DIR"
openssl genrsa -out "$KEY_DIR/sa-signer.key" 2048
openssl rsa \
  -in "$KEY_DIR/sa-signer.key" \
  -pubout \
  -out "$KEY_DIR/sa-signer.pub"

# Set minimal permissions for the key files
chmod 600 "$KEY_DIR/sa-signer.key"
chmod 644 "$KEY_DIR/sa-signer.pub"

# Configure K3S
mkdir -p /etc/rancher/k3s

tee /etc/rancher/k3s/config.yaml > /dev/null <<EOF
write-kubeconfig-mode: "0644"

kube-apiserver-arg:
  - "service-account-issuer=$OIDC_ISSUER"
  - "service-account-signing-key-file=$KEY_DIR/sa-signer.key"
  - "service-account-key-file=$KEY_DIR/sa-signer.pub"
  - "api-audiences=sts.amazonaws.com,https://kubernetes.default.svc"
EOF

# Install K3S
curl --retry 10 --retry-delay 5 --retry-all-errors \
    -fL https://get.k3s.io \
    -o /tmp/install-k3s.sh
bash -x /tmp/install-k3s.sh

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

SSM_USER_DIR="/home/ssm-user"
mkdir -p $SSM_USER_DIR/.kube
ln -sf $KUBECONFIG $SSM_USER_DIR/.kube/config

until kubectl get nodes >/dev/null 2>&1; do
    echo "Waiting for Kubernetes..."
    sleep 5
done

# Get OIDC files from the cluster
mkdir -p /tmp/oidc/.well-known
mkdir -p /tmp/oidc/openid/v1

kubectl get --raw /.well-known/openid-configuration \
    > /tmp/oidc/.well-known/openid-configuration

# Fix the JWKS url field, it defaults to the cluster's internal IP
sed -i \
    "s#\"jwks_uri\":\"[^\"]*\"#\"jwks_uri\":\"$OIDC_ISSUER/openid/v1/jwks\"#" \
    /tmp/oidc/.well-known/openid-configuration

kubectl get --raw /openid/v1/jwks \
    > /tmp/oidc/openid/v1/jwks

# Upload OIDC files to S3
aws s3 cp \
    /tmp/oidc/.well-known/openid-configuration \
    "s3://$OIDC_BUCKET_NAME/.well-known/openid-configuration" \
    --content-type application/json

aws s3 cp \
    /tmp/oidc/openid/v1/jwks \
    "s3://$OIDC_BUCKET_NAME/openid/v1/jwks" \
    --content-type application/json

# Set up FluxCD
curl -s https://fluxcd.io/install.sh | bash

export GITHUB_USER=$REPO_OWNER
export GITHUB_TOKEN="$(aws ssm get-parameter \
  --name /production/github/token \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)"

flux bootstrap github \
  --owner=$REPO_OWNER \
  --repository=$REPO_NAME \
  --branch=$BRANCH \
  --path=./k8s \
  --personal