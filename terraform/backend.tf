###############################################################
# terraform/backend.tf
# S3 Remote State Backend (required for CI/CD)
#
# Pre-requisite: manually create the S3 bucket once:
#   aws s3api create-bucket \
#     --bucket YOUR_BUCKET_NAME \
#     --region ap-southeast-1 \
#     --create-bucket-configuration LocationConstraint=ap-southeast-1
#
#   aws s3api put-bucket-versioning \
#     --bucket YOUR_BUCKET_NAME \
#     --versioning-configuration Status=Enabled
#
#   aws dynamodb create-table \
#     --table-name terraform-state-lock \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region ap-southeast-1
###############################################################

terraform {
  backend "s3" {
    # Values injected by CI/CD via -backend-config flags
    # (see terraform-cicd.yml)
    # bucket         = set via TF_STATE_BUCKET secret
    # key            = "expense-tracker/terraform.tfstate"
    # region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock" # for state locking
  }
}
