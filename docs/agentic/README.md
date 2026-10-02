# Agentic Ops KB — shop.roryskagenart.com

**Version 1.0.0** · see [`CHANGELOG.md`](CHANGELOG.md) · entry point: [`/AGENTS.md`](../../AGENTS.md)

The durable, versioned, tool-agnostic knowledge base for working on this repository with an AI agent.

It exists because the operational knowledge that made this project work — the API traps, the verification
gates, the release discipline, the reusable procedures — originally lived in agent-runtime-local storage
(a gitignored `.workbuddy-ai/` directory). That made it invisible to collaborators, unreviewable in a PR,
and lossy: it was truncated on injection and rewritten by hand. This directory is the migration target.

> **Nothing here is runtime-specific.** No tool names, no vendor lock-in, no local paths. Everything is
> plain Markdown, shell, and JSON, readable by a human, a CI job, or any agent framework.

---

## Start here

| If you are… | Read |
| :--- | :--- |
| An agent starting a session | [`/AGENTS.md`](../../AGENTS.md) → [`protocols/preflight.md`](protocols/preflight.md) |
| About to change code | [`protocols/verification.md`](protocols/verification.md), then [`traps/register.md`](traps/register.md) |
| About to touch Fourthwall | [`stack/fourthwall.md`](stack/fourthwall.md) — the traps there are all measured, not assumed |
| Cutting a release | [`protocols/release.md`](protocols/release.md) |
| Reviewing someone else's agent session | [`sessions/`](sessions/) |
| Asking *"is the way we work actually working?"* | [`../reports/`](../reports/README.md) — dated reports, **not** a rule source |

---

## Contents

```
docs/agentic/
├── README.md                 this file — index, maintenance contract, versioning
├── VERSION                   KB version (independent of the app's version)
├── CHANGELOG.md              what changed in the KB, and why
├── protocols/                how to work here — the non-negotiable procedures
│   ├── preflight.md          what to establish before touching anything
│   ├── verification.md       the gates, and why they are not interchangeable
│   ├── destructive-actions.md  the rule that a probe must not be able to destroy data
│   ├── release.md            branch → gates → PR → tag → deploy
│   ├── documentation.md      plans, evidence tables, generated docs
│   └── knowledge.md          where a new fact goes, and how it gets retired
├── stack/                    what this system IS
│   ├── overview.md           languages, frameworks, versions, layout
│   ├── environments.md       hosts, Vercel project, DNS, env-var congruence
│   ├── fourthwall.md         the two APIs, the measured surface, the traps
│   └── artwork-catalogue.md  the source-art ceiling that constrains all merch work
├── traps/
│   └── register.md           every trap, with the measurement that proved it
├── skills/                   reusable procedures, ported from the agent runtime
│   ├── README.md             index + the portability contract
│   └── <name>/SKILL.md       one procedure each
├── plugins/
│   └── registry.md           agent extensions this project relies on
├── mcp/
│   ├── README.md             how MCP servers are configured here
│   └── mcp.example.json      template — no credentials, ever
├── scripts/                  runnable, agent-agnostic helpers
│   ├── preflight.sh          session-start checks
│   ├── verify.sh             the gate sequence
│   ├── check-links.py        validates every relative link and #anchor in the repo
│   └── normalize-skill-frontmatter.py
└── sessions/                 distilled session records
    ├── README.md
    └── 2026-10-01.md
```

**Sibling document series — not part of this KB:**

| Directory | Contains |
| :--- | :--- |
| [`../releases/plans/`](../releases/plans/) | Forward-looking release plans (`<name>_DRAFT.md`) |
| [`../reports/`](../reports/README.md) | Retrospective process reports — dated, may be superseded, **never** a rule source |

---

## Maintenance contract

This KB is only worth having if it stays true. Four rules keep it that way.

### 1. A fact belongs in exactly one place

| Kind of fact | Home | Not |
| :--- | :--- | :--- |
| A rule that must never be broken | `/AGENTS.md` | anywhere else |
| A measured behaviour of an external system | `stack/` | a session record |
| A thing that bit us once | `traps/register.md` | prose in a plan |
| A repeatable procedure | `skills/` | a session record |
| What happened on a date | `sessions/` | `stack/` |
| A conclusion about the **process** | [`../reports/`](../reports/README.md) | this KB — reports are dated and may be superseded |

Duplication is the failure mode. If you find the same fact in two places, **delete the weaker copy and
link to the stronger one.**

### 2. Every trap carries its evidence

A trap entry states the claim **and** the command or file that proved it. An unverified trap is worse than
no trap, because someone will act on it. Use the entry format in
[`traps/register.md`](traps/register.md).

### 3. Every trap has an owner and a status

`OPEN` (still true, still bites) / `MITIGATED` (worked around, root cause remains) / `RESOLVED` (fixed —
keep the entry, mark it, and say what fixed it). Retire nothing silently; a resolved trap is a regression
test waiting to be written.

### 4. Bump `VERSION` and write a `CHANGELOG.md` entry

- **MAJOR** — a rule was added or removed in `/AGENTS.md`.
- **MINOR** — a new protocol, stack doc, skill, or trap.
- **PATCH** — corrections, clarifications, link fixes, typo fixes.

The KB version is **independent of the app version**. Do not tie them together.

---

## Provenance

Migrated 2026-10-02 from an agent runtime's local memory directory. Each skill records its origin in
frontmatter (`x-origin`, `x-migrated`). Session records were distilled from raw runtime transcripts; the
originals were not reproducible outside the runtime, which is precisely the problem this KB solves.

Anything the migration could not carry — live credentials, per-machine paths, runtime-only caches — is
listed in [`CHANGELOG.md`](CHANGELOG.md) under "Not migrated", so the gap is explicit rather than implied.
