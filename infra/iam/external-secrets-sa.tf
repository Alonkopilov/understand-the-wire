module "external-secrets-sa" {
  source = "../modules/service-account"

  service_account_name = "external-secrets"
  namespace            = "external-secrets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ],
        Resource = "*",
      },
    ]
  })

  oidc_provider_arn = var.oidc_provider_arn
}