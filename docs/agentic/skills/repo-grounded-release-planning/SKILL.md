---
name: repo-grounded-release-planning
description: "Produce a repo-grounded release roadmap for a feature request — verify every claim against the code, then write the plan document the repo's own conventions expect. Use when the user asks to 'plan a release', 'plan the most basic version for X.Y', 'organize the tasks into a roadmap', 'add a feature program', or hands over a multi-paragraph feature brief that needs to be sequenced across releases. Also use when a plan already exists and a new program needs to slot in beside it — the version-collision check has caught a spent version number every time it has been run. Especially relevant to schema-as-code repos with a /plan directory, a CHANGELOG-driven release process, and static-analysis migration tests."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Repo-Grounded Release Planning

Turn a feature brief into a sequenced release plan that **cannot be wrong about the repo**. The
deliverable is a plan document plus an index row — not code.

**Core rule: the version number is the first thing to verify and the last thing to assume.** In a
repo that plans ahead, the next minor is frequently already spent. Naming a release that another
document owns produces two contradictory plans, and the repo will follow the wrong one.

---

## Phase 0 — Never name a version before checking the version table

1. Read the plan index (`plan/README.md` or equivalent) — it states each document's status and
   usually carries the release assignment inline.
2. **Find the current roadmap's version-mapping section and read it.** Look for a table mapping
   releases to contents, plus a "decisions taken" list and an "open questions" table — a version
   settled in any of the three is spent. Grep for the proposed number across the plan directory and
   the changelog: `grep -rn "v3\.1\.0" plan/ CHANGELOG.md`.

   ⚠️ **Grep the whole tracked tree, not just `plan/`.** A release number is frequently claimed in
   *application code* — a `roadmap` array in a brand/config module, a feature-flag table, a docs
   page. Measured: `git grep -nE "v[0-9]+\.[0-9]+\.[0-9]+"` on a repo with no `/plan` at all found
   `v1.1.0` declared as *"Current Release"* in `lib/brand-config.ts`, mirrored in `lib/docs-content.ts`
   — a second numbering space that no tag backs. That is a collision even though no plan document owns
   it. **Also run `git tag -l` and count.** A tag line with one member (`v0.1.0`) beside a roadmap
   claiming `v1.x` *is* the finding; the recommendation is usually "continue the tag line, relabel the
   other", because a pushed tag cannot be renumbered.

   ⚠️ **The repo may have no plan scaffolding at all.** Do not stall on a missing `plan/README.md`,
   `AGENTS.md`, `CHANGELOG.md` or ADR set. Instead: (a) treat `README.md` as the canonical context file
   if nothing better exists; (b) **find the plan idiom in an unmerged PR** —
   `gh pr list --state all --json number,title,headRefName`, then `gh pr view <n> --json files` and read
   the file off that branch (`gh api .../contents/<path>?ref=<sha>`). Measured: the only plan-document
   precedent lived on an open *draft* PR at `docs/releases/plans/<name>_DRAFT.md`, and that path did not
   exist in the working tree at all. Matching it makes the new document look native; inventing a path
   makes it look foreign.
3. If the number is taken, do **not** silently pick another. Write the collision up as the
   document's first blocking question, with the two candidate mappings side by side and a
   recommendation. Then state the obligation explicitly: *"if the recommendation is accepted,
   `<roadmap>` §X/§Y/§Z must be edited in the same PR — otherwise the repo holds two contradictory
   plans."* An unexecuted plan may be renumbered; a pushed tag may not.
4. **When the decision comes back and you execute the renumber, grep the old number again — and treat
   every hit as a promise you are about to strand.** This is *not* the same grep as step 2. Step 2
   looks for the number as an **assignment** (a release table); this one looks for it as a
   **deadline**. Roadmaps routinely say *"raise X in `<the number>`"* or *"de-bundle Y in
   `<the number>`"*, and those commitments never appear in the version table. **Verify each hit
   against the code rather than trusting the owning phase's status** — a phase recorded as *shipped*
   can still be carrying unshipped promises. Measured: one roadmap promised a pagination default
   raise *"in `v3.1.0`"* plus a bundle de-bundle in an already-shipped phase; neither existed in the
   code (`grep` for the query params → nothing; `grep` for the endpoint → no hits). So the promise
   was **unfulfilled, not merely re-dated**. Re-home each one to a release that will actually happen,
   edit the sentence **where the promise was made**, and add an exit criterion so it cannot be
   forgotten twice.
5. **A renumber is not done when the two main documents agree.** Check the plan index and every
   hand-off / brief document that names the old number — a stale *"▶️ use this to start vX"* prompt
   and a stale status cell are the same contradiction in a third place, and a brief explicitly
   invites a fresh session to act on it. A short header marker (*"✅ SPENT — vX shipped"*) plus a
   status flip is enough; do **not** rewrite the historical document's body.

## Phase 1 — Ground the plan in verified state

Read in this order, and read the real files rather than trusting any summary:

| # | Read | Why |
| :--- | :--- | :--- |
| 1 | `AGENTS.md` (or the repo's equivalent canonical context file) | Stack, schema, write path, guardrails. It **wins** over any spec |
| 2 | the plan index | Which specs are implemented / superseded / proposed |
| 3 | the current roadmap | Phase structure, risk register, open questions, release mechanics |
| 4 | the ADRs | The sequencing constraints the plan must not contradict |
| 5 | the actual subsystem | The nav file, the route module, the migration set, the footer — see below |

Then read the specific surfaces the feature touches. For a feature that adds **admin UI, an API
route and a table**, that means: the nav definition (does it carry role gating and a badge hook
already?), the router mount point, one existing route of the same shape, the middleware guards, the
role vocabulary module, the newest migration of the same kind, and the static-analysis test over
the migration set.

## Phase 2 — The obligation checklist (the part that gets skipped)

Each item below has been a shipped defect somewhere. Walk it explicitly and cite the file.

- **Version spent?** → Phase 0.
- **New table ⇒ backup/restore set.** A table created by a migration is **not backed up until
  someone adds it by hand** to the restore plan (table list, restore order, catalog-table subset).
  The dump will look complete while the new table is unrestorable. **Same PR as the migration, never
  a follow-up.** Look for the module the dump builder imports its table list from — one edit there
  usually covers both the CLI writer and any scheduled writer.
- **New table ⇒ the migration static-analysis test.** Read that test and enumerate its invariants in
  the plan, because it is the merge gate. Typical: `IF NOT EXISTS` on the table and every index;
  `DROP … IF EXISTS` before every `CREATE POLICY` / `CREATE TRIGGER`; RLS enabled **only** on a table
  some migration creates; one creator per table; and no policy granting a blanket predicate to the
  authenticated role. Also check the filename-sort ordering constraint against the baseline.
- **New nav item ⇒ guard parity.** A nav entry's minimum role must equal the server guard on the
  matching route, or a read-only account is offered a menu item that answers 403. Look for a comment
  in the nav file documenting the mapping — it exists because this broke before.
- **New route ⇒ the smoke/route-table test.** Many repos assert an explicit list of endpoints. A
  route that is not listed is a route nobody notices is missing. Add every new endpoint.
- **Generated artifact ⇒ a sync test.** If the plan proposes generating a checked-in artifact from
  another file, add a test that regenerates in memory and asserts equality. Otherwise the artifact
  goes stale and the app shows a confident lie. Prefer generate + sync-test over runtime `fs` (a
  packaging risk in a bundled serverless function) and over parsing in the browser (bundle cost).
- **New public write endpoint ⇒ abuse controls.** If a public write endpoint already exists and
  lacks a honeypot/rate limit, do not ship a second unguarded one beside it — fix both with a shared
  helper in the same PR. Note whether each submission spends a paid quota (email, SMS).
- **New table holding third-party data ⇒ no public read policy.** The public write should reach the
  table through the API, which typically uses a connection that bypasses row-level security. State
  that the API is the gate and RLS is defence in depth, and add an explicit "never add a public read
  of this table" to the do-not-do list.
- **A silent idempotent backfill.** `ON CONFLICT DO NOTHING` on a wrong natural key reports success.
  Require the backfill to **print inserted vs skipped** and make the exit criteria assert the count.
- **Which parts are genuinely parallel?** Pure parsers, generators and validation modules can be
  written before the table exists. Say so — it shortens the critical path and it is what makes them
  testable offline.

## Phase 3 — Write the document in the repo's own idiom

Mirror the structure of the roadmap you read in Phase 1. The shape that has been accepted:

```
0. What this document is, and what it is not
1. Verified starting state            ← including any collision, with evidence
2. The product, decomposed            ← a numbered capability list, each mapped to a release
3. Design decisions                   ← each with the alternatives rejected AND why
4. Release-by-release plan            ← per release: explicit NOT-in-scope list, tasks,
                                        exit criteria written as COMMANDS, not prose
5. Task inventory                     ← one table: task, capability, release, blocked-by
6. Sequencing, dependencies, critical path
7. Risk register                      ← ID / risk / impact / mitigation / status
8. Do not do yet                      ← carried forward + new
9. Open questions for the owner       ← each with a recommendation, not just a question
10. Release mechanics                 ← restated, because this is what gets skipped
Appendix A. Claim → evidence          ← one row per non-obvious claim: claim | file:line
Appendix B. Documentation to update   ← document | change | when
```

Three things make the difference between a plan that gets used and one that gets filed:

- **Exit criteria as commands with expected output**, not adjectives. *"`npm test` green"* is not a
  criterion; *"a second `run-migrations` reports nothing pending"* is.
- **An explicit not-in-scope list per release.** It reads as rigour, not as omission, and it is what
  stops scope creep mid-release.
- **A named acceptance test for the whole program.** Say what would prove the thing was worth
  building, and say what to do if it does not happen.

## Phase 4 — Close out

1. Add the document's row to the plan index, with its status, its scope, and the blocking question.
2. Append to the workspace daily memory: the collision, the decisions, and the traps found. Append
   the durable traps (those that will still matter next release) to the long-term project memory.
3. Do **not** edit `CHANGELOG.md`, the deployment log, or the canonical context file for a plan —
   those change when the work executes. The one exception is a stale number you had to verify in
   order to write the plan; propose that as a pre-flight task rather than doing it unasked.
4. ⚠️ **Persist the document before you report it. Do not leave it untracked.** A brand-new plan file
   is the single most fragile artifact in the session — nothing references it, so a stray
   `checkout`/`reset`/`clean` deletes it silently, and the reader may not notice. Open the
   docs-only PR as a **draft** when the document's own gate is still unanswered (that is the honest
   state, and it prevents an accidental merge), and say so in the PR body. Follow the repo's branch
   convention (`docs/…`, `feat/…`, `release/…`) — a `/` in the name is only a hazard for *local* ref
   creation, never for a push by SHA.
5. Verify the pushed change set is **exactly** the paths you intended, against the **base SHA** —
   not against `HEAD`, and never from a bare `git status` (see the phantom-`M` trap below).
6. ⚠️ **An owner's standing "do not push" rule outranks step 4's draft-PR instruction.** Check the
   project memory for one *before* planning the push. Measured: a project carried a standing
   "do NOT deploy; pushing to `main` deploys production automatically" instruction plus "each push
   needs its own explicit approval". The correct behaviour is then to **write the document to the
   working tree, report its path, and ask for the push** — not to open the draft PR unasked. Mitigate
   the untracked-file fragility by saying plainly in your reply that the file is untracked and
   offering to commit it. Never resolve the conflict by pushing and mentioning it afterwards.

---

## Traps learned the hard way

- ⚠️ **A denominator in a doc is a measurement with an expiry date.** A "N of M" claim written when
  a set had 605 members became misleading at 1109 — and it was the very change being planned that
  moved it. Re-verify any fraction after a change that alters the denominator, and prefer a claim
  you just measured.
- ⚠️ **Do not read the canonical context file's numbers as current.** Its header records the release
  it was verified against; if several releases have shipped since, its schema, file and test counts
  are stale. Verify against the tree and propose the repair.
- ⚠️ **Do not build a plan on local git refs.** In some sandboxes refs are pruned and `git log` /
  `git tag` / `origin/main` can be stale or empty while the remote is fine. Verify against an
  explicit SHA or the API.
- ⚠️ **On a stale checkout, `git diff` against HEAD overstates the change set.** Diff against the
  intended base SHA.
- ⚠️ **`git status` can show phantom `M` entries that are pure line-ending churn** — and `git status`
  and `git diff-files` will both report them while `git diff --numstat` reports nothing. Do not
  "fix" them and do not let them into your commit. Settle it by hashing, which is immune to every
  diff heuristic: `git hash-object --path=<f> <f>` (the `--path` applies that path's attributes, i.e.
  normalises CRLF) vs `git rev-parse HEAD:<f>`. `SAME` ⇒ zero content change, provably unstoppable
  from staging. `git update-index --refresh` will not clear them.
- ⚠️ **A CI merge state can read `UNSTABLE` while every check reads `pass`** (the last check finished
  a moment ago). Re-query; it flips to `CLEAN`. A single reading is not evidence.
- ⚠️ **A "do not do yet" section in an existing plan is a boundary, not a suggestion.** If the new
  work falls inside it, say so and justify why the boundary has now expired — do not quietly ignore
  it.
- ⚠️ **Watch for the plausible distractor.** A planning tool, a dashboard or a refactor is often
  proposed while a small, unglamorous, business-visible gap sits open (unpublished content, a
  broken path, an unpublishable backlog). Name that gap in the risk register and give it an owner
  decision, so the new program cannot become the reason it slips.

## When the user's framing conflicts with the repo

The user's instruction outranks an earlier plan — but the conflict must be surfaced, not smoothed
over. Present the trade honestly, recommend one side, write out the other, and mark it as the
blocking owner decision. A plan that quietly renumbers someone else's release is worse than one that
asks.
