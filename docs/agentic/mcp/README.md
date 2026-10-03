# MCP configuration

Model Context Protocol servers extend an agent with external tools. This directory documents how they are
configured for this project, and — more importantly — **what is not configured, and why.**

---

## Current state

**Three MCP servers are configured on the `rory` Hermes profile** (measured 2026-10-03). This section
previously said no MCP server was configured — that was true at migration time and stopped being true when
the servers below were added. Corrected 2026-10-03.

| Server | Endpoint | Auth | What it can do here |
| :--- | :--- | :--- | :--- |
| **Fourthwall** | `https://mcp.fourthwall.com` | OAuth | Reads the catalogue. **Also writes** — products, collections, variants. |
| **Vercel** | `https://mcp.vercel.com` | OAuth | Project, env vars, deployment status. |
| **Cloudinary** | `https://asset-management.mcp.cloudinary.com/mcp` | OAuth | Image assets: upload, transform, delete. |

Configured in `~/.hermes/profiles/rory/config.yaml` under `mcp_servers`. They are **user-scoped and
machine-local** — not committed here, because they carry OAuth tokens.

> ⚠️ **The Fourthwall MCP can write to production.** Every restriction in
> [`../protocols/destructive-actions.md`](../protocols/destructive-actions.md) and `AGENTS.md` rule 5 applies
> to it with full force. An MCP tool call is not safer than a hand-written `curl` — it is the same production
> write with a friendlier syntax. **Do not use it to probe or delete a live resource.** T02 records what a
> single exploratory `DELETE` cost.

### Effect on the guidance below

Rule 2 ("prefer read-only") and rule 4 ("know the blast radius") are now load-bearing rather than
hypothetical. A server that *can* write to Fourthwall is installed, so scope and discipline are the only
things standing between a tool call and another archived product.

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
