
output "how_to_access_grafana" {
  value = "Run: minikube service kube-prometheus-stack-grafana -n monitoring"
}

output "how_to_access_prometheus" {
  value = "Run: minikube service kube-prometheus-stack-prometheus -n monitoring"
}

output "staging_namespace" {
  value = kubernetes_namespace.staging.metadata[0].name
}

output "monitoring_namespace" {
  value = kubernetes_namespace.monitoring.metadata[0].name
}
