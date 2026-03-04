#!/bin/bash

set -e

REPORT_DIR="security/reports"
mkdir -p $REPORT_DIR
DATE=$(date +%Y%m%d_%H%M%S)

echo "═══════════════════════════════════════"
echo "  🔍 Trivy Security Scanner"
echo "═══════════════════════════════════════"

echo ""
echo "📂 Scanning source code for vulnerabilities..."
trivy fs . \
  --severity HIGH,CRITICAL \
  --exit-code 0 \
  --format table \
  --ignorefile security/trivy/.trivyignore

trivy fs . \
  --severity HIGH,CRITICAL \
  --exit-code 0 \
  --format json \
  --output "$REPORT_DIR/filesystem-$DATE.json" \
  --ignorefile security/trivy/.trivyignore 2>/dev/null

for image in "task-manager-backend:local" "task-manager-frontend:local"; do
  if docker image inspect $image &>/dev/null 2>&1; then
    echo ""
    echo "🐳 Scanning Docker image: $image..."
    trivy image $image \
      --severity HIGH,CRITICAL \
      --exit-code 0 \
      --format table
  fi
done

echo ""
echo "✅ Scan complete! Reports saved to $REPORT_DIR/"
