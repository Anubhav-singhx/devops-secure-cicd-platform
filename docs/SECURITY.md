# Security Documentation

This document explains the security architecture, tools used, and the reasoning behind each security decision in this project.

## Security Philosophy

Security is applied at every layer — from the developer's laptop before code is committed, through the CI pipeline, to the running application. This is called **shift-left security** — catching issues as early as possible, when they are cheapest to fix.

```
Developer Laptop → Git Commit → CI Pipeline → Container → Kubernetes → Runtime
      ↓                ↓              ↓             ↓           ↓          ↓
  pre-commit      git history    SAST/DAST       Trivy      Trivy      OWASP ZAP
  hooks           TruffleHog     SonarCloud     container   config     live scan
```

---

## Layer 1 — Pre-Commit Hooks

**Tool:** pre-commit framework
**Config:** `.pre-commit-config.yaml`

Hooks that run before every `git commit`:

| Hook | What It Checks |
|------|---------------|
| `trailing-whitespace` | Removes trailing spaces |
| `end-of-file-fixer` | Ensures files end with newline |
| `check-yaml` | Validates YAML syntax |
| `check-merge-conflict` | Finds unresolved merge conflicts |
| `detect-private-key` | Blocks SSH/PEM private keys from being committed |
| `check-added-large-files` | Blocks files over 1MB |

**Why pre-commit hooks matter:**
They catch issues in seconds before code ever leaves your machine. It is infinitely cheaper to fix a problem locally than after it has been pushed, reviewed, and deployed.

---

## Layer 2 — Secret Detection (TruffleHog)

**Tool:** TruffleHog v3
**When:** Every CI run, scans entire git history
**Config:** `.github/workflows/ci.yml` — Secret Detection job

TruffleHog uses entropy analysis and pattern matching to find secrets. It detects:
- AWS access keys and secret keys
- GitHub personal access tokens
- Google API keys
- Stripe, Twilio, SendGrid API keys
- Generic high-entropy strings that look like passwords or tokens
- Private keys (RSA, EC, PGP)

**Important:** TruffleHog scans every commit in history, not just the current code. A secret committed and deleted is still visible in git history and still a security risk.

**If TruffleHog finds something:**
1. Immediately rotate (change) the exposed credential in whatever service it belongs to
2. Assume it has already been compromised
3. Remove it from git history using BFG Repo Cleaner or `git filter-branch`

---

## Layer 3 — SAST (Static Application Security Testing)

### SonarCloud

**What it analyzes:** JavaScript/Node.js source code
**When:** Every CI run after tests pass
**Config:** `sonar-project.properties`

SonarCloud reads your code without running it and looks for:
- SQL injection vulnerabilities
- Cross-site scripting (XSS) patterns
- Hardcoded credentials
- Insecure cryptography usage
- Missing input validation
- Code quality issues that can lead to bugs

Results appear at: https://sonarcloud.io/project/overview?id=anubhav-singhx_devops-secure-cicd-platform

### CodeQL

**What it analyzes:** JavaScript code flow analysis
**When:** Every CI run (parallel with other jobs)
**Config:** GitHub's default CodeQL action

CodeQL understands code execution flow. It traces user input through your application and finds where it could reach a dangerous function like a database query or file system call. This catches vulnerabilities that pattern-matching tools miss.

Results appear in: GitHub repo → Security tab → Code scanning alerts

---

## Layer 4 — Dependency Scanning

**Tools:** npm audit + Trivy filesystem scan
**When:** Every CI run
**Config:** `.github/workflows/ci.yml` — Dependency Security Scan job

Every npm package your application uses is checked against:
- **NVD (National Vulnerability Database)** — official US government CVE database
- **GitHub Advisory Database** — GitHub's own vulnerability tracking
- **OSV (Open Source Vulnerabilities)** — Google's vulnerability database

**Severity levels:**
- **Critical** — must fix immediately, blocks deployment
- **High** — should fix before production
- **Medium** — fix in next sprint
- **Low** — informational, fix when convenient

**To fix dependency vulnerabilities:**
```bash
cd app/backend
npm audit fix           # fixes automatically where possible
npm audit fix --force   # forces updates (may include breaking changes)
npm audit               # shows what still needs manual attention
```

---

## Layer 5 — Container Scanning (Trivy)

**Tool:** Trivy by Aqua Security
**When:** After Docker images are built in CI
**Config:** `.github/workflows/ci.yml` — Build & Container Security Scan job

Trivy scans inside the Docker image and checks:
- Base OS packages (Alpine, Debian packages)
- Language-specific packages (node_modules inside the image)
- OS configuration issues

**Our Docker images use:**
- Alpine Linux as base (minimal attack surface)
- Non-root user (containers do not run as root)
- Multi-stage builds (development tools not included in final image)
- Pinned base image versions (reproducible builds)

---

## Layer 6 — Infrastructure Security Scanning

**Tool:** Trivy config scanner
**When:** Every CI run
**What it scans:**
- All files in `infra/kubernetes/base/`
- All files in `infra/terraform/`

**What it checks in Kubernetes manifests:**
- Containers running as root
- Missing CPU and memory limits
- Privileged containers
- Containers with host network access

**What it checks in Terraform:**
- Open security groups (0.0.0.0/0)
- Unencrypted storage
- Missing logging configuration
- Public S3 buckets

---

## Layer 7 — DAST (Dynamic Application Security Testing)

**Tool:** OWASP ZAP (Zed Attack Proxy)
**When:** After deployment to staging
**Config:** `security/zap/zap-scan.sh`

Unlike SAST which reads code, ZAP actually attacks the running application. It sends malicious inputs to every endpoint and checks responses.

**What ZAP tests:**
- SQL injection on all form fields and URL parameters
- Cross-site scripting (XSS) in all inputs
- Authentication and session management weaknesses
- Sensitive data exposure in responses
- Security header presence (CSP, HSTS, X-Frame-Options)
- Directory traversal attempts

**Running ZAP locally:**
```bash
./security/zap/zap-scan.sh http://localhost:3000
# Report is saved to security/zap/reports/
```

---

## Kubernetes Security Hardening

The Kubernetes manifests follow security best practices:

**Pod Security:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

**Resource Limits:**
Every container has CPU and memory limits defined. Without limits, one misbehaving pod could consume all cluster resources and starve other pods.

**Secrets Management:**
Sensitive values (database passwords, JWT secrets) are stored as Kubernetes Secrets, not hardcoded in deployment manifests or environment variables in code.
