#!/usr/bin/env bash
#
# Gate sequence — READ ONLY.
#
# Runs both gates and reports EXACT counts. See docs/agentic/protocols/verification.md.
#
# Why both, always:
#   vitest.config.ts sets `globals: true` at RUNTIME ONLY. A test file that uses
#   describe/it/expect without importing them passes vitest and fails tsc (TS2582).
#   Measured: a green vitest run hid 15 tsc errors.
#
# Why not `next build`: it stalls with zero output and zero writes here, and Next
#   suppresses its spinner on a non-TTY pipe - so silence proves nothing. It is not
#   a usable local gate.
#
# Exit code: 0 if every gate passed, 1 otherwise.

set -uo pipefail

BASELINE_TESTS=97
BASELINE_FILES=6
FAILED=0

head_() { printf '\n== %s\n' "$*"; }
ok()    { printf '  ok    %s\n' "$*"; }
bad()   { printf '  FAIL  %s\n' "$*"; FAILED=$((FAILED + 1)); }

# ---------------------------------------------------------------------------
# 0. Toolchain
# ---------------------------------------------------------------------------

head_ "0. Toolchain"

if [ ! -d node_modules ]; then
  bad "node_modules missing - run 'npm ci' (foreground; never a background install after a wipe)"
  exit 1
fi
ok "node_modules present"

TSC=./node_modules/.bin/tsc
VITEST=./node_modules/.bin/vitest

if [ ! -x "$TSC" ]; then bad "$TSC not found"; fi
if [ ! -x "$VITEST" ]; then bad "$VITEST not found"; fi
if [ "$FAILED" -gt 0 ]; then
  printf '\n  Cannot run the gates without the toolchain. Aborting.\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Typecheck  (npm run lint)
# ---------------------------------------------------------------------------

head_ "1. Typecheck - tsc --noEmit"

TSC_OUT=$("$TSC" --noEmit 2>&1)
TSC_RC=$?

if [ "$TSC_RC" -eq 0 ]; then
  ok "0 errors"
else
  bad "tsc reported errors:"
  printf '%s\n' "$TSC_OUT" | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
# 2. Tests  (npm test)
# ---------------------------------------------------------------------------

head_ "2. Tests - vitest run"

VITEST_OUT=$("$VITEST" run 2>&1)
VITEST_RC=$?

# Strip ANSI colour codes first, then match with ERE classes.
# NOTE: grep -E does NOT support \s (that is PCRE) - use [[:space:]].
# A silent parse failure here would report "count differs" on a green run.
CLEAN_OUT=$(printf '%s\n' "$VITEST_OUT" | sed 's/\x1b\[[0-9;]*m//g')

FILES_LINE=$(printf '%s\n' "$CLEAN_OUT" | grep -E '^[[:space:]]*Test Files[[:space:]]' | tail -1 || true)
TESTS_LINE=$(printf '%s\n' "$CLEAN_OUT" | grep -E '^[[:space:]]*Tests[[:space:]]' | tail -1 || true)

printf '  %s\n' "${FILES_LINE:-<could not parse Test Files>}"
printf '  %s\n' "${TESTS_LINE:-<could not parse Tests>}"
printf '  baseline: %s passed / %s files\n' "$BASELINE_TESTS" "$BASELINE_FILES"

if [ "$VITEST_RC" -eq 0 ]; then
  ok "vitest exited 0"
else
  bad "vitest exited $VITEST_RC"
  printf '%s\n' "$VITEST_OUT" | tail -40 | sed 's/^/         /'
fi

# A DROP in the count means a guard was deleted, not that the suite got faster.
if printf '%s' "$TESTS_LINE" | grep -q "${BASELINE_TESTS} passed"; then
  ok "test count matches the baseline"
else
  bad "test count DIFFERS from the baseline ($BASELINE_TESTS) - a DROP means a guard was deleted"
  printf '         Re-derive the number and update the baseline in docs/agentic/stack/overview.md\n'
  printf '         (and AGENTS.md section 3) in the same change.\n'
fi

# ---------------------------------------------------------------------------
# 3. Format (advisory)
# ---------------------------------------------------------------------------

head_ "3. Format - prettier (advisory, BASELINE IS ALREADY DIRTY)"

if [ -x ./node_modules/.bin/prettier ]; then
  # Measured 2026-10-02: 91 of 103 tracked files fail this check at HEAD.
  # `npm run prettier:check` has therefore never been a usable gate in this repo.
  # It is reported here for information only - do NOT treat it as a failure, and
  # do NOT run a repo-wide `prettier --write` as a drive-by (it produces a diff
  # touching most of the tree). See traps/register.md T31.
  if ./node_modules/.bin/prettier --check --ignore-unknown . >/dev/null 2>&1; then
    ok "prettier clean (this would be new - the baseline is 91 failing files)"
  else
    printf '  INFO  prettier reports unformatted files. Baseline at HEAD was 91 of 103 tracked\n'
    printf '        files, so this is pre-existing, not caused by your change. Format only the\n'
    printf '        files you touched: prettier --write <paths>\n'
  fi
else
  printf '  WARN  prettier not installed - skipped\n'
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

head_ "Summary"

if [ "$FAILED" -gt 0 ]; then
  printf '  GATES FAILED (%s). Do not commit, do not push.\n' "$FAILED"
  exit 1
fi

printf '  All gates green.\n'
printf '  Reminder: do not commit tsconfig.json (Next rewrote it) or an unintended bun.lock change.\n'
exit 0
