terraform {
  required_providers {
    tls = {
      source  = "hashicorp/tls"
      version = "4.3.0"
    }
  }
}

resource "aws_s3_bucket" "this" {
  bucket        = var.name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "oidc" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_oidc_files_access" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.allow_oidc_files_access.json
}

data "aws_iam_policy_document" "allow_oidc_files_access" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.this.arn}/*",
    ]
  }
}

data "tls_certificate" "s3" {
  url = "https://${aws_s3_bucket.this.bucket_regional_domain_name}"
}

resource "aws_iam_openid_connect_provider" "k3s" {
  url             = "https://${aws_s3_bucket.this.bucket_regional_domain_name}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.s3.certificates[0].sha1_fingerprint]
}