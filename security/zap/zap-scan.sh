#!/bin/bash

TARGET=${1:-"http://localhost:3000"}
REPORT_DIR="security/reports"
mkdir -p $REPORT_DIR

echo "═══════════════════════════════════════"
echo "  🕷️  OWASP ZAP DAST Scanner"
echo "  Target: $TARGET"
echo "═══════════════════════════════════════"

docker run --rm \
  --network host \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "$TARGET" \
  -r "zap-report-$(date +%Y%m%d).html" \
  -J "zap-report-$(date +%Y%m%d).json" \
  --auto || true

echo ""
echo "✅ ZAP scan complete! Report saved to $REPORT_DIR/"
