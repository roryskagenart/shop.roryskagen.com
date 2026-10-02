# Protocol — Release

Branch → gates → draft PR → review → merge → tag → deploy. Nothing here is optional, and steps 6 and 7
require a human decision.

---

## 0. Preconditions

- [ ] Preflight done ([`preflight.md`](preflight.md)) — HEAD current, gates green at baseline.
- [ ] The version number is free ([`../stack/overview.md`](../stack/overview.md#versions)).
- [ ] The plan exists at `docs/releases/plans/<name>_DRAFT.md` and is **committed**.
- [ ] **Explicit approval to push.** Never infer it from an earlier "yes".

> ⚠️ **A brand-new plan file is the most fragile artifact in a session.** It is untracked, so a
> `git checkout` or a stray cleanup deletes it silently. Commit it (not push) before doing anything else.

## 1. Branch

Name it for the change: `feat/…`, `fix/…`, `chore/…`, `docs/…`. Confirm it is a name that can actually
merge — a misnamed branch has cost this repo a session of rework.

## 2. Change

Small commits. One concern each. Do not bundle a rename with a behaviour change.

## 3. Gates — before staging

```bash
git checkout -- tsconfig.json          # Next rewrote it; not your change
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
```

Both gates, always — see [`verification.md`](verification.md) for why neither subsumes the other.

> ⚠️ **Do not add `npm run prettier:check` to this list as a gate.** It fails on 91 of 103 tracked files at
> HEAD and is not part of CI — see [`../traps/register.md`](../traps/register.md#t31). Format only the files
> you touched.

**Test counts must not drop.** A drop means a guard was deleted.

## 4. Stage deliberately

```bash
git status --short
git diff --stat                        # and: git diff <base-sha> --stat
```

> ⚠️ On a stale checkout, `git diff` against `HEAD` **massively overstates** the change set — a 4-line edit
> has read as 891 changed lines. Always diff against the **intended base SHA**, and build new file content
> from `git show <base>:<path>` rather than from a working tree that may be stale.

Never stage `tsconfig.json`, `bun.lock` (unless intended), `.env*`, `.workbuddy-ai/`, or
`tsconfig.tsbuildinfo`.

## 5. Draft PR

Open it as a **draft** while any open question is unanswered. That is the honest state, and it prevents an
accidental merge. Link the plan document.

CI must be green on the actual commit — read the check for that SHA, not the branch badge.

## 6. Merge — **requires approval**

Resolve open questions first. The plan's `OQ` table carries a recommendation for each; do not silently
pick a different one.

## 7. Tag and deploy — **requires approval**

- Tag the **merge commit**, not the branch head.
- Deploying is a separate decision from merging. `main` is git-connected to Vercel, so the merge itself may
  already have deployed — check, do not assume.
- Record the release in `docs/agentic/sessions/` and, if a fact is durable, in the KB.

## 8. After

- [ ] Update the KB if the release invalidated anything (a trap fixed, an API behaviour changed).
- [ ] If a trap is now resolved, mark it `RESOLVED` in [`../traps/register.md`](../traps/register.md) — do
      not delete it. A resolved trap is a regression test waiting to be written.

---

## Deploy paths (for reference — neither is agent-initiated)

| Path | Mechanism | Note |
| :--- | :--- | :--- |
| Push to `main` | Vercel Git integration | Primary. Requires approval. |
| `npx vercel@59.16.0 deploy --prod` | Vercel CLI | Fallback. ⚠️ **The CLI does not read `.gitignore`** — run `vercel deploy --dry --json` and inspect the upload set first. |

> ⚠️ `"Unauthorized user jadenblack"` on a deployment is a **warning, not a block**, while this repo is
> **public**. Vercel's Hobby author rule applies to private repos. **If the repo is ever made private, that
> warning becomes a hard block** and only the team owner's commits will deploy.
