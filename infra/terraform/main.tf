resource "kubernetes_namespace" "staging" {
  metadata {
    name = var.app_namespace
    labels = {
      environment = "staging"
      managed-by  = "terraform"
      project     = "task-manager"
    }
  }
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = var.monitoring_namespace
    labels = {
      purpose    = "observability"
      managed-by = "terraform"
    }
  }
}

resource "kubernetes_secret" "postgres" {
  metadata {
    name      = "postgres-secret"
    namespace = kubernetes_namespace.staging.metadata[0].name
  }

  data = {
    POSTGRES_DB       = "taskmanager"
    POSTGRES_USER     = "postgres"
    POSTGRES_PASSWORD = var.db_password
  }
}

resource "kubernetes_secret" "backend" {
  metadata {
    name      = "backend-secret"
    namespace = kubernetes_namespace.staging.metadata[0].name
  }

  data = {
    JWT_SECRET = var.jwt_secret
  }
}

resource "helm_release" "prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "55.5.0"
  timeout    = 600

  set {
    name  = "grafana.adminPassword"
    value = var.grafana_password
  }

  set {
    name  = "grafana.service.type"
    value = "NodePort"
  }

  set {
    name  = "prometheus.service.type"
    value = "NodePort"
  }

  set {
    name  = "prometheus.prometheusSpec.retention"
    value = "7d"
  }

  set {
    name  = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }

  set {
    name  = "prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues"
    value = "false"
  }
}

resource "helm_release" "loki_stack" {
  name       = "loki-stack"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "2.9.11"
  timeout    = 300

  set {
    name  = "grafana.enabled"
    value = "false"
  }

  set {
    name  = "promtail.enabled"
    value = "true"
  }

  set {
    name  = "loki.persistence.enabled"
    value = "false"
  }

  set {
    name  = "loki.resources.requests.memory"
    value = "64Mi"
  }

  set {
    name  = "loki.resources.limits.memory"
    value = "128Mi"
  }

  set {
    name  = "loki.resources.requests.cpu"
    value = "50m"
  }

  set {
    name  = "loki.resources.limits.cpu"
    value = "200m"
  }

  depends_on = [helm_release.prometheus_stack]
}
