resource "aws_s3_bucket" "state-bucket" {
  bucket = "alonko-state-bucket"

  tags = {
    Name = "Terraform State Bucket"
  }
}