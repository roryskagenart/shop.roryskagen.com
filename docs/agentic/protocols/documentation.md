# Protocol — Documentation

Two document types carry weight in this repo: **plans** and **generated docs**. Both have a required
shape, and both are only as good as their evidence.

---

## 1. Plans

**Location:** `docs/releases/plans/<name>_DRAFT.md`
**Status:** opened as a **draft** PR until every open question is answered.

A plan that lives anywhere else is invisible to the repo's conventions and will be missed.

### Required sections

| Section | Contains |
| :--- | :--- |
| What this is / is not | Explicit scope fence. Say what is *out*. |
| Verified starting state | Every claim with a command or `file:line` |
| The product, decomposed | Capabilities, numbered |
| Design decisions | `D1`, `D2`, … each with its rationale |
| Release plan | Gate-by-gate, with the *actual* commands |
| Task inventory | Checkable items |
| Sequencing / critical path | What blocks what |
| Risk register | Risk → mitigation |
| **Do not do yet** | Explicit deferrals |
| **Open questions** | `OQ1…` — **each with a recommendation attached** |
| Release mechanics | Branch, gates, deploy path |
| **Appendix A — Claim → evidence** | Two columns: claim, and the command that proved it |
| **Appendix B — Documentation to update** | Which docs this invalidates, and when |

### The rules that matter

- **An open question without a recommendation is not an open question, it is a stall.** Recommend, then
  wait. Do not decide silently.
- **Every claim in the body appears in Appendix A.** If you cannot fill the evidence column, delete the
  claim.
- **Do not edit `CHANGELOG.md`, a deployment log, or a canonical context file from a plan.** Those change
  when the work executes, not when it is proposed.
- **Match the existing idiom.** Read the plans already in the directory before writing a new one. A plan
  that contradicts an existing plan is worse than no plan — surface the collision instead of smoothing it
  over.

---

## 2. Generated and derived documents

Any document produced by a script — a routes table, an index, a manifest, a file inventory — is a liability
unless its guard can actually fail.

**A `--check` mode that cannot fail is worse than no check**, because it produces a green signal that
nobody re-examines.

Requirements:

1. **The check must be able to fail.** Prove it: introduce the drift deliberately, confirm the check goes
   red, then revert. A guard that has never been observed failing is not a guard.
2. **Do not verify a generated artifact by spawning a child process** if the content can be derived
   in-process — child processes bring environment coupling that makes the check flaky, and a flaky guard
   gets disabled.
3. **A claim/registry file that names an `asserted_by` check must point at a check that exists.**

See the ported procedure in [`../skills/generated-doc-guard-integrity/SKILL.md`](../skills/generated-doc-guard-integrity/SKILL.md).

---

## 3. House style

- **Markdown, ATX headings, tables over prose** where a table is clearer.
- **`file:line` for code references**, not "in the config". A reference that cannot be clicked is a
  reference that will rot.
- **⚠️ for a trap, ⚠️⚠️ for a trap that has already caused data loss.** Used consistently across this KB.
- **Date measurements.** "Measured 2026-10-01" — an undated measurement becomes false silently.
- **Quote the command, not the conclusion.** `curl … → 405` beats "the endpoint does not exist".
- **Prettier owns formatting — but it is not a gate here.** `npm run prettier:check` fails on 91 of 103
  tracked files at `HEAD` and is not in CI. Format **only the files you touched**
  (`prettier --write <paths>`); never run a repo-wide `--write` as a drive-by.
  See [`../traps/register.md`](../traps/register.md#t31).

---

## 4. What not to write

- A second copy of a fact that already lives in the KB. Link instead.
- A README that restates the code. Describe intent, invariants, and traps — not the obvious.
- Numbers you did not re-derive. See [`verification.md`](verification.md).
- A "TODO" with no owner and no trigger. Either it is in the plan's task inventory or it is not real.

---

## 5. Redaction — this repository is public

**Rule: before committing anything derived from a shell session or a machine-wide tool, redact.** This repo
is public, so "it was in the terminal output" is not a reason to publish it.

### What to remove

| Remove | Keep |
| :--- | :--- |
| **Client and project names** belonging to any other project | **Public infrastructure names** — GitHub, Supabase, Fourthwall, Git for Windows. Naming a public SaaS is not client data, and runnable examples need real tool names. |
| **Internal host names** and sibling directory names that carry a client's name | Public package names (`@supabase/mcp-server-supabase`) |
| **Release versions** belonging to other projects | This project's own versions |
| **Machine account names** and absolute home paths — write `~/.local/bin/x`, never `/c/Users/<account>/…` | `<user>`, `$USER`, `~` placeholders |

### Why absolute paths are the leak you will actually make

Copy-pasting a measured path out of a terminal is how an account name escapes, because the measurement is
honest and the paste is mechanical. It happened here — three files in one session, caught only by a later
audit. **Habit:** when quoting shell output, rewrite the home prefix to `~` *at the moment you paste it*.

Sweep before pushing any doc that quotes shell output:

```bash
git grep -nIE "(C:\\\\Users|/c/Users/|/Users/[a-z])" -- docs/ AGENTS.md
git grep -nIE "(ghp_|github_pat_|sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY)" -- .
```

### ⚠️ Redacting the tip does not clean the history

Editing a file removes the terms from the **current** tree only. Every commit that ever contained them still
has them, and `git log -p` is public. Check which commits are affected:

```bash
# grep -q, not grep -c: -c exits 1 on a zero count and silently breaks a && chain.
for c in $(git rev-list <base>..HEAD); do
  git show "$c" --format="" -U0 | grep -qIE "<term>" && git log -1 --format='%h %s' "$c"
done
```

**The cheap fix, while the branch is still unmerged: squash-merge.** A squash collapses the branch into one
commit whose diff is the **net** change — which, if the tip is already redacted, is clean. Verify before
merging:

```bash
git diff <base>..HEAD | grep -cIE "<term>"   # 0 means the squash lands clean
```

Once merged, the only options are history rewriting on a shared branch or accepting the exposure. **Decide
before merging, not after.**

### The redaction tool is not committed

A script that removes named terms must contain them, so committing it reinstates the leak. Keep it outside
the tracked tree (`.workbuddy-ai/scripts/`), make it idempotent, and let the commit message be the record.
**Commit messages are public too** — describe the redaction without repeating the terms.
