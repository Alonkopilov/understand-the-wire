resource "aws_s3_bucket" "state_bucket" {
  bucket = "alonko-utw-state-bucket"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "state_bucket" {
  bucket = aws_s3_bucket.state_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_bucket" {
  bucket = aws_s3_bucket.state_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state_bucket" {
  bucket = aws_s3_bucket.state_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

// Snapshot
resource "aws_s3_bucket" "snapshot_bucket" {
  bucket = "alonko-utw-snapshot-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "snapshot_bucket" {
  bucket = aws_s3_bucket.snapshot_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "snapshot_bucket" {
  bucket = aws_s3_bucket.snapshot_bucket.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "snapshot" {
  bucket = aws_s3_bucket.snapshot_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadObjects"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.snapshot_bucket.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.snapshot_bucket]
}
