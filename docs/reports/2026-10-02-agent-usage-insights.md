# Agent usage insights — CodeBuddy Code

**Period covered:** 2026-09-14 → 2026-10-02 · **Report generated:** 2026-10-02

---

## Provenance

| | |
| :--- | :--- |
| Source artifact | `~/.workbuddy-ai/usage-data/report.html` (44,871 bytes) |
| Generator | CodeBuddy Code `/insights` command |
| Converted to Markdown | 2026-10-02, for this report series |
| Original format | HTML with a print stylesheet; no PDF or Markdown export offered |

**Rendering defects in the source, restored here:**

1. The five **feature cards** ("Custom Skills", "Hooks", …) rendered with an empty body. Their
   `why_for_you` and `example_code` content exists in the report's source data and is restored below.
2. The **"Suggested CODEBUDDY.md Additions"** block displayed each entry's *rationale* inside the code
   block, in place of the actual text to paste. Both are restored below.
3. Copy-to-clipboard buttons and checkbox state are HTML affordances with no Markdown equivalent; dropped.

## Scope

- **Covers:** every CodeBuddy Code session recorded on this machine during the period — **48 sessions,
  28,697 messages**.
- ⚠️ **Out of scope for this repository, but present in the source:** the report is generated from
  **machine-wide** telemetry, so it describes work on **other projects and other clients**. Specifically,
  it names an "Indigo / Call Indigo" marketing site, a Supabase-backed media/wayback pipeline, an S2 media
  migration, a `v3.1.0` release, a G4 CI check, and an XSS-payload test suite — **none of which is this
  repository.**
- ⚠️ **This repository is public.** Committing this file publishes those references. **Decision pending** —
  see [Recommendations](#recommendations). This is the first entry in the series and is the reason the
  [report pattern](README.md#-cross-project-data) carries an explicit cross-project rule.

---

## Headline figures

| Metric | Value |
| :--- | :--- |
| Messages | 28,697 |
| Sessions | 48 |
| Active hours *(as labelled by the generator)* | 312 |
| Average session duration | ~142 minutes |
| Peak hour | 11:00 |
| Peak day | 2026-09-15 |
| Current streak | 2 days |
| Longest streak | 5 days |
| Date range | 2026-09-14 → 2026-10-02 |

> ⚠️ **The "312" figure is internally inconsistent and should not be repeated as fact.** The report labels
> it *Active Hours*, its own source field is named `active_days`, and neither reading survives arithmetic:
> 48 sessions × 142 min ≈ **114 hours**, and 312 *days* is impossible inside an 18-day range. Treat it as
> an unverified generator artefact. See [Verification status](#verification-status).

---

## Findings

### 1. What the work was

| Area | Sessions |
| :--- | :--- |
| Indigo marketing site redesign and migration | ~12 |
| Release planning and documentation | ~10 |
| CI, tooling and infrastructure fixes | ~9 |
| Backup, storage and media pipeline | ~8 |
| Release close-out and version management | ~8 |

⚠️ **None of the five areas is this repository.** This is the machine-wide view, not this project's view.

### 2. How the agent is used

- **Long, multi-task runs dominate:** 25 multi-task vs 18 single-task sessions, averaging ~142 minutes.
  Only **one** session in the dataset was a pure quick question.
- **Terminal-native:** 9,614 `Bash` calls — more than 2.5× the next tool (`Edit`, 3,642).
- **Reads more than it writes:** `Read` 2,581 / `Write` 1,175; `Grep` only 214.
- **Scaffolds deliberately:** `TaskCreate` 366 / `TaskUpdate` 504.
- **Outcomes:** mostly achieved 22 · fully achieved 12 · partially achieved 11 · not achieved 2.
- **Helpfulness:** essential 36 · moderately helpful 9 · unhelpful 2.

**Key pattern, as stated by the generator:**

> A verification-first, terminal-native operator who runs long multi-task engineering expeditions where
> real state is measured and proven before any code changes.

### 3. What worked

| Finding | Detail |
| :--- | :--- |
| **Verify claims against reality** | Plans grounded in on-disk measurement, not documentation. Caught stale READMEs, a 127-vs-67 test-count discrepancy, a version collision, and a stale checkout. |
| **Self-correcting pre-flight** | Numerically validated decisions before committing — rendered pixel boxes, colour contrast constraints — and caught its own failing picks. Disproved a suspected config bug rather than "fixing" it. |
| **Recover and hand off session state** | Reconstructed prior context: identified a misnamed unmergeable branch, restored refs its own probes destroyed, re-applied edits on the correct base. |

### 4. Where it went wrong

| Friction category | Generator's examples |
| :--- | :--- |
| **Environment and sandbox interruptions** | A failed background `npm install` after wiping `node_modules`; a blocked install preventing lockfile verification; an OAuth device flow stalled by an empty `APPDATA`. |
| **Stale local state and remote drift** | A misnamed branch that could not merge, forcing three edits to be re-applied; a stale checkout that had not shipped Phase 2; `v3.1.0` merged remotely while local `HEAD` was stale. |
| **Overreliance on shell exploration** | 9,614 `Bash` vs 214 `Grep`. A colour evaluation needed computational rendering because earlier token review would have pre-empted it; a docs/wiki investigation pivoted after a test suite missed 4 of 12 XSS payloads. |

### 5. Top tools and models

| Tool | Calls |
| :--- | ---: |
| Bash | 9,614 |
| Edit | 3,642 |
| Read | 2,581 |
| Write | 1,175 |
| TaskUpdate | 504 |
| TaskCreate | 366 |

| Model | Input tokens |
| :--- | ---: |
| deepseek-v4.1-flash | 973.3M |
| hy4-preview-f | 191.9M |
| balanced-model | 51.6M |
| hy3 | 20.7M |
| default-model | 7.8M |
| primary-model | 0.5M |

---

## Suggested additions to the agent context file

⚠️ **Rendered incorrectly in the source** — the generator printed the *rationale* where the *text to paste*
belongs. Both are given here.

### 1. Verification gates

> **Add:** Always run the full gate sequence before committing or pushing: lint + tests + build + smoke. Do
> not commit with a failing gate. Baseline test counts drift (documented 67 vs actual 127, 151 vs 152, 828
> total) — always re-derive the count from a real run instead of trusting the docs.
>
> **Why:** The agent repeatedly had to re-discover failing gates (missing esbuild dep, `tsc` gate failure,
> vite build guard) and reconcile stale test counts before it could safely commit.
>
> **Placement:** near the top of the context file, under a new `## Verification Gates` section, before any
> workflow instructions.

### 2. Session preflight

> **Add:** Before starting work, verify local `HEAD` is current with origin and that the branch you intend
> to edit is the one that can actually be merged. Check for unmerged branches and version-number collisions
> before reusing a version tag (e.g. `v3.1.0` was already assigned to Phase 5).
>
> **Why:** Multiple sessions opened with a stale checkout, a misnamed unmergeable branch, or a duplicate
> version number — all forcing a re-baseline instead of forward progress.
>
> **Placement:** under `## Session Preflight`, as the first checklist item.

### 3. Memory hygiene

> **Add:** Keep the memory file under the injection size limit (target ~8–9 KB). When consolidating,
> preserve decisions, open items, and verification results; drop superseded narrative. If it exceeds the
> limit, consolidate before starting new work.
>
> **Why:** It repeatedly grew past the injection limit (23 KB → 8.8 KB) and had to be consolidated
> mid-session, blocking the actual task three separate times.
>
> **Placement:** under `## Memory Hygiene`.

### 4. Dependency management

> **Add:** Never wipe `node_modules` followed by a background `npm install`. If a dependency install fails,
> surface the error before retrying, and prefer foreground installs for dependency changes.
>
> **Why:** A background install after a wipe disrupted a session, left background tasks stopped and
> retried, and the work never completed.
>
> **Placement:** under `## Dependency Management`.

### 5. External verification

> **Add:** When verifying external or production state (API counts, storage usage, cron timestamps,
> published numbers), measure it directly and validate against the authoritative source or docs before
> writing plans or committing claims.
>
> **Why:** Sessions succeeded specifically when live state was probed and published figures independently
> validated; failures came from acting on unverified assumptions.
>
> **Placement:** under `## External Verification`.

### 6. Documentation and plans

> **Add:** When building documentation or release plans, match the repo's existing plan idiom and register
> the document in the plan index. Cite every client request string and claim against the actual code.
>
> **Why:** Plan documents were required to be registered and cited; sessions that matched the existing
> idiom completed cleanly, while others needed correction.
>
> **Placement:** under `## Documentation & Plans`.

---

## Features to try

⚠️ **These five cards rendered empty in the source.** Content restored from the report's source data.

### Custom Skills — reusable markdown prompts invoked with a single slash command

**Why for this workflow:** A `gh` reinstall-plus-`PATH`-fix was already turned into a reusable skill by
hand, and the same multi-step close-out (memory consolidation → gates → commit → push) runs nearly every
session. A skill would make both one-command operations.

```bash
mkdir -p .codebuddy/skills/closeout && cat > .codebuddy/skills/closeout/SKILL.md << 'EOF'
---
name: closeout
description: Consolidate MEMORY.md, run all gates, commit and push.
---
1. Consolidate MEMORY.md to <9KB.
2. Run lint, tests, build, smoke; record exact counts.
3. Commit with SHA-based push. Verify remote.
EOF
# then run: /closeout
```

### Hooks — shell commands that auto-run at lifecycle events

**Why:** The most common friction is failing gates (`tsc`, vite build guard, missing esbuild dep)
discovered late. A hook that runs typecheck and tests on file edits catches them immediately instead of at
commit time.

```json
{
  "hooks": {
    "PostToolUse": [
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "npx tsc --noEmit && npm test --silent"}]}
    ]
  }
}
```

### Headless Mode — run the agent non-interactively from scripts and CI

**Why:** Four green gates and a documented baseline get re-verified every session. Headless mode lets CI run
the exact gate sequence and re-derive test counts automatically instead of by hand.

```bash
codebuddy -p "run lint, tests, build and smoke; report exact check counts and any failures" --allowedTools "Bash,Read"
```

### MCP Servers — connect the agent to external tools, databases and APIs

**Why:** Live Supabase (tables, row counts, storage usage), GitHub (issues, milestones, PRs) and Fourthwall
APIs are probed repeatedly. An MCP server for Supabase and GitHub would replace ad-hoc read-only dumps with
structured queries.

```bash
codebuddy mcp add supabase -- npx -y @supabase/mcp-server-supabase --read-only
codebuddy mcp add github -- npx -y @modelcontextprotocol/server-github
```

### Task Agents — spawn focused sub-agents for exploration or parallel work

**Why:** Many sessions are read-only reconnaissance (wayback archives, WP Migrate exports, repo audits)
before writing plans. Delegating that exploration frees the main thread for implementation.

> Use an agent to explore the codebase and report the true test count, open issues, and branch state before
> I write the release plan.

---

## New usage patterns

### 1. Standardize session preflight

**Summary:** Open every session with a fixed preflight — verify `HEAD` vs origin, check for unmerged
branches, re-derive the test count, confirm version-number availability.

**Detail:** At least six sessions were disrupted by a stale checkout, a misnamed unmergeable branch, a
version-number collision (`v3.1.0` already assigned to Phase 5), or a test count that contradicted the docs
(67 vs 127, 151 vs 152). A copyable preflight prompt makes the re-baseline a one-shot instead of an
exploration.

**Prompt:**
> Before we start: show me local vs origin HEAD, list unmerged branches, run the full gate sequence and
> report exact check counts, and confirm the next version number is not already assigned.

### 2. Skill-ify the recurring close-out

**Summary:** Capture the recurring close-out flow (memory consolidation, all gates, SHA-based push, remote
verify) as a `/closeout` skill.

**Detail:** Sessions repeatedly end with the same sequence: consolidate the memory file under the injection
limit, run lint/tests/build/smoke, commit, push by SHA, verify the remote. A skill was already built by hand
for the `gh` reinstall case; the close-out is a stronger candidate because it happens nearly every session
and has strict ordering.

**Prompt:**
> Create a `/closeout` skill that consolidates MEMORY.md to under 9KB, runs lint/tests/build/smoke with
> exact counts, commits, pushes by SHA, and verifies the remote deploy.

### 3. Measure before you claim

**Summary:** When writing plans or reports, probe the live state and validate against authoritative docs
first; never commit a number you have not re-derived.

**Detail:** The best sessions verified live external state (Fourthwall APIs, Supabase usage, cron
timestamps) and caught their own false positives before writing. The worst friction came from acting on
assumptions — suspected config bugs that were actually fine, stale README/PRD claims. Adopting a
measure-then-write rule converts the former from luck into habit.

**Prompt:**
> Before writing the plan, probe the actual live state for every figure I cite, and mark anything you could
> not verify directly.

### 4. Automate gate enforcement with hooks

**Summary:** Add a `PostToolUse` hook that runs typecheck and tests on every edit so gate failures surface
immediately.

**Detail:** The top friction category is buggy code and failing gates discovered late. A hook on
`Edit`/`Write` running `tsc --noEmit` and the test suite turns late discovery into instant feedback.

**Prompt:**
> Add a PostToolUse hook to `.codebuddy/settings.json` that runs `npx tsc --noEmit` and `npm test` after
> every Edit or Write.

---

## On the horizon

### Parallel agents across branches

Spin up 3–5 concurrent subagents, each owning a distinct branch (refactor, docs, tests, release prep) and
iterating until its gate is green before opening a PR. A coordinator merges, resolves conflicts, and re-runs
the full suite — turning 142-minute sessions into minutes of oversight.

> You are the coordinator of a parallel agent squad. Create 4 TaskCreate workstreams on separate git
> worktrees: (1) refactor module X, (2) write missing tests for Y, (3) update docs/CHANGELOG, (4) prep
> release branch. Launch a subagent per workstream that self-iterates with Bash/Edit until
> lint+typecheck+tests pass. Then merge branches in dependency order, resolve conflicts, run the full gate
> suite, and open PRs with summary diffs. Report per-workstream check counts and any blocked items.

### Test-driven autonomous repair loop

When buggy-code friction appears, an agent can reproduce the failure, write a failing test, patch the code,
and loop until the test and full suite are green — no human round-trip.

> Act as an autonomous repair agent. Reproduce the reported bug by running the existing test suite with
> Bash. Write a minimal failing test that captures the defect. Then iteratively Read/Grep/Edit the code
> until that test passes and the entire suite remains green. Cap at 10 iterations; if still failing, dump a
> diagnostic report with the exact failing assertions and suspected root cause. Finish by committing only
> when lint, typecheck, and all tests pass.

### Self-healing repo hygiene autopilot

A background agent continuously audits stale branches, version collisions, missing deps and unreferenced
plans, and opens corrective PRs without being asked.

> Run a repository hygiene audit: (1) detect stale local branches and unmerged work, (2) scan for
> version-number collisions across roadmaps and package.json, (3) verify declared deps resolve, (4) check
> MEMORY.md/doc size limits and flag bloat. For each finding, create a TaskCreate item, then autonomously
> apply the safe fix on a dedicated branch, run lint+typecheck+tests, and open a PR with a before/after
> report. Never touch main directly; surface anything ambiguous as a written decision request.

---

## Notable incident (as told by the generator)

> CodeBuddy's probes accidentally destroyed git refs — then it carefully restored them and confirmed the
> exact same bug happens in stock Git for Windows.
>
> While reproducing a nested-git-ref bug in the wayback pipeline (nested refs with absent parent
> directories fail 40/40, and git deletes the parent directory), the agent's own test probes destroyed the
> refs, so it restored them before continuing. It then proved the system Git for Windows fails identically,
> isolating the upstream mechanism — though cleanup kept getting interrupted by the sandbox.

⚠️ This incident is **not from this repository**, and it is the clearest illustration of why the
[destructive-action protocol](../agentic/protocols/destructive-actions.md) exists: the probe was
destructive, the damage was real, and **nothing threw**.

---

## Recommendations

| # | Action | Why |
| :-- | :--- | :--- |
| R1 | **Decide whether to commit this file.** It names other clients and projects and this repo is public. Options: (a) keep it local and gitignored, (b) commit with the cross-project names removed, (c) commit as-is. | The report pattern's own rule says a report must be scoped or not committed. |
| R2 | **Scope future reports to this repository.** Generate from this project's sessions only, so the series is usable and publishable. | A machine-wide report cannot be a repo artifact. |
| R3 | Adopt the **session preflight** recommendation — it is already implemented, in a form that fits this repo: [`../agentic/scripts/preflight.sh`](../agentic/scripts/preflight.sh). | Recommendation 2 is already satisfied; no new work needed. |
| R4 | Adopt **measure-before-you-claim** as a written rule. | Already encoded in [`../agentic/protocols/verification.md`](../agentic/protocols/verification.md). |
| R5 | **Do not adopt the "verification gates" recommendation verbatim.** This repo's gates are `tsc` + `vitest`; `next build` is not usable locally and `prettier:check` is not a gate at all. | The generator's advice is generic and partly wrong for this repo. See [`../agentic/traps/register.md`](../agentic/traps/register.md#t31). |
| R6 | Treat the **`312` active-hours figure** as unreliable; do not cite it. | It contradicts the generator's own session-duration data. |

---

## Verification status

| Figure | Value | Verified? |
| :--- | :--- | :--- |
| Messages / sessions | 28,697 / 48 | **Reported** by the generator — not re-derived |
| Active hours | 312 | ❌ **Internally inconsistent** — see the note above. Do not cite |
| Average session duration | ~142 min | **Reported** |
| Tool call counts | Bash 9,614 etc. | **Reported** |
| Model token totals | deepseek-v4.1-flash 973.3M in | **Reported** |
| **This repo's own gate baseline** | **`tsc` 0 errors · `vitest` 97 passed / 6 files** | ✅ **Re-derived locally on 2026-10-02** — see [`../agentic/stack/overview.md`](../agentic/stack/overview.md#testing) |
| **This repo's prettier status** | **91 of 103 tracked files fail** | ✅ **Re-derived locally on 2026-10-02** — see [T31](../agentic/traps/register.md#t31) |

> The only two rows marked verified are the ones measured directly against this repository. Everything
> else is the generator's arithmetic, reproduced without independent confirmation.

### Correction — one suggested command is not runnable here

The **Headless Mode** card suggests `codebuddy -p "..."`. **No such CLI is installed on this machine.**
Measured 2026-10-02: `command -v codebuddy` / `codebuddy-code` / `wb` all return nothing, and the install
directory contains an Electron desktop app (`WorkBuddyAI.exe`), not a CLI entry point.

The example is a generic illustration from the generator, not a command verified against this
environment. **Do not paste it and expect it to work.** Treat every `example_code` block in this report the
same way — none was executed.

Also note: **an agent session is started from the application UI, not from a shell.** The integrated
terminal is a terminal inside the app for running commands; it does not start a session. Running the
preflight is therefore something you do *inside* a session — or by asking the agent to run it as its first
action — not a way to begin one.

---

*Source: `CodeBuddy Code Insights`, generated 2026-10-02. Converted to Markdown for the
[dev report pattern](README.md).*
