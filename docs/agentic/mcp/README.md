# MCP configuration

Model Context Protocol servers extend an agent with external tools. This directory documents how they are
configured for this project, and — more importantly — **what is not configured, and why.**

---

## Current state

**No MCP server is configured for this project.** The runtime's MCP configuration was empty at migration
time. This is a deliberate baseline, not an oversight: every server added is a capability with a blast
radius, and none was needed.

The integration work this project does — Fourthwall, Vercel, GitHub — is done with documented HTTP and
first-party CLIs, which are auditable and leave no standing capability behind.

## Where configuration lives

MCP config is **user-scoped and machine-local** — it is not committed here, because it holds credentials
and because it is a per-machine choice. Typical locations:

| Tool | Path |
| :--- | :--- |
| WorkBuddy | `~/.workbuddy-ai/mcp.json` |
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |

This repo carries a **template** — [`mcp.example.json`](mcp.example.json) — showing the shape. **It
contains no credentials and never should.** The repo is **public**.

## Rules

1. **Never commit a real config.** `.env*` is gitignored for a reason. Copy the template, fill it locally.
2. **Prefer read-only.** If a server or token can be scoped read-only, scope it. The two servers most
   tempting here — GitHub and Supabase — both support it.
3. **`env` values reference the environment; they do not embed secrets.** `${VAR}` interpolation is
   supported by most clients. Do not paste a token into a JSON file that might get committed.
4. **Know the blast radius before enabling.** A server that can write to Fourthwall can soft-delete
   products. See [`../protocols/destructive-actions.md`](../protocols/destructive-actions.md).
5. **Record it in [`../plugins/registry.md`](../plugins/registry.md).** An undocumented capability is one
   nobody can reason about.
6. **Do not conflate Supabase projects.** Supabase belongs to the **separate Studio site**, not this shop.
7. **Restart the client after editing.** MCP servers are loaded at startup; a config change is inert until
   then.

## Servers that would genuinely fit this project

Listed for evaluation, **not installed**:

| Candidate | Would replace | Verdict |
| :--- | :--- | :--- |
| GitHub MCP server | Ad-hoc `gh api` calls for PR/issue/check reads | **Plausible.** The GitHub connector already covers most of this read-only. |
| Supabase MCP server | Read-only dumps for the *Studio* project | **Not for this repo.** Different project; would invite conflation. |
| Playwright / browser MCP server | Manual `curl`-with-browser-UA probes | **Plausible.** The password-gate finding was produced by exactly such a probe. |
| Filesystem MCP server | Nothing — the agent already has file access | **No.** Adds a capability without replacing work. |

The bar: it must replace a **recurring** task and be scopeable to read-only. Otherwise the CLI is better.
