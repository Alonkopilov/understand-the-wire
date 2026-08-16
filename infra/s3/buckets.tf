resource "aws_s3_bucket" "oidc-bucket" {
  bucket = "understand-the-wire-oidc-bucket"
  force_destroy = true

  tags = {
    Name = "OIDC signature verification files bucket"
  }
}

resource "aws_s3_bucket_public_access_block" "oidc" {
  bucket                  = aws_s3_bucket.oidc-bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_oidc_files_access" {
  bucket = aws_s3_bucket.oidc-bucket.id
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
      "${aws_s3_bucket.oidc-bucket.arn}/*",
    ]
  }
}

data "tls_certificate" "s3" {
  url = "https://${aws_s3_bucket.oidc-bucket.bucket_regional_domain_name}"
}

resource "aws_iam_openid_connect_provider" "k3s" {
  url             = "https://${aws_s3_bucket.oidc-bucket.bucket_regional_domain_name}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.s3.certificates[0].sha1_fingerprint]
}