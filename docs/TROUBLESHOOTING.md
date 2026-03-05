# Troubleshooting Guide

This guide covers the most common issues encountered when running this project and how to fix them.

---

## Kubernetes Issues

### Pods stuck in CrashLoopBackOff

**Symptom:**
```
NAME                READY   STATUS             RESTARTS
backend-xxx         0/1     CrashLoopBackOff   10
```

**Diagnose:**
```bash
kubectl logs POD-NAME -n staging
kubectl describe pod POD-NAME -n staging
```

**Common causes and fixes:**

**1. Database password mismatch**
```bash
# Check secret password
kubectl get secret postgres-secret -n staging -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d

# Check postgres actual password
kubectl exec -it postgres-0 -n staging -- env | grep POSTGRES_PASSWORD

# If they don't match — recreate everything cleanly
kubectl delete secret postgres-secret -n staging
kubectl delete statefulset postgres -n staging
kubectl delete pvc postgres-pvc -n staging
kubectl create secret generic postgres-secret --from-literal=POSTGRES_DB=taskmanager --from-literal=POSTGRES_USER=postgres --from-literal=POSTGRES_PASSWORD=postgres123 -n staging
kubectl apply -f infra/kubernetes/base/postgres.yaml
```

**2. Image not found in Minikube**
```bash
# Rebuild images inside Minikube's Docker daemon
minikube docker-env | Invoke-Expression   # Windows PowerShell
eval $(minikube docker-env)               # Mac/Linux

docker build -t task-manager-backend:local ./app/backend
docker build -t task-manager-frontend:local ./app/frontend
kubectl rollout restart deployment/backend -n staging
kubectl rollout restart deployment/frontend -n staging
```

**3. Test the database connection directly**
```bash
kubectl exec -it BACKEND-POD-NAME -n staging -- node -e "
const { Pool } = require('pg');
const pool = new Pool({ host: 'postgres-service', port: 5432, database: 'taskmanager', user: 'postgres', password: 'postgres123' });
pool.query('SELECT 1').then(() => console.log('DB CONNECTION OK')).catch(e => console.log('DB ERROR:', e.message));
"
```

---

### Too many pods running (10+ pods)

**Cause:** HPA (auto-scaler) created many pods when backend was unhealthy. They never cleaned up after health was restored.

**Fix:**
```bash
kubectl delete pods -n staging --all --force --grace-period=0
kubectl scale deployment/backend --replicas=2 -n staging
kubectl scale deployment/frontend --replicas=2 -n staging
```

---

### Cannot access app in browser on Windows

**Symptom:** `ERR_CONNECTION_TIMED_OUT` when visiting `192.168.49.2`

**Cause:** Minikube with Docker driver on Windows creates an isolated network. The Minikube IP is not directly reachable from the Windows host browser.

**Fix:** Always use `minikube service` instead of the IP directly:
```bash
minikube service frontend-service -n staging
minikube service kube-prometheus-stack-grafana -n monitoring
```

---

### Everything crashes after restarting computer

**Cause:** Minikube stops when the computer restarts. Pods need a few minutes to come back up.

**Fix:**
```bash
minikube start
# Wait 3-5 minutes
kubectl get pods -n staging -w
kubectl get pods -n monitoring -w
```

If pods don't recover after 5 minutes, check logs and follow the CrashLoopBackOff fix above.

---

## Terraform Issues

### Error: namespace already exists

**Symptom:**
```
Error: namespaces "staging" already exists
```

**Cause:** Namespace was created manually with kubectl before Terraform ran.

**Fix:**
```bash
terraform import kubernetes_namespace.staging staging
terraform import kubernetes_namespace.monitoring monitoring
terraform apply
```

---

### Error: secrets already exist

**Symptom:**
```
Error: secrets "postgres-secret" already exists
```

**Fix:**
```bash
terraform import kubernetes_secret.postgres staging/postgres-secret
terraform import kubernetes_secret.backend staging/backend-secret
terraform apply
```

---

### Terraform apply hangs on Helm release

**Symptom:** `helm_release.prometheus_stack: Still creating... [5m elapsed]`

**Fix:** Wait up to 10 minutes — the kube-prometheus-stack chart is very large. If it times out, press `Ctrl+C` and run `terraform apply` again. Terraform is idempotent — running it multiple times is safe.

---

### StatefulSet update forbidden error

**Symptom:**
```
Error: cannot patch "loki-stack" with kind StatefulSet: updates to statefulset spec...are forbidden
```

**Cause:** Kubernetes does not allow updating certain StatefulSet fields in-place.

**Fix:** Delete and reinstall the Helm release:
```bash
helm uninstall loki-stack -n monitoring
kubectl delete pvc -n monitoring -l app=loki
terraform apply
```

---

## Monitoring Issues

### Grafana shows "No data sources found"

**Cause:** Prometheus datasource configmap was deleted or never created.

**Fix:**
1. Open Grafana → Connections → Data sources → Add data source
2. Select Prometheus
3. URL: `http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090`
4. Toggle Default to ON
5. Save & Test

---

### Grafana pod in CrashLoopBackOff

**Symptom:**
```
kube-prometheus-stack-grafana-xxx   2/3   CrashLoopBackOff
```

**Check logs:**
```bash
kubectl logs GRAFANA-POD -n monitoring -c grafana --tail=20
```

**If error says "Only one datasource per organization can be marked as default":**
```bash
kubectl delete configmap kube-prometheus-stack-grafana-datasource -n monitoring
kubectl rollout restart deployment/kube-prometheus-stack-grafana -n monitoring
```

Then re-add Prometheus datasource manually, making sure only one is set as default.

---

### Loki not connecting in Grafana

**Symptom:** "Unable to connect with Loki"

**Check if Loki is healthy:**
```bash
kubectl get pods -n monitoring | grep loki
kubectl logs loki-stack-0 -n monitoring --tail=20
```

**If Loki shows 1/1 Running:** Try URL `http://loki-stack.monitoring.svc.cluster.local:3100`

**If Loki keeps restarting:** Your machine does not have enough free RAM. Loki is resource-heavy. This is a hardware limitation in local development and is expected. The code is correct — Loki works in production on a proper cluster.

---

## GitHub Actions Issues

### CI fails: "Could not find project key"

**Symptom:**
```
ERROR Could not find a default branch for project with key 'xxx'. Make sure project exists.
```

**Fix:**
1. Go to sonarcloud.io → your project → Information (bottom left)
2. Copy the exact Project Key and Organization values
3. Update `sonar-project.properties` in your repo root
4. Update GitHub secrets `SONAR_PROJECT_KEY` and `SONAR_ORGANIZATION` to match exactly
5. Push again

---

### Secret Detection fails

**Symptom:** TruffleHog finds a potential secret

**Steps:**
1. Click on the failed job to see which file and line number
2. If it is a real secret — rotate it immediately in that service, assume it is compromised
3. If it is a false positive (test data, example values) — add an inline comment:
```javascript
const exampleKey = "test-value-not-real"; // pragma: allowlist secret
```

---

### Dependency scan fails with CVEs

**Fix:**
```bash
cd app/backend
npm audit fix
cd ../frontend
npm audit fix
git add package-lock.json
git commit -m "fix: update dependencies to resolve CVEs"
git push
```

---

## Git Issues

### Pre-commit hook fails on Windows: "Unable to read baseline"

**Cause:** Known Windows compatibility bug with detect-secrets and pre-commit.

**Fix:** Remove the detect-secrets hook from `.pre-commit-config.yaml`. TruffleHog in GitHub Actions provides the same protection for the remote repository.

---

### git commit fails: large file error

**Symptom:**
```
terraform-provider-xxx (55653 KB) exceeds 1000 KB
```

**Fix:** Add to `.gitignore` and remove from tracking:
```
**/.terraform/*
*.tfstate
*.tfstate.backup
```

```bash
git rm -r --cached infra/terraform/.terraform/
git add .gitignore
git commit -m "fix: exclude terraform provider binaries"
```

---

## Performance Issues

### Minikube is very slow or unresponsive

**Fix:** Delete and recreate with more resources:
```bash
minikube delete
minikube start --memory=8192 --cpus=4 --driver=docker
```

Make sure Docker Desktop has at least 8GB RAM allocated:
Docker Desktop → Settings → Resources → Memory → set to 8GB or more
