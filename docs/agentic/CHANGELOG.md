# Changelog — Agentic Ops KB

All notable changes to this knowledge base. Format follows [Keep a Changelog](https://keepachangelog.com/);
versioning follows the policy in [`README.md`](README.md#4-bump-version-and-write-a-changelogmd-entry).

This file tracks the **KB**, not the application. The application's release record lives in
[`docs/releases/`](../releases/).

---

## [1.3.0] — 2026-10-02

### Added

- **`stack/environments.md` → "Agent entry points — how a session actually starts."** The KB previously had
  no answer to *"how do I start a session?"* — which meant the agent answered it from memory instead of
  from a file. Now measured and written down: **the application UI is the only way to start a WorkBuddy
  session**; the integrated terminal is a command surface *inside* a running session, not a launcher.
- **The bundled-runtime inventory**, so nobody mistakes it for a CLI: `.workbuddy-ai/binaries/` holds
  `PortableGit`, `node/22.22.2-3`, `python/3.13.12` — they serve the agent's Bash tool.

### Changed

- **`skills/windows-app-not-found-diagnose` re-synced to `1.2.0`.** The source skill gained a **Failure D**
  row and a new **Step 0 — "Is there a CLI to find?"**, because that is the failure mode that produces a
  *false statement* rather than a failed command. It now covers: probing a **category** of names before
  asserting a negative about the category; recognising a GUI-only app from its install layout
  (`app.asar`, `resources/vendor/*.zip` = runtimes for the agent's Bash tool, not a user CLI); and the
  byte-level probe (`grep -c "CLAUDE.md" <binary>`) that decides which config files a CLI reads.

  Re-synced by copying the source over the ported copy and running
  [`scripts/normalize-skill-frontmatter.py`](scripts/normalize-skill-frontmatter.py) — **exactly one file
  changed, the other ten reported `unchanged`, and a second run reported `unchanged` too**, which is the
  idempotence the skills contract promises.

### Fixed

- **A false negative published in this repo's own report.** `docs/reports/2026-10-02-agent-usage-insights.md`
  asserted **"No such CLI is installed on this machine."** Re-probing a wider set of names found
  `claude` → **Claude Code `2.0.35`** on PATH. The claim was true about `codebuddy` and false about the
  machine. Corrected in place, and the corrected scope is now *"no WorkBuddy CLI exists here, but Claude
  Code does."* → [T33](traps/register.md#t33)

  The report's Verification-status table gained a third verified row for the probe.

### Documented — a known gap, not a surprise

- **Claude Code reads `CLAUDE.md`, not `AGENTS.md`.** Byte-level probe of the `2.0.35` binary:
  `grep -c "CLAUDE.md"` → **82**, `grep -c "AGENTS.md"` → **0**. A `claude` session opened in this repo
  therefore sees **neither** the root `AGENTS.md` **nor** anything under `docs/agentic/` — the whole KB is
  invisible to it. The bridge would be a one-line `CLAUDE.md` pointing at `AGENTS.md`; **deliberately not
  created**, and recorded so the gap is known.
- **Skill directories do not interoperate.** WorkBuddy reads `~/.workbuddy-ai/skills/` and
  `<repo>/.workbuddy-ai/skills/`; Claude Code reads `.claude/`. Moving a skill between them is a
  migration — which is the reason the ported skills live in `docs/agentic/skills/` as the vendor-neutral
  copy.

---

## [1.2.0] — 2026-10-02

### Fixed

- **A CRLF checkout would break the KB's own shell scripts.** `core.autocrlf = true` and there was **no
  `.gitattributes`**, so git rewrites the working tree to CRLF on checkout. Harmless for TypeScript,
  Markdown and JSON — but fatal for an executable: the shebang becomes `#!/usr/bin/env bash\r` and
  `./preflight.sh` fails with *bad interpreter*.

  Measured scope: `git ls-files --eol` → **107 files `i/lf w/crlf`**, and
  `git check-attr text eol` → **`unspecified`** for the new scripts. → [T32](traps/register.md#t32)

  Fixed with a **narrow** `.gitattributes`: `*.sh` and `*.py` pinned to `eol=lf`. The 107 CRLF files are
  cosmetic and deliberately left alone — repo-wide normalisation (`* text=auto eol=lf`) is a larger
  decision that would touch every file's worktree, and is **not** taken here.

---

## [1.1.0] — 2026-10-02

### Added

- **`docs/reports/` — the dev-report pattern, and its first entry.** A third document type, alongside
  `docs/releases/plans/` (forward-looking) and `docs/agentic/sessions/` (per-day record): a **retrospective
  analysis of how the project is being developed**, aimed at a human reviewing the process rather than an
  agent changing code.
  - [`docs/reports/README.md`](../reports/README.md) — the pattern: naming, five required sections
    (Provenance, Scope, Findings, Recommendations, Verification status), and the rules.
  - [`docs/reports/2026-10-02-agent-usage-insights.md`](../reports/2026-10-02-agent-usage-insights.md) —
    the first entry, converted from a generated HTML usage report.
- **A cross-project rule for reports.** Reports built from machine-wide telemetry describe **other projects
  and other clients**, and this repository is **public**. The pattern requires a report to be either scoped
  to this project or not committed, with the decision recorded either way.

### Changed

- **`/AGENTS.md`** and [`README.md`](README.md) routing tables now point at `docs/reports/`, marked as
  **not a rule source** — a report is dated and may be superseded, so it must never be cited as a rule.

### Notes

- **The first report carries machine-wide data, and it has been redacted** (recommendation R1 in the
  report, resolved 2026-10-02 as option **(b)**). It described an unrelated marketing site, a media/archive
  pipeline, and an unrelated release — none of which is this repository. Client, project, host and release
  names were removed; public infrastructure names were kept so the tooling examples stay runnable. The
  figures remain **machine-wide** and are labelled as such.
- **Two figures in the first report are flagged as unreliable** rather than reproduced as fact: the
  generator's "312 active hours" contradicts its own session-duration data, and most headline numbers are
  the generator's arithmetic, not re-derived. The report marks exactly two figures as verified — this
  repo's own gate baseline and its prettier baseline, both measured locally on 2026-10-02.
- The report's "verification gates" recommendation is **explicitly not adopted verbatim** — it is generic
  and partly wrong here (`next build` is not a usable local gate; `prettier:check` is not a gate at all).
  See [T31](traps/register.md#t31).

---

## [1.0.0] — 2026-10-02

Initial migration. The KB is created and populated from an agent runtime's local memory directory
(`.workbuddy-ai/`), which is gitignored and therefore invisible to collaborators and to review.

### Added

- **`/AGENTS.md`** — root agent contract: the six non-negotiable rules, the four-name collision table, the
  gate commands, and a routing table into this KB.
- **`protocols/`** — `preflight.md`, `verification.md`, `destructive-actions.md`, `release.md`,
  `documentation.md`, `knowledge.md`.
- **`stack/`** — `overview.md`, `environments.md`, `fourthwall.md`, `artwork-catalogue.md`.
- **`traps/register.md`** — the trap register, each entry with the measurement that proved it.
- **`skills/`** — 11 procedures ported from the runtime's skill directory, frontmatter normalised to the
  portable subset (`name`, `description`, `version`) plus provenance (`x-origin`, `x-migrated`).
- **`plugins/registry.md`**, **`mcp/README.md`**, **`mcp/mcp.example.json`** — extension surface, documented
  rather than assumed.
- **`scripts/`** — `preflight.sh`, `verify.sh`, `check-links.py`, `normalize-skill-frontmatter.py`.
- **`sessions/2026-10-01.md`** — distilled record of the first full working day on this repo.

### Changed

- **`.workbuddy-ai/memory/MEMORY.md` reduced 12,730 → 6,008 bytes.** It had exceeded the runtime's
  injection limit and was being silently truncated, which meant the bottom of the file — the release
  record — was never actually read by an agent. It is now a thin index: standing instructions, the name
  collision, access notes, the local verification commands, and pointers here. Domain knowledge moved
  into this KB (canonical) and `.workbuddy-ai/memory/DETAIL.md` (local overflow).

### Not migrated

Deliberate omissions, so the gap is explicit:

| Left behind | Why | Where it stays |
| :--- | :--- | :--- |
| Live credentials (`VERCEL_PAT_SECRET`, `IMPORT_ADMIN_PASSWORD`, Fourthwall API keys) | Secrets never belong in a public repo. The repo is **public**. | `.env.local`, Vercel project env |
| Runtime caches, session transcripts, telemetry | Not knowledge; machine-local and irreproducible. | Runtime storage |
| Third-party marketplace skills (`airbnb`, `obsidian`, `github`, `github-ai-trends`) | Not relevant to this project; they are vendored from a marketplace and are not ours to redistribute. | Runtime skill directory |
| `static-prototype-page-duplication`, `github-docs-mirror-readonly` | No static prototype and no docs-mirror surface exists in this repo. | Runtime skill directory |
| Vendor-specific persona files (`SOUL.md`, `IDENTITY.md`, `USER.md`) | Personal to one operator, not project knowledge. | User home directory |

### Known gaps

- Session history is **incomplete by design**. Only 2026-10-01 has a distilled record; earlier work exists
  only as git history. Future sessions should be appended as they happen rather than reconstructed.
- `mcp/mcp.example.json` is a template. No MCP server is currently configured for this project — the
  runtime's MCP config was empty at migration time.

### Found during the migration

Two things the migration itself surfaced, both recorded as traps:

- **[T31](traps/register.md#t31) — `npm run prettier:check` was never a green gate.** Measured:
  **91 of 103 tracked files fail at `87cf568`**, and the check is not referenced by CI. It had been
  described as a gate in the release protocol. Corrected there, in
  [`stack/overview.md`](stack/overview.md), and in [`protocols/documentation.md`](protocols/documentation.md).
- **`\s` in `grep -E` is a silent failure.** The first version of `verify.sh` used `grep -E '^\s+Tests\s+'`
  to parse the vitest summary. `\s` is PCRE, not ERE, so the match never fired — and because the miss was
  handled, a **fully green test run reported "test count DIFFERS from the baseline"**. Fixed by stripping
  ANSI escapes and using `[[:space:]]`. The failure path was observed failing, so it is known to work.
- **`check-links.py` was added because the KB needed a guard, and it failed on first run.** It found
  **5 missing link targets and 8 broken anchors** in this migration's own output — the `#t01`-style trap
  anchors did not exist as headings, and four `AGENTS.md` links were one directory level short. Fixed, then
  green. A guard that has never been seen failing is not a guard.

### Secret scan

Every file added by this migration was scanned against **all 17 values in `.env.local`** and against
credential patterns (`ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox[baprs]-`, PEM headers). No secret leaked.

Three hits were returned and are **expected**: the values of `NEXT_PUBLIC_FW_API_URL`,
`NEXT_PUBLIC_FW_COLLECTION` and `NEXT_PUBLIC_VERCEL_URL`. `NEXT_PUBLIC_*` variables are **inlined into the
client bundle at build time**, so their values are public by design — they are configuration, not
credentials. The distinction is worth stating because it is exactly the kind of thing that gets
over-corrected later: **do not treat a `NEXT_PUBLIC_*` value as a secret, and do not treat the absence of
one from this repo as a gap.**
