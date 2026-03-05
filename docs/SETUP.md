# Setup Guide

This guide walks you through setting up the entire DevSecOps platform from scratch on your local machine.

## Prerequisites

Install the following tools before starting:

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | Latest | Container runtime |
| Minikube | v1.32+ | Local Kubernetes cluster |
| kubectl | v1.28+ | Kubernetes CLI |
| Terraform | v1.5+ | Infrastructure as Code |
| Helm | v3.12+ | Kubernetes package manager |
| Node.js | v20 LTS | Backend and frontend runtime |
| Git | Latest | Version control |

### Install on Windows

```powershell
# Install Chocolatey first if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install all tools
choco install docker-desktop minikube kubernetes-cli terraform helm nodejs-lts git -y
```

### Install on Mac

```bash
brew install minikube kubectl terraform helm node git
brew install --cask docker
```

### Install on Linux (Ubuntu/Debian)

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Anubhav-singhx/devops-secure-cicd-platform.git
cd devops-secure-cicd-platform
```

---

## Step 2 — Start Minikube

Minikube runs a full Kubernetes cluster inside Docker on your laptop.

```bash
minikube start --memory=8192 --cpus=4 --driver=docker
```

This takes 2-3 minutes the first time. After it starts, enable required addons:

```bash
minikube addons enable ingress
minikube addons enable metrics-server
```

Verify everything is running:

```bash
minikube status
kubectl get nodes
```

You should see one node in `Ready` status.

---

## Step 3 — Build Docker Images

The application images must be built inside Minikube's Docker daemon so Kubernetes can find them without a registry.

**On Mac/Linux:**
```bash
eval $(minikube docker-env)
docker build -t task-manager-backend:local ./app/backend
docker build -t task-manager-frontend:local ./app/frontend
```

**On Windows PowerShell:**
```powershell
minikube docker-env | Invoke-Expression
docker build -t task-manager-backend:local ./app/backend
docker build -t task-manager-frontend:local ./app/frontend
```

Verify images were built:
```bash
docker images | grep task-manager
```

---

## Step 4 — Deploy Monitoring Stack with Terraform

Terraform installs Prometheus, Grafana, and Loki using Helm charts.

```bash
cd infra/terraform
terraform init
terraform apply
```

Type `yes` when prompted. This takes 5-10 minutes as it downloads Helm charts.

After it completes, verify monitoring pods are running:
```bash
kubectl get pods -n monitoring
```

Most pods should show `Running`. Loki may take a few extra minutes.

---

## Step 5 — Deploy the Application

```bash
# Go back to project root
cd ../..

# Create application secrets
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_DB=taskmanager \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=postgres123 \
  -n staging

kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET=my-super-secret-jwt-key-change-in-production \
  -n staging

# Deploy all Kubernetes resources
kubectl apply -f infra/kubernetes/base/
```

Wait for all pods to start:
```bash
kubectl get pods -n staging -w
```

Press `Ctrl+C` when all pods show `1/1 Running`.

---

## Step 6 — Access the Application

```bash
minikube service frontend-service -n staging
```

This opens your browser automatically. You can:
- Register a new account
- Login and create tasks
- View the dashboard with charts

---

## Step 7 — Access Grafana Dashboards

```bash
minikube service kube-prometheus-stack-grafana -n monitoring
```

Login credentials:
- **Username:** `admin`
- **Password:** `grafana-admin-password`

Navigate to **Dashboards** → **Kubernetes / Compute Resources / Cluster** to see live cluster metrics.

---

## Step 8 — Run Tests Locally

```bash
# Backend tests
cd app/backend
npm install
npm test

# Frontend tests
cd ../frontend
npm install
npm test
```

---

## Step 9 — Run Security Scans Locally

```bash
# Install Trivy (if not installed)
# Mac: brew install aquasecurity/trivy/trivy
# Windows: choco install trivy

# Scan for vulnerabilities
./security/trivy/scan.sh

# OWASP ZAP scan (requires app to be running)
./security/zap/zap-scan.sh http://$(minikube ip)
```

---

## Stopping and Restarting

When you're done working:
```bash
minikube stop
```

To restart later:
```bash
minikube start
# Pods restart automatically, but may take 2-3 minutes
kubectl get pods -n staging -w
```

---

## Resetting Everything

If you want a completely fresh start:
```bash
minikube delete
minikube start --memory=8192 --cpus=4 --driver=docker
# Then repeat Steps 2-7
```
