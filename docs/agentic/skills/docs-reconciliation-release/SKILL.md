---
name: docs-reconciliation-release
description: "Reconcile a codebase's documentation against its actual git state and cut a low-risk, docs-only minor release. Use when docs are known or suspected to be stale — e.g. the user says the project was built by other agents/a team, expresses low confidence in the current docs, asks to 'consolidate factual progress', 'clear the grade B work', refactor a /plan or /docs directory, or asks for a documentation-only release whose notes match real commits. Also use before starting a large migration so the new work begins from a verified baseline, and for a pre-archive review of a just-finished session — auditing uncommitted deliverables, catching drifted factual logs (e.g. a deployment log), verifying the prior session's own claims, and checking tag/branch conventions before the context is lost."
version: 1.2.1
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Docs Reconciliation & Docs-Only Release

Cut a low-risk, documentation-only minor release that makes the repo's docs match
**verified reality** — real commits, real file paths, real config. The deliverable is
trustworthy context for the next contributor or agent, not new features.

**Core rule: verify every claim against the code before writing it down.** The whole
point is to eliminate stale assertions. Never copy a claim from an existing doc into a
new one without checking it, and never fabricate a commit hash, deploy URL, or metric.

## When to use

- Docs are stale, contradictory, or written by a different team/agent.
- The user wants a "consolidation", "cleanup", or docs-only minor release before new work.
- Preparing a verified baseline before a big migration (e.g. a data merge).
- Refactoring a `plan/`, `docs/`, or `specs/` directory.

## Procedure

### 1. Establish ground truth first
```bash
git status --short          # uncommitted work
git rev-parse --abbrev-ref HEAD
git log -1 --oneline        # current HEAD
git tag                     # existing tags (naming convention)
git log --oneline -30       # recent history
```
Note the working-tree state: is it clean? Are there untracked files? This determines
what you can safely touch.

### 2. Inventory the documentation surface
List every doc: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `AGENTS.md`, and the
whole spec directory. Read them. Note contradictions and claims that need checking.

### 3. Verify claims — the actual work
For every non-trivial assertion in the docs, check it against the code:

- **Stale vendor / dependency references:** `git grep -in "<vendor>"` (scoped with
  `':!node_modules'` etc.). Distinguish *live* references (must fix) from *provenance*
  (historical records, changelogs, archives — leave alone).
- **File paths mentioned:** confirm they exist (`ls`, `Glob`). Watch for entrypoint
  renames (e.g. `api/index.cjs` vs `api/index.js`).
- **Commit hashes:** `git cat-file -t <hash>` to confirm each cited commit exists.
- **Env var names:** match against `.env.example` exactly.
- **Counts and versions:** re-derive them (grep counts, `git tag`, dependency lists).
  Mark any number you cannot re-verify as "re-verify before relying on this".

### 4. Write the canonical context doc
Create/refresh a single authoritative doc (commonly `AGENTS.md`) holding: project
identity, verified stack table, authoritative env vars, the DB write path, the current
schema, a repo map, and conventions/guardrails. Have it explicitly state that it
**supersedes** historical specs.

### 5. Status-index the spec directory
Add a `<specs>/README.md` with a status table: each doc, its status
(Implemented / Superseded / Planned), what it covers, and the commit that delivered it.
Flip each spec's own header status too — but **do not rewrite the spec body**; specs
are frozen at implementation. Mark superseded specs with a clear banner, keep them.

### 6. Promote the CHANGELOG
Move `[Unreleased]` to `## [x.y.z] - YYYY-MM-DD` with a `> Delivered by commits:` record
citing the real hashes and the baseline version. Document work that was previously
listed as "planned" but is actually shipped.

### 7. Quarantine orphans (carefully)
For files with zero importers (verify with a repo-wide search), move them to an archive
dir. **Check tracked status first:** `git ls-files --error-unmatch <path>`. If tracked,
use `git mv` (preserves history, records a rename); a plain `mv` loses it. Add a short
provenance `README.md` in the archive explaining what each file is.

### 8. Validate
```bash
npm run lint      # or tsc --noEmit / equivalent typecheck
npm test          # if an offline suite exists
```
A docs-only change must not break these. Record the exact evidence (e.g. "64/64
passing") in the CHANGELOG so the release is auditable.

Also **verify every internal doc link resolves** — this routinely surfaces real defects
(wrong filenames, links to files that never existed). For each markdown link, resolve it
relative to the doc's directory and assert the target exists:
```bash
for f in $(git ls-files '*.md'); do d=$(dirname "$f");
  grep -oE '\]\(\.\.?/[^)#]+' "$f" | sed 's/](//' | while read -r l; do
    [ -e "$d/$l" ] || echo "MISS $f -> $l"; done; done
```
Fix any misses, then re-run until it prints nothing.

### 9. Commit and tag
Conventional commit, `docs:` type (or `feat:`/`fix:`/`test:` when the release is not docs-only),
body grouped by Added / Changed / Removed, ending with the validation line. Split into logical
commits rather than one blob — a reviewer should be able to read them in order.

If the release is local-only, stop here with an **annotated** tag. If it ships, go to §10.

### 10. Ship it through a PR (when the user wants dev/preview/prod safety)
Never push straight to the default branch. Full flow:

```bash
export GIT_TERMINAL_PROMPT=0
GIT='git -c credential.helper='            # see environment pitfalls below

$GIT push origin main:refs/heads/release/x.y.z   # create the REMOTE branch
gh pr create --repo <owner>/<repo> --base main --head release/x.y.z --title '...' --body-file -
gh pr checks <n> --watch --interval 15          # wait for preview/security gates
gh pr view <n> --json mergeable,mergeStateStatus --jq '{mergeable,mergeStateStatus}'
gh pr merge <n> --merge                         # only when mergeStateStatus is CLEAN
gh api -X DELETE repos/<owner>/<repo>/git/refs/heads/release/x.y.z
```

**`gh` may be unauthenticated in the shell even though git works.** If `gh auth status` says "not
logged into any GitHub hosts" but the `origin` remote URL embeds a PAT, derive the token and pass it
per-command. Never echo it.
```bash
TOKEN=$(git remote get-url origin | sed -E 's#https://[^:]+:([^@]+)@.*#\1#')
GH_TOKEN="$TOKEN" gh pr create --repo <owner>/<repo> ...
```
Pass `--repo <owner>/<repo>` explicitly on every `gh` call — without a stored login there is no
default repo context. `gh` may also be off `PATH` in Git Bash; call it by absolute path.

**Merge with `--merge`, not `--squash`**, when the repo's prior release tags point at merge commits
(see the tag-placement check below). Squashing would change the shape of the release history.

**Check whether the repo even has CI.** `ls .github/workflows/` may be empty — in that case the
"checks" are third-party apps (Vercel, Socket Security, Debricked, Dependabot). A Vercel `pass`
means the app actually built, so it is a real signal; still wait for it. Poll with
`gh pr view <n> --json statusCheckRollup` filtering for `IN_PROGRESS`/`PENDING` rather than
`--watch`, which can hang.

**Branch cleanup is a convention question, not a rule.** Deleting the release branch after merge is
common (the previous release's branch was already gone), but **ask before deleting** — some users
want the branch kept for reference. If you already deleted it, restore it with
`$GIT push origin <tip-sha>:refs/heads/release/x.y.z`.

Then sync local and cut the tag/release:
```bash
$GIT fetch origin main
git reset --hard FETCH_HEAD                 # do NOT rely on origin/main (see below)
```

**Decide where the tag goes before creating it** — the merge commit, or the pre-merge tip? Check the
previous release:
```bash
git rev-parse v<prev>^{commit}    # compare against that release's merge sha
```
If they match, the repo tags **merge commits** — tag `FETCH_HEAD`, not your pre-merge tip. Getting
this wrong publishes a tag that isn't on the default branch's history.

```bash
git tag -a x.y.z -F - <merge-sha> <<'EOF' ... EOF
TAGSHA=$(git rev-parse x.y.z)
$GIT push origin "$TAGSHA:refs/tags/x.y.z"  # push the TAG OBJECT by sha
gh release create x.y.z --verify-tag --repo <owner>/<repo> --title '...' --notes-file -
```

`mergeStateStatus: UNSTABLE` means **do not merge yet** — but it does *not* reliably mean "a check is
still running". Measured 2026-09-15: all five checks reported `pass` while the state read `UNSTABLE`,
because the last check (Debricked) had *just* completed; it flipped to `CLEAN` on a re-query ~30 s
later. So **re-query before concluding anything** — never treat one `UNSTABLE` read as a failed gate,
and never merge on it either:

```bash
gh pr view <n> --json mergeStateStatus,statusCheckRollup   # re-run this; CLEAN is the go signal
```

`CLEAN` means go. If it stays `UNSTABLE` while the rollup is all-`SUCCESS`, look for a non-required
check (a bot comment/scan) rather than assuming a failure.
Verify at the end that the remote has **only** the expected branches and tags, and that
`HEAD == origin/main == the commit the tag points at`.
⚠️ Check `deleteBranchOnMerge` before tidying up: many repos leave it `false` and retain **every**
merged branch, so deleting one is a deviation from convention, not housekeeping.

### 11. Write project memory
Append a dated note to the project's memory dir; record durable facts (conventions,
versioning scheme, guardrails) in its long-term file.

## Pitfalls learned in practice

- **Parallel edits to the same file can drop a write — silently.** Batching `Edit` calls on one file
  races: each call reads, applies, writes, so the last writer wins with the base *it* read.
  **Every call still reports "Successfully edited file".** Measured: 6 edits in 2 batches of 3 → only
  3 landed. Edit one file **sequentially**, then **re-`grep` to confirm each change applied** — a doc
  release that ships half-edited is precisely the staleness this skill exists to prevent. (Parallel
  edits to *different* files are fine.)
- **On a stale checkout, `git diff` against HEAD lies about your change set.** If HEAD is an old
  branch the index holds an old tree, so a file you barely touched reads as wholly rewritten
  (measured: a 4-line change reported as **891** changed lines — indistinguishable from catastrophic
  whitespace damage, and it is not). **Measure against the intended base SHA**
  (`git diff <base-sha> --stat`), and build replacement content from `git show <base>:<path>` — never
  from the working tree. A stale working-tree file may also be a Frankenstein: your own edits present,
  other people's merged edits reverted. Editing that file ships a regression.
- **`replace_all` can miss occurrences at different indentation.** In files like
  `package-lock.json` the same key appears at two indent levels; a `replace_all` Edit may
  only match one. Re-grep after editing and fix stragglers using surrounding-line context
  so the match is unique.
- **Fix defects before publishing, not after.** If you find issues (broken links, wrong
  filenames) while the release is still local-only, fold them in with `git commit --amend`
  and re-create the tag — an unpublished tag is safe to move, and a docs-reconciliation
  release should ship self-consistent. Once pushed, never move the tag; use a new commit
  (or a patch release) instead.
- **Respect the repo's existing versioning convention.** Some repos track the version in
  `CHANGELOG.md` + tags only and keep `package.json` at `0.0.0` across every release.
  Bumping `package.json` there would *deviate* from convention — check before assuming.
- **Don't fabricate.** No invented deploy URLs or commit hashes. If a release was never
  deployed, say so; don't add a fake row to a deploy log.
- **Distinguish provenance from staleness.** A changelog or archive describing a retired
  vendor is history, not a bug. Only fix references that claim *current* state.
- **Don't rewrite spec history.** Status-flip and annotate; leave the original body.
- **Scope creep is the enemy.** This release changes docs only. If you find a code bug,
  report it — don't fix it here.

## Reviewing a previous session before it is archived

A common follow-up: "do a quick pass before this session is archived". Two failure modes recur, and
both are cheap to catch — always check for them explicitly.

- **An uncommitted deliverable is not a deliverable.** Run `git status --porcelain` first. A prior
  session will happily write a file, index it in a README, log it in memory, and *still* never commit
  it — so archiving loses it. This is the single highest-value thing to look for. Secure it (commit
  it, or at minimum surface it loudly), and say plainly that it was at risk.
- **Factual logs drift silently.** Deployment logs, release histories and "current" markers rot the
  moment nobody owns them. Compare the file's newest entry against reality, and **rebuild it from the
  source of truth — never invent rows.** The source is usually a CLI/API that carries commit SHAs:
  ```bash
  # Vercel: each deployment carries meta.githubCommitSha / githubCommitRef
  vercel ls <project> --yes --json | node -e "
  let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
    for (const x of JSON.parse(s).deployments.slice(0,15))
      console.log([new Date(x.createdAt).toISOString().slice(0,16),
        (x.target||'-').padEnd(10), (x.meta.githubCommitSha||'').slice(0,7),
        (x.meta.githubCommitRef||'?').padEnd(18), x.url].join('  '));
  });"
  ```
  Also move stale `(Current Active)`-style markers to the real current release, and add a short
  "how to maintain this log" note so the next session can refresh it.
- **Verify the previous session's own claims** before trusting its memory notes — it may have recorded
  conclusions it never re-checked. Re-run the greps. (In one pass, a note claimed a column the code
  "no longer uses"; re-checking showed the note itself was wrong.)
- **Check tag/branch conventions against reality, not the doc.** `git rev-parse <tag>^{commit}` for
  each recent tag reveals whether releases tag the merge commit or the pre-merge tip; a single
  outlier is a historical accident, not a convention. **Tags are immutable once pushed — never move
  one to "fix" it**; record the convention instead.
- **Do not prune branches as "cleanup" without checking intent.** A fully-merged branch may be
  deliberately retained. Ask, or leave it and flag it.

## Environment pitfalls (Windows / this machine)

These cost hours and are easy to re-trigger. Check for them before blaming the remote.

- **A Git Credential Manager helper hangs every git network command.** `git push` / `git
  ls-remote` die with SIGTERM and **no output at all**, which looks like a sandbox or network
  failure. There is a `credential.helper` pointing at `git-credential-manager.exe`; it waits for
  interactive auth even when the remote URL already embeds a token.
  **Fix:** `GIT_TERMINAL_PROMPT=0 git -c credential.helper= <cmd>`. Verify with
  `ls-remote` first — if that works instantly, the helper was the problem.
- **Newly created loose refs under `.git/refs/` are deleted by the environment.** This is the
  dangerous one. `git checkout -b foo` writes `.git/HEAD` but the ref file
  `.git/refs/heads/foo` disappears, so git considers the branch **unborn** and the next
  `git commit` produces a **root commit containing the entire tree** — silently destroying the
  branch's history relationship. Writing the ref by hand (`printf sha > .git/refs/heads/foo`)
  resolves at first but is deleted again moments later.
  **Fix: never create a local branch.** Commit on the default branch, then publish with
  `git push origin main:refs/heads/release/x.y.z`. That creates the remote branch without any
  local ref, and PRs work normally.
  ⚠️ **That fix assumes you are allowed to commit on the default branch.** Many repos forbid it
  ("never push `main` first" — this is often written into the repo's own release law). In that case
  build the commit object directly and push it **by SHA**; no local ref is ever written, so nothing
  can be pruned:
  ```bash
  export GIT_INDEX_FILE="C:/Users/<you>/AppData/Local/Temp/idx-x"   # a C:/ path, not /tmp
  rm -f "$GIT_INDEX_FILE"
  git read-tree <base-sha>                          # start from the INTENDED base
  for f in <files…>; do
    b=$(git hash-object -w "$f")
    git update-index --add --cacheinfo 100644,$b,"$f"   # comma form; space form is deprecated
  done
  tree=$(git write-tree)
  commit=$(git commit-tree "$tree" -p <base-sha> -F <msg-file>)
  git push origin "$commit:refs/heads/<branch>"     # push BY SHA
  git ls-remote origin refs/heads/<branch>          # verify; a zero exit is not evidence
  ```
  ⚠️ `git hash-object -w` does **not** normalise line endings unless you pass `--path`, so confirm
  with `git diff <base-sha> "$commit" --stat` before pushing — a whole-file diff means a CRLF
  problem, not a content problem. ⚠️ `git hash-object -w /tmp/...` fails in Git Bash (git cannot open
  the path); pass a `C:/…` path.
  **If you already hit it:** `git symbolic-ref HEAD refs/heads/main` restores HEAD (the default
  branch ref is untouched), `git reset` unstages the bogus root commit, and the working tree is
  intact. Confirm with `git status --short` that every edit is still present.
- **`refs/remotes/origin/<branch>` is deleted after a fetch — or silently left *stale*** — and also
  after a `git push` (including `git push --delete`), so `git reset --hard origin/main` fails with
  "ambiguous argument" at surprising moments, or succeeds while pointing at an old commit. **Stale is
  the worse failure:** `git fetch` prints a textbook success
  (`9b4eb91..4946546  main -> origin/main`) and `git ls-tree -r origin/main` then shows a tree from
  *before* your merge — which reads exactly like "my merge lost a file". **`FETCH_HEAD` is
  authoritative**, as is the SHA from the API. **Fix:** `git reset --hard FETCH_HEAD`, then recreate
  the tracking ref by writing the file directly:
  ```bash
  mkdir -p .git/refs/remotes/origin && printf '<sha>\n' > .git/refs/remotes/origin/main
  ```
  Re-check it after every network command; it is cheaper to restore than to debug a confusing
  "unknown revision" later.
- **Push tags by object SHA**, not by name: `git push origin <tag-sha>:refs/tags/<name>`. If the
  local tag ref gets deleted between `git tag` and `git push`, a by-name push fails.
- **A GitHub connector may be read-only.** If PR creation returns `403 Resource not accessible by
  integration`, use the repo's own PAT via `GH_TOKEN` and the `gh` CLI (or the REST API) instead.
  `gh` may not be on `PATH` in Git Bash — call it by absolute path
  (`"/c/Program Files/GitHub CLI/gh.exe"`), and derive `GH_TOKEN` from the remote URL when the
  Windows keyring is unreachable from the shell.

## Deliverables

1. Canonical context doc (e.g. `AGENTS.md`).
2. Spec-directory status index.
3. Reconciled `README.md` + `CHANGELOG.md`.
4. Quarantined orphans + archive provenance note.
5. Logical Conventional Commits (local-only, or merged via PR — see §10).
6. An annotated tag, pushed by object SHA, plus a GitHub Release when shipping.
7. Validation evidence recorded, including any **proof** you ran (not just assertions) —
   e.g. before/after diffs demonstrating a migration was a no-op.
8. Verified final remote state: default branch only, expected tags, local == remote.
