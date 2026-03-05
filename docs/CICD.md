# CI/CD Pipeline Documentation

This document explains every part of the CI/CD pipeline — what each job does, why it exists, and how the overall flow works.

## Overview

The pipeline has two parts:

- **CI (Continuous Integration)** — runs on every push, checks code quality and security
- **CD (Continuous Deployment)** — deploys the application after CI passes

```
Push to GitHub
      ↓
  CI Pipeline (ci.yml)
  ├── Code Quality & Tests     ← runs in parallel
  ├── Secret Detection         ← runs in parallel
  ├── Dependency Security Scan ← runs in parallel
  ├── CodeQL Analysis          ← runs in parallel
  │
  └── Build & Container Scan   ← runs after above pass
        ↓
  CD Pipeline (cd-staging.yml)
  └── Deploy to Staging        ← auto-deploys on main branch
        ↓
  CD Pipeline (cd-production.yml)
  └── Deploy to Production     ← manual approval required
```

---

## CI Pipeline — ci.yml

### Job 1: Code Quality & Tests

**What it does:**
- Installs Node.js dependencies
- Runs Jest unit tests with code coverage
- Uploads coverage report to SonarCloud
- SonarCloud performs SAST (Static Application Security Testing)

**Why it matters:**
Unit tests catch logic bugs. SonarCloud finds security issues in code like SQL injection patterns, hardcoded credentials, and insecure function usage — before the code ever runs.

**Key files:**
- `app/backend/tests/` — Jest test files
- `sonar-project.properties` — SonarCloud configuration

**What happens if it fails:**
- Tests failed — code has bugs, fix before merging
- SonarCloud quality gate failed — code has security issues or coverage is too low

---

### Job 2: Secret Detection

**What it does:**
- Runs TruffleHog across the entire git history
- Scans every commit ever made, not just the latest code
- Looks for API keys, passwords, tokens, private keys

**Why it matters:**
A secret committed and immediately deleted is still in git history forever. TruffleHog scans history so even accidentally committed and deleted secrets get caught.

**What happens if it fails:**
A real or suspected secret was found in git history. You need to rotate that credential immediately, then remove it from git history using BFG Repo Cleaner.

---

### Job 3: Dependency Security Scan

**What it does:**
- Runs `npm audit` on both backend and frontend
- Runs Trivy filesystem scan on the entire codebase
- Checks all npm packages against CVE databases

**Why it matters:**
Most real-world breaches happen through vulnerable dependencies, not custom code. A single outdated package can expose your entire application.

**What happens if it fails:**
High or critical CVEs were found in your dependencies. Run `npm audit fix` to auto-fix what is possible, then manually update packages with remaining issues.

---

### Job 4: CodeQL Analysis

**What it does:**
- GitHub's own ML-based code scanner
- Analyzes JavaScript code for security vulnerabilities
- Checks for XSS, injection attacks, path traversal, insecure deserialization

**Why it matters:**
CodeQL understands code flow, not just patterns. It can trace user input through your entire application and find where it could reach a dangerous function.

**Results appear in:**
GitHub repo → Security tab → Code scanning alerts

---

### Job 5: Build & Container Security Scan

**What it does:**
- Builds Docker images for backend and frontend
- Pushes images to GitHub Container Registry (ghcr.io)
- Runs Trivy container scan on built images
- Checks base OS packages inside the container for CVEs

**Why it matters:**
Even if your code is secure, the OS packages inside your Docker image can have vulnerabilities. Trivy scans these at the OS level.

**Images are tagged as:**
- `ghcr.io/anubhav-singhx/devops-secure-cicd-platform/backend:latest`
- `ghcr.io/anubhav-singhx/devops-secure-cicd-platform/frontend:latest`

---

### Job 6: Infrastructure Security Scan

**What it does:**
- Runs Trivy config scan on all Kubernetes YAML files
- Runs Trivy config scan on all Terraform files
- Checks for misconfigurations like containers running as root, missing resource limits, exposed secrets in configs

**Why it matters:**
A perfectly secure application can be compromised by a misconfigured Kubernetes deployment. This catches issues like missing security contexts, privileged containers, and overly permissive RBAC.

---

## CD Pipeline — cd-staging.yml

**Triggers:** Automatically on every push to `main` branch after CI passes.

**What it does:**
1. Connects to the Kubernetes cluster
2. Updates the deployment image tags to the latest build
3. Runs `kubectl rollout restart` for backend and frontend
4. Waits for rollout to complete
5. Runs OWASP ZAP DAST scan against the live staging URL

**OWASP ZAP DAST:**
Unlike SAST which reads code, ZAP actually attacks the running application. It tries SQL injection, XSS attacks, and authentication bypass attempts against every endpoint. Results are saved as a report artifact in the GitHub Actions run.

---

## CD Pipeline — cd-production.yml

**Triggers:** Manual only — requires clicking "Run workflow" in GitHub Actions.

**Why manual:**
Production deployments should always be a deliberate human decision. Automatic production deploys are risky — a broken commit could take down a live service used by real users.

**What it does:**
Same as staging CD but deploys to the production namespace with additional approval checks.

---

## Environment Variables and Secrets

All sensitive values are stored as GitHub Actions secrets, never in code.

| Secret | Used By | Purpose |
|--------|---------|---------|
| `SONAR_TOKEN` | CI - Code Quality job | Authenticate with SonarCloud |
| `SONAR_PROJECT_KEY` | CI - Code Quality job | Identify the SonarCloud project |
| `SONAR_ORGANIZATION` | CI - Code Quality job | SonarCloud organization name |
| `GITHUB_TOKEN` | CI - Build job | Push images to GHCR (auto-provided by GitHub) |

---

## Pipeline Badges

The README displays live pipeline status badges that update automatically:

```markdown
[![CI Pipeline](https://github.com/Anubhav-singhx/devops-secure-cicd-platform/actions/workflows/ci.yml/badge.svg)](...)
```

A green badge means the last CI run passed. A red badge means something is failing and needs attention.
