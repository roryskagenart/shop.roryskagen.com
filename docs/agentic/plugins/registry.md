# Plugin registry

What agent extensions this project relies on, what each is for, and what it must never be allowed to do.

**The rule that governs everything here:** an extension is a capability, and capabilities that can write
to production are dangerous. This registry records the **blast radius** of each one, not just its name.

---

## Registered

| Extension | Kind | Purpose here | Blast radius |
| :--- | :--- | :--- | :--- |
| **Fourthwall MCP** | MCP server (OAuth) | Catalogue reads and writes via `mcp.fourthwall.com`. | ⚠️⚠️ **WRITES PRODUCTION.** Product, collection and variant mutations. Same blast radius as the HTTP API in `scripts/` — see T02. |
| **Vercel MCP** | MCP server (OAuth) | Project info, env vars, deployment status via `mcp.vercel.com`. | ⚠️ Env-var writes affect the deployed app. Deploy/promote remains forbidden — rule 1. |
| **Cloudinary MCP** | MCP server (OAuth) | Image asset upload/transform/delete. | ⚠️ **Deletes are not reversible.** A deleted asset breaks live product imagery. |
| **GitHub connector** | Connector | Read issues, PRs, checks and commit statuses for `roryskagenart/shop.roryskagen.com`. | **Read-only in practice.** The underlying actor (`jadenblack`) has push, but this project's rule is that pushes require explicit per-release approval. |
| **Vercel CLI** | CLI (not a plugin) | `env ls` / `env pull`, `deploy --dry --json`, `whoami`, `link`. | ⚠️ **`deploy` publishes production.** Only ever run with `--dry` unless a human approved a deploy. |
| **`gh` CLI** | CLI (not a plugin) | Repo, PR, secret and variable operations. | ⚠️ `gh secret set` / `gh variable set` succeed here (`admin: false` does not block them). Treat as a write. |

> ⚠️ **`vercel` must never be invoked with `--prod` or as a promote by an agent.** See
> [`/AGENTS.md`](../../../AGENTS.md#1-non-negotiable) rule 1.

## Explicitly absent

| Not installed | Why not |
| :--- | :--- |
| Supabase MCP server | Supabase belongs to the **separate Studio site project**, not this shop. Do not conflate them. |
| GitHub MCP server | `gh` CLI plus the git credential already cover PR/issue/check reads, and the CLI's token scope is visible. A second path to the same data is more surface, not less. |
| Playwright / browser MCP server | The agent already has browser tooling. The password-gate finding was produced by a direct probe. |

> **Superseded 2026-10-03.** This table previously listed "Any MCP server at all" as absent. That is no
> longer true — Fourthwall, Vercel and Cloudinary are configured on the `rory` profile. See
> [`../mcp/README.md`](../mcp/README.md) for the current state and the write-capability warning.

## Adding a plugin

1. **Justify it against a real, recurring need.** A connector that replaces three `curl` calls is worth it;
   one that replaces one is not.
2. **Establish the blast radius.** Can it write? To production? Answer before installing, and record it in
   the table above.
3. **Prefer read-only scopes.** If a token can be scoped read-only, scope it.
4. **Never store credentials in this repo.** The repo is **public**. Credentials live in `.env.local`
   (gitignored) or the Vercel project's environment.
5. **Run the skill-install security audit** before installing any skill or plugin package. If a package
   ships scripts, read them.
6. **Update this file.** An undocumented capability is one nobody can reason about.

## Reviewing

- **Quarterly:** is each entry still used? Remove what is not.
- **On any incident:** if an extension caused it, add the entry to
  [`../traps/register.md`](../traps/register.md) with the evidence.
