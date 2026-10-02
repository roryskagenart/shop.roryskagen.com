---
name: concurrent-tree-isolation
description: "Detect that another agent or process is editing the SAME working tree as you, and move your session's work onto its own git branch in a separate worktree before it is destroyed. Use when `git status` lists files you never touched, when files you wrote revert or vanish mid-session, when a 2-line edit to a shared file (a test runner, a docs index) silently disappears, when a build+test pair keeps failing on an output directory another process wipes, or when the user says 'checkout and move the files changed in this session', 'put this on its own branch', or 'work asynchronously'."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Isolating Your Work From a Concurrent Editor

**Core rule: a file in a shared working tree is safe because it is COMMITTED, not because it is
written.** An uncommitted edit has no protection against a peer process that resets, stashes or
rewrites the tree — and the loss is silent.

## 1. Detect it — the signals, easiest-to-miss last

| Signal | What it looks like |
|---|---|
| `git status` lists files you never touched | A whole feature appears (`src/admin/DocsPage.tsx`, a new test suite, a new route) |
| Your build+test pair fails on "output not found" | "no compiled stylesheet — run `npm run build` first" right after you built |
| Your file reverts | An edit you made and verified is gone from disk |
| **Your line vanishes from a shared file** | A 2-line wiring edit in a test runner / index dropped when a peer rewrites the file from a buffer that predates your edit |
| The README/status number no longer matches | You did not add checks but the tally moved |

## 2. Confirm it is a peer, not your own sandbox

Before reacting, rule out an artifact of your own environment:

- **Compare mtimes.** A peer's files carry timestamps interleaved with yours, not before them.
- **Check whether the file is tracked.** `git log --oneline -1 -- <path>` empty + file present =
  untracked artifact, not a peer's edit.
- **Check `git status` from the start of your session.** If it was clean then and is not now, the
  change is not yours.
- A stray fixture like `docs/_negctl-script.md` containing `<script>alert(1)</script>` is a
  **negative-control leftover** from a peer's test run, not a real document.

**Do not "fix" the peer's files.** Their failures are theirs; fixing them mid-flight creates a
conflict and hides their bug.

## 3. Isolate — worktree, not branch-switch

A branch in the same tree still shares the working directory, so the peer can still revert you. Use a
**separate worktree**, which also removes build races (`dist/` becomes private).

```bash
# 1. Worktree on a new branch, from the current HEAD
git worktree add -b feat/<name> ../<repo>-<name> HEAD

# 2. Dependencies — a junction costs nothing. Do NOT npm install.
#    PowerShell:
New-Item -ItemType Junction -Path '<worktree>\node_modules' -Target '<main>\node_modules'
```

### Copy the right things

- **Your new files:** copy straight across.
- **Your edits to files nobody else touched:** copy straight across.
- **Files YOU AND THE PEER both edited** (a test runner, a shared index): **do NOT copy the merged
  version.** It may reference the peer's uncommitted modules and will fail to load. Instead, apply
  *your* edit fresh to the worktree's pristine copy.
- **Generated files** (`docs/00-meta/doc-map.md`, a routes reference, a manifest): never copy —
  **regenerate** them in the worktree from the worktree's own tree.

```bash
node scripts/_doc_map.cjs      # or whatever the repo's generators are
```

## 4. Prove it standalone, then commit

```bash
npm test        # ONE command, build + suite. Two commands race against the peer's build.
git add -A
git diff --cached --name-only   # ← MUST be your files only. Read this list.
git commit -F /c/tmp/commit-msg.txt     # ← the /c/ prefix is load-bearing; see below
```

⚠️ **Measure your change set against the BRANCH POINT, never against `main`.** The whole reason you
isolated is that the peer keeps working; when their work lands on `main`, `git diff main` reports
*their* new files as **deletions from your branch** and turns shared files into apparent rewrites.
Measured: `git diff main --shortstat` read **31 files / 2504 ins / 1950 del** where the truth was
**17 / 2407 / 515**.

```bash
BASE=$(git merge-base main HEAD)   # the branch point — stable
git diff "$BASE" --stat            # your change set, and only yours
git diff "$BASE"..main --name-only # the peer's, to compute the overlap
comm -12 <(git diff "$BASE" --name-only | sort) \
         <(git diff "$BASE"..main --name-only | sort)   # ← files that WILL conflict
```

**Report that overlap list.** For each conflicting file decide the resolution *before* merging:
additive files (a test runner's import block) keep both sides; prose (`README`, `CHANGELOG`)
hand-merge; **generated files must be REGENERATED with the peer's generator, never hand-merged** —
if the peer changed the generator itself, a hand-merge silently reverts their fix.

⚠️ **Write the commit message to a file OUTSIDE the repo** and use `git commit -F`. In a worktree
`.git` is a *file*, not a directory, so the usual `.git/COMMIT_MSG.txt` convention does not apply;
and heredocs mangle `\[` and `${}`.

⚠️⚠️ **`/tmp` in git bash is NOT `C:/tmp` — always write the drive-qualified path.** MSYS maps bare
`/tmp` to its OWN temp directory, which is a *different* folder from `C:\tmp`. Measured 2026-09-27:
the file was written to `C:/tmp/commit-msg.txt`, `git commit -F /tmp/commit-msg.txt` read a **stale
file from 22 Sep** sitting in the MSYS temp dir, and the commit landed with the wrong message —
describing a completely unrelated feature — over a correct 11-file change set. Nothing errors; the
only symptom is a commit subject you did not write. **Use `/c/tmp/…` and verify the subject with
`git log -1 --format=%s` immediately after committing.** If the subject is wrong and the commit is
not pushed, `git commit --amend -F /c/tmp/commit-msg.txt` fixes it.

⚠️ **Run the repo's *actual* lint gate, not a path-scoped one — and keep scratch artifacts out of
the tree.** A repo whose `lint` script is a bare `eslint` walks every directory its config does not
ignore. A scratch Vite `cacheDir` (e.g. `.preview-cache/`, created so a preview server does not
touch the shared `node_modules/.vite`) therefore gets linted, `eslint` parses the **bundled vendor
JS** inside it, and reports errors like *"Definition for rule 'jsx-a11y/anchor-has-content' was not
found"* that belong to **no source file in your branch**. `eslint src tests scripts` reads clean the
whole time, so a scoped run hides it.

```bash
npm run lint                      # the real gate — catches the above
npm run lint -- src tests scripts # scoped — will NOT catch it
```

Fix by pointing the scratch `cacheDir` **outside the tree** (`../preview-cache`), then
**`mv` the existing cache out** rather than deleting it — one rename avoids the bulk-delete cap and
keeps the warm cache:

```bash
mv .preview-cache ../preview-cache   # NOT rm -rf: capped per turn, and needless
```

The same principle applies to any generated output a scratch config writes: **never let a scratch
tool place files inside the tree the repo lints or builds.**

⚠️ **If the peer's failures are absent here and yours pass, that is the proof the failures were
theirs.** Report the split by name.

## 5. Remove your work from the shared tree

Only now — the branch is the backup.

- `git checkout -- <your modified files>` (the index equals HEAD if you never staged there).
- `rm` your new files.
- **Surgically** remove your lines from shared files. Never `git checkout --` a file the peer also
  edited — it destroys their work.
- **Regenerate** any generated file whose input you just reverted, or the peer's currency check fails
  because of your revert.

Then confirm the shared tree holds only the peer's files.

## 6. Report the collision explicitly

Tell the user, with evidence: what the peer built, when it appeared, which of your files were
destroyed, and that the branch commit is the only surviving copy. **If the ordering was luck rather
than planning, say so** — it tells them how close the loss came.
