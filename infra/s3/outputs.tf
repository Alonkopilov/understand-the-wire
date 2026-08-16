output "output_cluster_oidc_provider_arn" {
  type  = string
  value = aws_iam_openid_connect_provider.k3s.arn
}