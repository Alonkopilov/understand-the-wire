output "oidc_provider_arn" {
  type  = string
  value = aws_iam_openid_connect_provider.k3s.arn
}

output "oidc_provider_domain" {
  type  = string
  value = aws_s3_bucket.this.bucket_regional_domain_name
}

output "bucket" {
  type = object({
    name = string
    url  = string
    arn  = string
  })
  value = {
    name = aws_s3_bucket.this.bucket
    url  = "https://${aws_s3_bucket.this.bucket_regional_domain_name}"
    arn  = aws_s3_bucket.this.arn
  }
}