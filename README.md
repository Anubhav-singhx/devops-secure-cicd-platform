# 🚀 Enterprise-Grade Secure CI/CD Platform

[![CI Pipeline](https://github.com/Anubhav-singhx/devops-secure-cicd-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Anubhav-singhx/devops-secure-cicd-platform/actions/workflows/ci.yml)
[![CD Staging](https://github.com/Anubhav-singhx/devops-secure-cicd-platform/actions/workflows/cd-staging.yml/badge.svg)](https://github.com/Anubhav-singhx/devops-secure-cicd-platform/actions/workflows/cd-staging.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=anubhav-singhx_devops-secure-cicd-platform&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=anubhav-singhx_devops-secure-cicd-platform)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=anubhav-singhx_devops-secure-cicd-platform&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=anubhav-singhx_devops-secure-cicd-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Production-grade DevSecOps pipeline** built entirely on free tools. Automated security scanning at every stage, Kubernetes orchestration, Infrastructure as Code, and full observability — $0/month vs $385+/month on AWS.

## 💰 Cost Comparison

| Component | AWS Cost | This Project |
|-----------|---------|-------------|
| Kubernetes (EKS) | $150+/month | $0 (Minikube) |
| Database (RDS) | $30+/month | $0 (K8s StatefulSet) |
| CI/CD (CircleCI) | $50+/month | $0 (GitHub Actions) |
| Monitoring (Datadog) | $100+/month | $0 (Prometheus+Grafana) |
| Security Scanning | $50+/month | $0 (Trivy, CodeQL, ZAP) |
| **Total** | **$380+/month** | **$0/month** |

## 🏗️ Architecture

```
Developer Pushes Code
         ↓
   GitHub Repository
         ↓
  GitHub Actions CI (6 parallel security jobs)
    ├── ✅ Tests + SonarCloud SAST
    ├── ✅ TruffleHog Secret Scanning
    ├── ✅ npm audit + Trivy Dependency Scan
    ├── ✅ CodeQL Analysis
    ├── ✅ Docker Build + Trivy Container Scan
    └── ✅ K8s + Terraform Config Scan
         ↓
  GitHub Container Registry
         ↓
  CD Pipeline → Minikube (Kubernetes)
    ├── Staging Namespace
    │   ├── React Frontend × 2 pods
    │   ├── Node.js Backend × 2 pods (auto-scales to 10)
    │   └── PostgreSQL StatefulSet
    └── OWASP ZAP DAST Scan
         ↓
  Monitoring Stack (monitoring namespace)
    ├── Prometheus — collects metrics every 15s
    ├── Grafana — dashboards and visualizations
    ├── Loki — log aggregation from all pods
    └── Alertmanager — email alerts for issues
```

## 🛡️ Security Layers

| Layer | Tool | What It Catches |
|-------|------|----------------|
| Pre-commit | detect-secrets | Passwords before they're committed |
| SAST | SonarCloud + CodeQL | SQL injection, XSS, insecure code |
| Secrets | TruffleHog | Leaked credentials in git history |
| Dependencies | npm audit + Trivy | CVEs in npm packages |
| Container | Trivy | OS-level vulnerabilities in images |
| Infrastructure | Trivy config | K8s and Terraform misconfigurations |
| Runtime (DAST) | OWASP ZAP | Live application vulnerability testing |

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Minikube
- kubectl
- Terraform ≥ 1.5
- Helm ≥ 3.12
- Node.js 20 LTS

### 1. Clone
```bash
git clone https://github.com/Anubhav-singhx/devops-secure-cicd-platform.git
cd devops-secure-cicd-platform
```

### 2. Start Kubernetes
```bash
minikube start --memory=8192 --cpus=4 --driver=docker
minikube addons enable ingress metrics-server
```

### 3. Build and Deploy
```bash
# Build images into Minikube
eval $(minikube docker-env)
docker build -t task-manager-backend:local ./app/backend
docker build -t task-manager-frontend:local ./app/frontend

# Deploy with Terraform (monitoring stack)
cd infra/terraform && terraform init && terraform apply

# Deploy application
kubectl apply -f infra/kubernetes/base/
```

### 4. Access Services
```bash
# Application
minikube service frontend-service -n staging

# Grafana dashboards
minikube service kube-prometheus-stack-grafana -n monitoring
```

### 5. Or just use Docker Compose (simpler)
```bash
cd app
docker-compose up --build
# Open http://localhost:3000
```

## 📁 Project Structure

```
devops-secure-cicd-platform/
├── app/
│   ├── backend/              # Node.js + Express API
│   │   ├── src/
│   │   │   ├── config/       # Database connection
│   │   │   ├── routes/       # API endpoints + /metrics
│   │   │   └── middleware/   # Auth + error handling
│   │   ├── tests/            # Jest unit tests
│   │   └── Dockerfile        # Multi-stage, non-root
│   ├── frontend/             # React + Material UI
│   │   ├── src/
│   │   │   ├── pages/        # Login, Dashboard, Tasks
│   │   │   └── components/   # Navbar
│   │   ├── nginx.conf        # Optimized nginx config
│   │   └── Dockerfile        # Multi-stage, nginx
│   └── docker-compose.yml    # Local development
├── infra/
│   ├── kubernetes/base/      # K8s manifests
│   │   ├── namespaces.yaml
│   │   ├── postgres.yaml     # StatefulSet + PVC
│   │   ├── backend.yaml      # Deployment + HPA
│   │   ├── frontend.yaml     # Deployment + Ingress
│   │   └── hpa.yaml          # Auto-scaling rules
│   └── terraform/            # Infrastructure as Code
│       ├── providers.tf      # K8s + Helm providers
│       ├── main.tf           # Prometheus + Grafana + Loki
│       └── variables.tf
├── .github/workflows/
│   ├── ci.yml                # 6-job CI pipeline
│   ├── cd-staging.yml        # Auto-deploy to staging
│   └── cd-production.yml     # Manual production deploy
├── monitoring/
│   └── prometheus/
│       └── alert-rules.yaml  # Custom alert rules
├── security/
│   ├── trivy/scan.sh         # Local security scan
│   └── zap/zap-scan.sh       # DAST scan script
└── docs/
    ├── SETUP.md              # Full setup guide
    ├── CICD.md               # Pipeline documentation
    ├── SECURITY.md           # Security details
    └── TROUBLESHOOTING.md    # Common issues
```

## 🔄 CI/CD Pipeline Details

### CI Jobs (run on every push)
1. **Code Quality** — Jest tests + SonarCloud analysis
2. **Secret Detection** — TruffleHog scans entire git history
3. **Dependency Scan** — npm audit + Trivy filesystem
4. **CodeQL** — GitHub's ML-based security scanner
5. **Build & Scan** — Build Docker images + Trivy container scan
6. **Infra Scan** — Trivy scans K8s and Terraform files

### CD Flow
- Push to `main` → auto-deploys to **staging**
- Manual trigger with approval → deploys to **production**

## 📊 Monitoring

Grafana dashboards (access via `minikube service kube-prometheus-stack-grafana -n monitoring`):
- **Kubernetes / Compute Resources / Cluster** — pod CPU and memory usage
- **Kubernetes / Compute Resources / Namespace** — per-namespace breakdown
- **Node Exporter Full** (ID: 1860) — server metrics

## 🧪 Run Security Scans Locally

```bash
# Trivy scan (vulnerabilities)
./security/trivy/scan.sh

# OWASP ZAP scan (requires running app)
./security/zap/zap-scan.sh http://localhost:3000
```

## 📖 Documentation

- [Setup Guide](docs/SETUP.md)
- [CI/CD Explained](docs/CICD.md)
- [Security Details](docs/SECURITY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

**Built to demonstrate production DevSecOps practices at zero cost.**
