# Plugin registry

What agent extensions this project relies on, what each is for, and what it must never be allowed to do.

**The rule that governs everything here:** an extension is a capability, and capabilities that can write
to production are dangerous. This registry records the **blast radius** of each one, not just its name.

---

## Registered

| Extension | Kind | Purpose here | Blast radius |
| :--- | :--- | :--- | :--- |
| **GitHub connector** | Connector | Read issues, PRs, checks and commit statuses for `roryskagenart/shop.roryskagen.com`. | **Read-only in practice.** The underlying actor (`jadenblack`) has push, but this project's rule is that pushes require explicit per-release approval. |
| **Vercel CLI** | CLI (not a plugin) | `env ls` / `env pull`, `deploy --dry --json`, `whoami`, `link`. | ⚠️ **`deploy` publishes production.** Only ever run with `--dry` unless a human approved a deploy. |
| **`gh` CLI** | CLI (not a plugin) | Repo, PR, secret and variable operations. | ⚠️ `gh secret set` / `gh variable set` succeed here (`admin: false` does not block them). Treat as a write. |

> ⚠️ **`vercel` must never be invoked with `--prod` or as a promote by an agent.** See
> [`/AGENTS.md`](../../../AGENTS.md#1-non-negotiable) rule 1.

## Explicitly absent

| Not installed | Why not |
| :--- | :--- |
| Fourthwall MCP server | None exists. The integration is plain `fetch`/`curl` against the two documented hosts — see [`../stack/fourthwall.md`](../stack/fourthwall.md). |
| Supabase MCP server | Supabase belongs to the **separate Studio site project**, not this shop. Do not conflate them. |
| Any MCP server at all | The runtime's MCP configuration was **empty** at migration time. See [`../mcp/README.md`](../mcp/README.md). |

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
