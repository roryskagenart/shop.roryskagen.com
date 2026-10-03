# AGENTS.md

Agent contract for **`shop.roryskagenart.com`** — the Rory Skagen Art Store: a Next.js 15 / React 19
storefront over a Fourthwall catalogue, deployed on Vercel.

This file is the entry point. It is deliberately short: the rules you must not get wrong are here, and
everything else is in the maintained knowledge base at **[`docs/agentic/`](docs/agentic/README.md)**.

Applies to every agent, in any tool. Nested `AGENTS.md` files add scope-specific rules and win over this
one inside their directory.

---

## 1. Non-negotiable

| # | Rule |
| :-- | :--- |
| 1 | **Do not deploy.** No `vercel deploy`, no `--prod`, no promote. |
| 2 | **Do not push without explicit per-release approval.** `main` is git-connected to Vercel: a push *is* a production deploy. |
| 3 | **Do not publish to `roryskagenart.com`** — that is Rory's separate studio site. |
| 4 | **Do not repoint the git remote at a different repository.** `origin` is the GitHub remote only — never the Vercel project, the custom domain, or the studio site. **Do not recreate the deleted GitHub Actions deploy workflow.** |
| 5 | **Never probe an unknown HTTP method against a live resource.** A `DELETE` sent to a real product id to "test for an update endpoint" soft-deleted that product. Probe a scratch record or read the docs. |
| 6 | **Never commit a secret.** `.env.local` holds live credentials; `.env*` is gitignored. Copy variable *names*, never values. |

## 2. Read this before you name anything

The same project answers to four different names. **Never infer one from another.**

| Thing | Value |
| :--- | :--- |
| Local folder | `shop.roryskagenart.com` |
| Vercel project | `https://vercel.com/roryskagenart/shop.roryskagenart.com` |
| Fourthwall project | `https://roryskagenart-shop.fourthwall.com` |
| Custom domain | `https://shop.roryskagenart.com` |
| **GitHub remote** | **`roryskagenart/shop.roryskagenart.com`** ← matches the folder name |

> ⚠️ **The local remote URL is stale.** `git remote -v` still reports
> `https://github.com/roryskagenart/shop.roryskagen.com.git` — the repo's *previous* name. GitHub
> redirects renamed repos, so fetch/push still resolve; **that is not proof the URL is right.** Treat
> `git remote -v` as untrusted for identity and use this table. Fixing the URL is a human decision
> (rule 4).

Releases: `git tag` shows **only `v0.1.0`**; `lib/brand-config.ts` calls `v1.1.0` "Current Release" and the
current plan uses `v0.2.0`. Pick one scheme explicitly before naming anything → T24.

## 3. Dev environment and gates

**npm**, not pnpm or bun: `.npmrc` sets `legacy-peer-deps=true` and CI depends on it. `bun.lock` and the
README's `pnpm install` are template leftovers. Node `>=20` (`engines`).

```bash
npm ci                                          # foreground — never a background install after a wipe
npm run dev                                     # next dev -p 3000 -H 0.0.0.0
./node_modules/.bin/tsc --noEmit                # npm run lint
./node_modules/.bin/vitest run                  # npm test — baseline: 137 passed / 11 files
bash docs/agentic/scripts/verify.sh             # both gates + counts, read-only
```

CI (`.github/workflows/ci.yml`, the only workflow) runs `npm ci` → `npm run lint` → `npm test`.

> **`vitest` passes where `tsc` fails.** `vitest.config.ts` sets `globals: true` at runtime only, so a test
> that omits its `describe`/`it`/`expect` imports passes vitest and fails `tsc` (`TS2582`).
> `tsconfig.json` also sets `noUncheckedIndexedAccess: true`. → T15

> **`next build` is not a usable gate in this environment.** It stalls with no output and no writes, and
> Next suppresses its progress spinner on a non-TTY pipe — so silence proves nothing. Do not read it as
> success *or* failure. → T16

> **`npm run prettier:check` is advisory and opt-in.** It has never been green (91 of 103 tracked files) and
> is not in CI. `verify.sh` does not run it unless you pass `--format`, because it costs ~4 s — half the
> gate — to re-report a static number. Use `prettier --write <paths>` on files you touched; a repo-wide
> `--write` as a drive-by rewrites most of the tree and buries your change. → T31

Full protocol: [`docs/agentic/protocols/verification.md`](docs/agentic/protocols/verification.md).

## 4. Where to look

| You need | Go to |
| :--- | :--- |
| The rules, in full | [`docs/agentic/README.md`](docs/agentic/README.md) |
| A known trap | [`docs/agentic/traps/register.md`](docs/agentic/traps/register.md) |
| Fourthwall API behaviour | [`docs/agentic/stack/fourthwall.md`](docs/agentic/stack/fourthwall.md) |
| Stack, versions, layout | [`docs/agentic/stack/overview.md`](docs/agentic/stack/overview.md) |
| **How a session starts / what CLIs exist** | [`docs/agentic/stack/environments.md`](docs/agentic/stack/environments.md#agent-entry-points--how-a-session-actually-starts) |
| A repeatable procedure | [`docs/agentic/skills/`](docs/agentic/skills/) |
| Agent extensions & their blast radius | [`docs/agentic/plugins/registry.md`](docs/agentic/plugins/registry.md) |
| What happened in a past session | [`docs/agentic/sessions/`](docs/agentic/sessions/) |
| The current release plan | [`docs/releases/plans/`](docs/releases/plans/) |
| A retrospective / process report | [`docs/reports/`](docs/reports/README.md) — dated, may be superseded, **not** a rule source |

## 5. Conventions

- **Layout.** `lib/fourthwall/` (Storefront API reader) and `lib/fw-seeder/` (Platform API writer) are
  separate on purpose — two hosts, two auth models. `lib/taxonomy.ts` is the **source of truth for the
  nav**, not Fourthwall collections. → T04
- **The two JSON files in `lib/fourthwall/` are fallbacks, not data sources.** They are served with working
  add-to-cart when Fourthwall returns nothing, so a visitor can build a cart for products that do not
  exist. Fix by deleting the fallback, not guarding it. → T01
- **Plans** live at `docs/releases/plans/<name>_DRAFT.md`, open as a draft PR, and cite claims against
  `file:line`. Do not write a plan outside that idiom.
- **Generated or derived documents** must ship with a `--check` mode that can actually fail.
- **Measure, then write.** Every number in a document must be re-derived from a real command. Numbers in
  this repo's docs have drifted before (a documented test count was 67; then 97; the real one is **137 /
  11 files**). If you change the test count, update `docs/agentic/scripts/verify.sh`
  (`BASELINE_TESTS`/`BASELINE_FILES`) and `docs/agentic/stack/overview.md` in the same change — the
  verifier fails loudly otherwise.

## 6. Pitfalls that cost real time

- **Grep `process.env` destructuring, not just `process.env.X`.** `app/layout.tsx:9` destructures
  `{ TWITTER_CREATOR, TWITTER_SITE, SITE_NAME }`; a dotted grep misses them. → T22
- **`NEXT_PUBLIC_GTM_ID="GTM-xxxxxxx"` is worse than unset** — `lib/analytics.ts:30` falls back to a real
  id, so setting the placeholder disables analytics. → T21
- **The Vercel CLI does not read `.gitignore`.** Run `vercel deploy --dry --json` and read the upload set
  before any local deploy. → T17
- **`vercel env add … preview` is interactive**; a piped value is eaten and the call fails silently. Pass
  `--yes`/`--git-branch`/`--type`, then confirm with `vercel env ls` **and count**. → T20
- **Cache-bust Fourthwall reads** — the CDN caches per exact URL, so a stale read looks like a failed
  write. → T11
- **There is no Fourthwall update endpoint.** A correction means archive + recreate, which leaves a
  permanent archived duplicate. Get the create payload right the first time. → T03
- **Do not commit `tsconfig.json`** (Next rewrites it) or an unintended `bun.lock` change.
- Every script in `scripts/` **writes to a live production system.** See [`scripts/AGENTS.md`](scripts/AGENTS.md).

## 7. Agent runtimes (Hermes grounding)

- **Hermes profile `rory`** (`~/.hermes/profiles/rory/config.yaml`) is the runtime this repo is worked
  from. `skills.trusted_project_dirs` and `lsp.trusted_workspaces` already include
  `/home/jadenblack/Desktop/dev.local/roryskagenart/shop.roryskagenart.com`, so repo skills load without a prompt.
- **MCP servers are enabled**: Fourthwall (`mcp.fourthwall.com`), Vercel, and Cloudinary — all OAuth.
  [`docs/agentic/mcp/README.md`](docs/agentic/mcp/README.md) and the "Registered" table in
  [`docs/agentic/plugins/registry.md`](docs/agentic/plugins/registry.md) were corrected on 2026-10-03 to
  match; both previously claimed no MCP server was configured. Rule 5 applies with full force: **the
  Fourthwall MCP can write to production.**
- **Model/provider**: **`gemini-3.5-flash` via `gemini`** (Google AI Studio, free tier), as of 2026-10-03.
  It was `stealth/space-bunny-alpha` via `nous` before. Verified: tool-calling passes, ~88k-token context
  accepted, subagent delegation pinned to `gemini-3.1-flash-lite`. Fallback chain is OpenRouter free
  (`qwen/qwen3.8-27b:free`, `nvidia/nemotron-3-super-120b-a12b:free`) then HuggingFace
  (`Qwen/Qwen2.5-Coder-32B-Instruct`) — all verified working at zero credit.
  ⚠️ Gemini free tier returns **503 "high demand"** under load; that is transient, not a quota verdict.
  Toolsets include `browser`, `terminal`, `delegation`, `kanban`, `memory`, `skills`, `vision`, `web`.
- **Skills are user-scoped, not repo-scoped.** `~/.hermes/profiles/rory/skills/` plus this repo's
  `docs/agentic/skills/`. Copying a skill between runtimes is a migration, not a move.
- **Claude Code does not read `AGENTS.md`** — the string does not occur in its binary. A `claude` session
  in this repo sees neither this file nor `docs/agentic/`. Say so rather than assuming it inherited them.

## 8. Scope map

```
AGENTS.md                      ← you are here
lib/fourthwall/AGENTS.md       Fourthwall integration rules
scripts/AGENTS.md              one-shot script rules (these WRITE to production systems)
docs/agentic/                  the knowledge base
```