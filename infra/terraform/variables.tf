variable "app_namespace" {
  description = "Kubernetes namespace for the application"
  type        = string
  default     = "staging"
}

variable "monitoring_namespace" {
  description = "Kubernetes namespace for monitoring tools"
  type        = string
  default     = "monitoring"
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
  default     = "postgres-terraform-password"
}

variable "jwt_secret" {
  description = "JWT signing secret for the backend"
  type        = string
  sensitive   = true
  default     = "terraform-managed-jwt-secret"
}

variable "grafana_password" {
  description = "Grafana admin dashboard password"
  type        = string
  sensitive   = true
  default     = "grafana-admin-password"
}
