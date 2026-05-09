#!/bin/bash
# ============================================================
# Deploy all Supabase Edge Functions
# Usage: bash scripts/deploy-functions.sh
#
# Prerequisites:
#   - Supabase CLI installed (npm i -g supabase)
#   - Logged in: npx supabase login
#   - Project linked: npx supabase link --project-ref <your-project-ref>
# ============================================================

set -e

# All edge functions (excluding _shared which is a helper module, not a function)
FUNCTIONS=(
  "assign-fatwa"
  "bulk-student-update"
  "config-update"
  "evaluate-wazifa"
  "generate-certificate"
  "generate-report"
  "promote-student"
  "publish-fatwa"
  "resend-verification"
  "signup"
)

echo "=========================================="
echo " Deploying Supabase Edge Functions"
echo "=========================================="
echo ""

FAILED=()
SUCCEEDED=()

for fn in "${FUNCTIONS[@]}"; do
  echo "→ Deploying: $fn"
  # signup and resend-verification must skip gateway JWT verification (unauthenticated users call them)
  if [ "$fn" = "signup" ] || [ "$fn" = "resend-verification" ]; then
    DEPLOY_CMD="npx supabase functions deploy $fn --no-verify-jwt"
  else
    DEPLOY_CMD="npx supabase functions deploy $fn"
  fi

  if $DEPLOY_CMD 2>&1; then
    SUCCEEDED+=("$fn")
    echo "  ✓ $fn deployed successfully"
  else
    FAILED+=("$fn")
    echo "  ✗ $fn FAILED"
  fi
  echo ""
done

echo "=========================================="
echo " Deployment Summary"
echo "=========================================="
echo " Succeeded: ${#SUCCEEDED[@]}/${#FUNCTIONS[@]}"
for fn in "${SUCCEEDED[@]}"; do
  echo "   ✓ $fn"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo " Failed: ${#FAILED[@]}/${#FUNCTIONS[@]}"
  for fn in "${FAILED[@]}"; do
    echo "   ✗ $fn"
  done
  echo ""
  exit 1
fi

echo ""
echo " All functions deployed successfully!"
