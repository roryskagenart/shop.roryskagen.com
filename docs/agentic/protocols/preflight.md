# Protocol — Session preflight

Run this **before** touching code, and before committing to a multi-step plan. Every item here exists
because skipping it cost a session.

Run it as one command: [`../scripts/preflight.sh`](../scripts/preflight.sh).

---

## 1. Is this checkout actually current?

A stale checkout is the single most expensive failure in this repo's history. It produces plans that
describe work already shipped, and edits applied on top of a tree that does not match `main`.

```bash
git rev-parse HEAD
git fetch --quiet origin
git status --short --branch          # ahead/behind, plus untracked
gh api repos/roryskagenart/shop.roryskagen.com/commits/main --jq .sha
```

> ⚠️ **Do not trust a local ref after `git fetch`.** In sandboxed environments `fetch` has reported
> `9b4eb91..4946546  main -> origin/main` while leaving `origin/main` stale. Compare against the SHA from
> the **API**, and treat `FETCH_HEAD` as authoritative.

## 2. Is the working tree polluted?

`tsconfig.json` is rewritten by Next on **every** dev and build run. `bun install` rewrites
`react`/`react-dom` inside `bun.lock`. Both read as real changes and neither is yours.

```bash
git checkout -- tsconfig.json
git checkout HEAD -- bun.lock        # only if you did not intentionally change deps
```

## 3. Which branch, and can it merge?

A misnamed branch has already cost a session's worth of work here — the edits had to be re-applied on the
correct base. Confirm the branch name matches the repo's conventions *and* that it can actually merge.

```bash
git branch --show-current
git log --oneline main..HEAD
```

## 4. Do the gates pass *before* you change anything?

Establish a green baseline. A red gate you did not cause is information; a red gate you discover after
editing is a mystery.

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
```

Record the exact counts. The baseline is **97 passed / 6 files**. If you see a different number, the
documentation is stale or a test was deleted — **re-derive, never assume.** This repo has documented a
test count of 67 when the real count was 127.

## 5. Is the version number you intend to use already spent?

Check before naming any release. This repo carries **two disagreeing version spaces** — see
[`stack/overview.md`](../stack/overview.md#versions).

```bash
git tag
grep -rn "v[0-9]\+\.[0-9]\+\.[0-9]\+" lib/brand-config.ts docs/releases/plans/ | head -20
```

## 6. Do you have the environment you need?

- `NEXT_IGNORE_INCORRECT_LOCKFILE=1` for any Next command — otherwise Next shells out to `npm` to patch
  `package-lock.json`, which the sandbox blocks (`spawnSync … EBUSY`).
- Fourthwall credentials present in `.env.local`? Names only — **never print values.**
- `gh auth status` and `vercel whoami`. `vercel whoami` can print `Not authorized` for a few seconds after
  login; that is a race, not a failure. Re-run before believing it.

## 7. What must not be touched?

Re-read [`/AGENTS.md`](../../../AGENTS.md#1-non-negotiable). In particular: no deploy, no push without
per-release approval, and no unknown HTTP method against a live resource.

---

## Output

A preflight is done when you can state, in one line each: the HEAD SHA, whether it matches remote, the
gate counts, the branch, and the next free version number. If any answer is "I didn't check", the
preflight is not done.
