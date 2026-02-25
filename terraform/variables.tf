###############################################################
# Variables - Fill in terraform.tfvars for your environment
###############################################################

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1" # Singapore - closest to Indonesia
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "expense-tracker"
}

variable "my_ip_cidr" {
  description = "Your public IP in CIDR notation (e.g. 1.2.3.4/32)"
  type        = string
  # Get your IP: curl ifconfig.me
}

variable "ssh_public_key" {
  description = "SSH public key content (e.g. contents of ~/.ssh/id_rsa.pub)"
  type        = string
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "expense_tracker"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "n8n_user"
}

variable "db_password" {
  description = "PostgreSQL master password (min 8 chars)"
  type        = string
  sensitive   = true
}

variable "n8n_domain" {
  description = "Domain/subdomain for n8n (e.g. n8n.yourdomain.com)"
  type        = string
}

# Looker Studio IP ranges (Google's documented ranges)
# Ref: https://support.google.com/looker-studio/answer/13987244
variable "looker_studio_ips" {
  description = "Looker Studio outbound IP CIDR ranges"
  type        = list(string)
  default = [
    "34.0.0.0/15",
    "34.2.0.0/16",
    "34.64.0.0/11",
    "34.80.0.0/12",
    "34.88.0.0/13",
    "34.96.0.0/14",
    "34.100.0.0/16",
    "35.184.0.0/13",
    "35.192.0.0/12",
    "35.208.0.0/12",
    "35.224.0.0/12",
    "35.240.0.0/13"
  ]
}
