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
| 4 | **Do not change the git remote** (`origin` = `roryskagenart/shop.roryskagen.com`) and **do not recreate** the deleted GitHub Actions deploy workflow. |
| 5 | **Never probe an unknown HTTP method against a live resource.** A `DELETE` sent to a real product id to "test for an update endpoint" soft-deleted that product. Probe a scratch record or read the docs. |
| 6 | **Never commit a secret.** `.env.local` holds live credentials; `.env*` is gitignored. Copy variable *names*, never values. |

## 2. Read this before you name anything

The same project answers to four different names. **Never infer one from another.**

| Thing | Value |
| :--- | :--- |
| Local folder | `shop.roryskagenart.com` |
| Vercel project | `roryskagen-5713/shop-roryskagen-com` |
| Custom domain | `https://shop.roryskagenart.com` |
| **GitHub remote** | **`roryskagenart/shop.roryskagen.com`** ← `.com`, **not** `.art.com` |

## 3. Verification gates

CI (`.github/workflows/ci.yml`) runs `npm ci` → `npm run lint` → `npm test`. Locally, **run both of the
first two** — they are not equivalent:

```bash
./node_modules/.bin/tsc --noEmit     # npm run lint
./node_modules/.bin/vitest run       # npm test — baseline: 97 passed / 6 files
```

> **`vitest` passes where `tsc` fails.** `vitest.config.ts` sets `globals: true` at runtime only, so a test
> that omits its `describe`/`it`/`expect` imports passes vitest and fails `tsc` (`TS2582`).
> `tsconfig.json` also sets `noUncheckedIndexedAccess: true`.

> **`next build` is not a usable gate in this environment.** It stalls with no output and no writes, and
> Next suppresses its progress spinner on a non-TTY pipe — so silence proves nothing. Do not read it as
> success *or* failure.

Full protocol: [`docs/agentic/protocols/verification.md`](docs/agentic/protocols/verification.md).

## 4. Where to look

| You need | Go to |
| :--- | :--- |
| The rules, in full | [`docs/agentic/README.md`](docs/agentic/README.md) |
| A known trap | [`docs/agentic/traps/register.md`](docs/agentic/traps/register.md) |
| Fourthwall API behaviour | [`docs/agentic/stack/fourthwall.md`](docs/agentic/stack/fourthwall.md) |
| Stack, versions, environments | [`docs/agentic/stack/`](docs/agentic/stack/) |
| A repeatable procedure | [`docs/agentic/skills/`](docs/agentic/skills/) |
| What happened in a past session | [`docs/agentic/sessions/`](docs/agentic/sessions/) |
| The current release plan | [`docs/releases/plans/`](docs/releases/plans/) |
| A retrospective / process report | [`docs/reports/`](docs/reports/README.md) — dated, may be superseded, **not** a rule source |

## 5. Conventions

- **Plans** live at `docs/releases/plans/<name>_DRAFT.md`, open as a draft PR, and cite claims against
  `file:line`. Do not write a plan outside that idiom.
- **Generated or derived documents** must ship with a `--check` mode that can actually fail.
- **Measure, then write.** Every number in a document must be re-derived from a real command. Numbers in
  this repo's docs have drifted before (a documented test count was 67; the real one was 127).
- **After substantive work**, append to `.workbuddy-ai/memory/YYYY-MM-DD.md` (local, gitignored) and — if
  the fact is durable — to this KB.

## 6. Scope map

```
AGENTS.md                      ← you are here
lib/fourthwall/AGENTS.md       Fourthwall integration rules
scripts/AGENTS.md              one-shot script rules (these WRITE to production systems)
docs/agentic/                  the knowledge base
```
