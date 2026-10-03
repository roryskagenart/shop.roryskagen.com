# Protocol — Verification

**Core rule: run both gates, always, and read the numbers.** Neither gate subsumes the other here, and
`next build` is not a gate at all.

---

## The gates

| Gate | Command | Baseline |
| :--- | :--- | :--- |
| Typecheck | `./node_modules/.bin/tsc --noEmit` (alias `npm run lint`) | 0 errors |
| Tests | `./node_modules/.bin/vitest run` (alias `npm test`) | **137 passed / 11 files** |
| Format | `prettier --check` — **opt-in only**, see below | advisory |
| CI | `.github/workflows/ci.yml` → `npm ci`, lint, test | must be green |

One command: [`../scripts/verify.sh`](../scripts/verify.sh). Measured 2026-10-03: **3.9 s**, down from
8.0 s — it runs typecheck, tests, and the baseline count, nothing else.

### Format is not in the default path

`verify.sh` runs **no** prettier check unless you ask:

```bash
bash docs/agentic/scripts/verify.sh            # typecheck + tests + baseline  (3.9 s)
bash docs/agentic/scripts/verify.sh --format   # also checks formatting        (8.0 s)
```

This is a cost decision, not a correctness one. Prettier over the tree cost **~4 s — half the total gate
runtime** — to re-report a number that has been static since 2026-10-02 (91 of 103 tracked files fail). It
is not in CI, so it cannot fail a build, and its only output was a standing INFO line that nobody acted
on. Check it when you have actually touched formatting; skip it otherwise.

The rule it was documenting still stands: **`prettier --write <paths>` on the files you touched**, never a
repo-wide `--write` as a drive-by. → T31

---

## ⚠️ Trap: `vitest` passes where `tsc` fails

`vitest.config.ts` sets `globals: true` **at runtime only**. A test file that uses `describe` / `it` /
`expect` without importing them therefore runs fine under vitest and fails `tsc` with `TS2582`.

**Measured:** a session shipped a test file that vitest reported green, then `npm run lint` produced 15
errors. The test count went *up* and the build was broken.

`tsconfig.json` also sets **`noUncheckedIndexedAccess: true`**, so `array[0]` is `T | undefined` — a class
of error vitest will never surface.

**⇒ Running only `vitest` is not verification. Running only `tsc` is not verification.**

## ⚠️ Trap: `next build` is not usable here

`next build` stalls with **zero output and zero writes**, and Next suppresses its progress spinner when
stdout is not a TTY. Silence therefore proves neither success nor failure.

- Do not use it as a gate.
- Do not read a quiet build as passing.
- If a task genuinely needs a production build, do it in CI (a fresh checkout, a real TTY-less runner that
  is known to work) — not locally.

## Counts move — re-derive them

Documented test counts in this repo have been wrong repeatedly (67 vs 127; 97 vs 137; 151 vs 152). **A
count is a measurement, not a constant.** When the denominator changes, every "N of M" claim elsewhere in
the docs needs re-checking.

This happened for real: `verify.sh` carried `BASELINE_TESTS=97` while the suite ran 137, so **the gate
failed on a clean tree** and the failure text ("a DROP means a guard was deleted") pointed at the opposite
of the truth. Baseline re-derived and fixed 2026-10-03.

Corollary: a **drop** in the test count means a guard was deleted, not that the suite got faster. Treat it
as a failure until proven otherwise — but re-derive first, because a stale baseline looks identical to a
deleted guard from the failure message alone.

---

## Verify against reality, not against a log

The highest-value habit in this repo. A script's own success message is not evidence.

| Instead of | Do |
| :--- | :--- |
| Trusting a seeding script's "created 4 products" | Re-`GET` the products and count them |
| Trusting `curl` output you fetched once | **Cache-bust** with a random query param — the CDN caches per exact URL, so a stale read is indistinguishable from a failed write |
| Trusting a CI badge | Read the commit status for the specific SHA |
| Trusting a plan document's numbers | Re-run the command that produced them |

> ⚠️ **A verification probe must not be able to destroy the thing it verifies.** See
> [`destructive-actions.md`](destructive-actions.md).

## Verification of external state

When a claim depends on a live third-party system, measure it directly and cross-check against the
authoritative docs or a second endpoint before writing it down. Record the **date** of the measurement —
an undated measurement becomes a lie the moment the vendor changes something.

---

## What "verified" means here

You may write "verified" only if you can name the command and its output. Otherwise write "not verified"
and say what would settle it. An honest gap is worth more than a confident guess — this repo's whole
release process is built on that distinction.
