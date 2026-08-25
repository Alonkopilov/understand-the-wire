variable "name_prefix" {
  type        = string
  description = "Will prepend every resource name that needs one."
}

variable "vpc" {
  type        = string
  description = "VPC CIDR blocks"
}

variable "subnets" {
  type = object({
    private = map(string)
    public  = map(string)
  })
  description = "Public + private subnets CIDR blocks"
}