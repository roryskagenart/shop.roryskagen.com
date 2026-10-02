#!/usr/bin/env bash
#
# Session preflight — READ ONLY.
#
# Reports the state you must establish before touching code, per
# docs/agentic/protocols/preflight.md.
#
# This script deliberately changes nothing. It does not clean the working tree,
# check out files, or reset anything: a polluted tree may contain a real change,
# and discarding it is not this script's call to make.
#
# Exit code: 0 if every check passed, 1 if any check FAILED.
# Warnings do not affect the exit code.

set -uo pipefail

FAILED=0
WARNED=0

ok()   { printf '  ok    %s\n' "$*"; }
warn() { printf '  WARN  %s\n' "$*"; WARNED=$((WARNED + 1)); }
fail() { printf '  FAIL  %s\n' "$*"; FAILED=$((FAILED + 1)); }
head_() { printf '\n== %s\n' "$*"; }

REPO="roryskagenart/shop.roryskagen.com"
EXPECTED_TESTS=97
EXPECTED_FILES=6

head_ "1. Is this checkout current?"

if ! command -v git >/dev/null 2>&1; then
  fail "git not found"
else
  LOCAL_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
  printf '  HEAD       %s\n' "${LOCAL_SHA:-<unknown>}"

  git fetch --quiet origin 2>/dev/null || warn "git fetch failed (offline?)"

  # NOTE: a local ref is NOT authoritative after fetch. Compare against the API SHA below.
  if command -v gh >/dev/null 2>&1; then
    API_SHA=$(gh api "repos/$REPO/commits/main" --jq .sha 2>/dev/null || echo "")
    if [ -n "$API_SHA" ]; then
      printf '  origin/main (API) %s\n' "$API_SHA"
      if [ "$LOCAL_SHA" = "$API_SHA" ]; then
        ok "local HEAD matches remote main"
      else
        warn "local HEAD differs from remote main - re-baseline before planning"
      fi
    else
      warn "could not read remote main SHA (gh not authenticated?)"
    fi
  else
    warn "gh not installed - remote SHA not verified"
  fi
fi

head_ "2. Is the working tree polluted?"

if command -v git >/dev/null 2>&1; then
  # tsconfig.json is rewritten by Next on every dev/build run.
  if ! git diff --quiet -- tsconfig.json 2>/dev/null; then
    warn "tsconfig.json is modified - Next rewrote it; 'git checkout -- tsconfig.json' before staging"
  else
    ok "tsconfig.json clean"
  fi

  # bun install rewrites react/react-dom inside bun.lock.
  if ! git diff --quiet -- bun.lock 2>/dev/null; then
    warn "bun.lock is modified - revert with 'git checkout HEAD -- bun.lock' unless intended"
  else
    ok "bun.lock clean"
  fi

  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
  if [ "${UNTRACKED:-0}" -gt 0 ]; then
    warn "$UNTRACKED untracked file(s) - a new plan document is the most fragile artifact in a session"
    git ls-files --others --exclude-standard 2>/dev/null | sed 's/^/         /'
  else
    ok "no untracked files"
  fi
fi

head_ "3. Which branch, and can it merge?"

if command -v git >/dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "")
  printf '  branch     %s\n' "${BRANCH:-<detached>}"
  if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ]; then
    AHEAD=$(git rev-list --count main..HEAD 2>/dev/null || echo "?")
    printf '  ahead of main by %s commit(s)\n' "$AHEAD"
  fi
  if [ "$BRANCH" = "main" ]; then
    warn "on main - 'main' is git-connected to Vercel; a push IS a production deploy"
  fi
fi

head_ "4. Version numbers - is yours already spent?"

if command -v git >/dev/null 2>&1; then
  TAGS=$(git tag 2>/dev/null | tr '\n' ' ')
  printf '  tags       %s\n' "${TAGS:-<none>}"
fi
printf '  NOTE  two version spaces disagree in this repo:\n'
printf '        lib/brand-config.ts:66-101 calls v1.1.0 "Step 1 (Current Release)"\n'
printf '        but git tag shows only v0.1.0. Check before naming a release.\n'
if command -v grep >/dev/null 2>&1; then
  # grep -c exits 1 on a zero count, which would break an && chain - hence the || true.
  PLANNED=$(grep -rl "v0\.[0-9]\+\.[0-9]\+" docs/releases/plans/ 2>/dev/null | wc -l | tr -d ' ')
  printf '  %s plan document(s) reference a v0.x.y version\n' "${PLANNED:-0}"
fi

head_ "5. Environment"

if [ -f .env.local ]; then
  # Names only. Never print values.
  KEYS=$(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env.local 2>/dev/null | tr -d '=' | wc -l | tr -d ' ')
  ok ".env.local present with ${KEYS:-?} key(s) (values not printed)"
  for k in NEXT_PUBLIC_FW_STOREFRONT_TOKEN FOURTHWALL_API_USERNAME FOURTHWALL_ACCESS_TOKEN; do
    if grep -q "^${k}=" .env.local 2>/dev/null; then
      printf '         %s present\n' "$k"
    else
      printf '         %s ABSENT\n' "$k"
    fi
  done
else
  fail ".env.local not found - Fourthwall probes will fail"
fi

if command -v vercel >/dev/null 2>&1; then
  ok "vercel CLI present (do NOT deploy - see AGENTS.md rule 1)"
else
  warn "vercel CLI not on PATH"
fi

head_ "6. Gates (baseline)"

if [ -x ./node_modules/.bin/tsc ]; then
  if ./node_modules/.bin/tsc --noEmit >/dev/null 2>&1; then
    ok "tsc --noEmit: 0 errors"
  else
    fail "tsc --noEmit reports errors - establish this BEFORE editing"
  fi
else
  warn "node_modules/.bin/tsc not found - run npm ci"
fi

if [ -x ./node_modules/.bin/vitest ]; then
  # Strip ANSI, then match with ERE classes - grep -E does NOT support \s (PCRE only).
  TEST_LINE=$(./node_modules/.bin/vitest run 2>&1 \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^[[:space:]]*Tests[[:space:]]' \
    | tail -1 || true)
  printf '  vitest    %s\n' "${TEST_LINE:-<could not parse>}"
  printf '  expected  %s passed / %s files\n' "$EXPECTED_TESTS" "$EXPECTED_FILES"
  case "$TEST_LINE" in
    *"$EXPECTED_TESTS passed"*) ok "test count matches the documented baseline" ;;
    "") warn "could not read the test count" ;;
    *)  warn "test count DIFFERS from the documented baseline - re-derive it, do not trust the docs" ;;
  esac
else
  warn "node_modules/.bin/vitest not found - run npm ci"
fi

head_ "Summary"
printf '  failures: %s   warnings: %s\n' "$FAILED" "$WARNED"
if [ "$FAILED" -gt 0 ]; then
  printf '  PREFLIGHT FAILED - resolve the FAIL lines before starting.\n'
  exit 1
fi
printf '  Preflight complete. Remember: no deploy, no push without per-release approval.\n'
exit 0
