# Stack — environments

Measured 2026-10-01/02. **No credential values appear in this document, and none may be added.**

## Hosts

| Host | What it is | Behaviour |
| :--- | :--- | :--- |
| `shop.roryskagenart.com` | **The Vercel Next.js app** — the real storefront | `/` → 307 → `/USD` |
| `roryskagenart-shop.fourthwall.com` | The Fourthwall-hosted storefront | Browsing 302 → `/password`; **`/checkout/` is open** |
| `roryskagenart.com` | Rory's separate studio site | **Do not publish here** |
| `storefront-api.fourthwall.com` | Fourthwall **read** API | |
| `api.fourthwall.com` | Fourthwall **write** API | |

## Projects and accounts

| Thing | Value |
| :--- | :--- |
| Vercel project | `roryskagen-5713/shop-roryskagen-com` (`prj_u3hPHBRFkibIkIkthndzS1sjvhKJ`) |
| Vercel account | `roryskagen`, team `roryskagen-5713` |
| GitHub remote | `roryskagenart/shop.roryskagen.com` — **public** |
| GitHub actor used here | `jadenblack` — pull ✓ push ✓ triage ✓ **admin ✗** |

> ⚠️ The legacy `ventureio/…` Vercel project is **retired**. The migration to `roryskagen-5713` is complete
> and verified — live `/robots.txt` reports `Host: https://shop.roryskagenart.com`, a value only the new
> project has.

> ⚠️ `admin: false` on the GitHub repo **does** block branch protection (needs admin, not `write`), so only
> the owner can add it. Reading is gated too: `GET /branches/main/protection` returns **404** for a
> non-admin, which is *indistinguishable* from "not configured". Read the `protected` boolean from
> `GET /branches/main` instead. **Current state: `main` is UNPROTECTED.**

## DNS

Needs no change, and is already correct: `configuredBy: A`, `aValues: ["64.29.17.65", "216.198.79.65"]`,
`misconfigured: false`.

> ⚠️ A CNAME cannot coexist with an A record on the same name.

## Environment variables

`.env.local` holds **17 keys** = the **15** app vars Vercel production holds + `VERCEL_OIDC_TOKEN` (auto)
+ `VERCEL_PAT_SECRET` (local-only).

### ⚠️ Traps

| Trap | Detail |
| :--- | :--- |
| **`env pull` defaults to `development` only** | Production-only vars stay absent. Use `--environment=production`. |
| **Secret-typed values are dropped by pulls** | `env pull` writes `[SENSITIVE]` for `NEXT_PUBLIC_FW_STOREFRONT_TOKEN`. It is a *publishable* token (shipped in the client bundle by design) — set it by hand. |
| **`env add NAME preview` is interactive** | It prompts `? Git branch?`; a piped value is eaten by the prompt and the call **fails silently**. Pass `--yes` or `--git-branch <NAME>`, and `--type secret` / `--type config`. |
| **Never trust per-call output** | Piping through `tail -1` made a partial run look successful while only 3 of 6 entries existed. **Confirm with `vercel env ls` and count.** |
| **A var's type cannot be changed once set** | `400 "You cannot change the type of a Sensitive Environment Variable."` Preserve the existing type on update. |
| **`vercel link` rewrites `.env.local`** | Only the OIDC entry — but check secrets after every link. |
| **`NEXT_PUBLIC_*` are inlined at build** | An env change requires a redeploy. |

Safe habit: pull to `.env.pull.tmp` (matches the gitignored `.env*` pattern), compare keys, then swap.

### Congruence findings

- **The 7 `NEXT_PUBLIC_*` vars are Production + Preview only**, so a default `env pull` can never surface
  them. That was the congruence gap.
- ⚠️ **`NEXT_PUBLIC_VERCEL_URL` production value is `https://shop.roryskagenart.com`.** Any memory of
  `https://roryskagenshop.vercel.app` is **stale** — writing it would *create* a mismatch. The sitemap
  emits the base URL, so it is a cheap live check.
- ⚠️ **`NEXT_PUBLIC_GTM_ID="GTM-xxxxxxx"` is a placeholder that overrides a working fallback.**
  `lib/analytics.ts:30` is `cleanEnv(process.env.NEXT_PUBLIC_GTM_ID) || 'GTM-PV2BBNN'` — setting the
  placeholder is **worse than unsetting it**.
- **Vars the app reads that exist in neither file** — found by grepping *destructured* `process.env`, which
  a dotted `process.env.X` grep **misses**:
  - `app/layout.tsx:9` destructures `{ TWITTER_CREATOR, TWITTER_SITE, SITE_NAME }`.
  - `SITE_NAME` is also used at `components/icons/logo.tsx:7` and `components/opengraph-image.tsx:11`
    (OG title) — unset ⇒ the OG title and logo aria-label render `undefined`.
  - `NEXT_PUBLIC_FEATURE_BRAND_V1` (`lib/brand-config.ts:51`) defaults **true** when unset; set it in
    **both** places if ever changed.
- `lib/utils.ts:38` `validateEnvironmentVariables()` only checks 3 vars — so **the dev-server log is a
  reliable congruence probe**, and it also runs on `/sitemap.xml`.
- `GITHUB_KEY` is provisioned in Vercel but read nowhere — **dead config**.
- `FOURTHWALL_WEBHOOK_SECRET` is **dead config** — `GET /open-api/v1.0/webhooks` → `{"results":[]}`, so
  nothing invalidates ISR; content refreshes only on the 3600s timer.
- `IMPORT_ADMIN_USER` (`rorystudio`, Config) and `IMPORT_ADMIN_PASSWORD` (Secret) exist in Production,
  Preview and Development. The password is a **temporary credential** — rotate when convenient.

## Agent entry points — how a session actually starts

Measured 2026-10-02 on this machine. This section exists because *"how do I start a session in bash?"* is a
question the files should answer rather than the agent.

| Surface | Starts a WorkBuddy session? | Detail |
| :--- | :--- | :--- |
| **The app UI** | ✅ **This is the only way** | New session from the application window. |
| **Integrated terminal** | ❌ No | It is a terminal *inside* a running session for running commands. It does not launch one. |
| `codebuddy` / `workbuddy` / `wb` CLI | ❌ Does not exist | See the negative probe below. |

**Negative probe (all four return nothing):** `command -v codebuddy` · `codebuddy-code` · `wb` ·
`workbuddy`. The install directory
(`%LOCALAPPDATA%\Programs\WorkBuddyAI\`) contains an **Electron desktop app** (`WorkBuddyAI.exe`,
`app.asar`, `resources/`) with **no CLI entry point**. `resources/scripts/` holds only
`update-progress.ps1` and `launch-update-progress.vbs`; `resources/vendor/` holds the bundled
`PortableGit.zip` / `node.zip` / `python.zip`. There is nothing to invoke from a shell.

**What the bundled runtimes are** (`.workbuddy-ai/binaries/` — these exist to serve the agent's Bash tool,
not to be a CLI): `PortableGit/versions`, `node/versions/22.22.2-3`, `python/versions/3.13.12`.

### ⚠️ A *different* agent CLI is installed, and it does not read this repo's KB

| Probe | Result |
| :--- | :--- |
| `command -v claude` | `~/.local/bin/claude` — **Claude Code `2.0.35`** |
| `claude --help` | Interactive by default; `-p/--print` for non-interactive; `--agents <json>`, `--settings`, `--add-dir` |
| `grep -c "CLAUDE.md" <binary>` | **82** |
| `grep -c "AGENTS.md" <binary>` | **0** |

> ⚠️ **Claude Code reads `CLAUDE.md`, not `AGENTS.md`.** The byte-level probe is decisive: the string
> `AGENTS.md` does not occur in the `2.0.35` binary at all. So a `claude` session opened in this repo would
> **not** see the root [`AGENTS.md`](../../../AGENTS.md) or anything under `docs/agentic/` — the entire KB
> this repo maintains would be invisible to it. The bridge, if it is ever wanted, is a `CLAUDE.md` that
> points at `AGENTS.md` (or a symlink). **Not created** — recorded here so the gap is a known gap rather
> than a surprise.

> ⚠️ **Skill directories do not interoperate either.** WorkBuddy reads `~/.workbuddy-ai/skills/` and
> `<repo>/.workbuddy-ai/skills/`; Claude Code reads `.claude/`. Copying a skill between them is a
> migration, not a move — which is exactly why the ported skills live in
> [`../skills/`](../skills/README.md) as the vendor-neutral copy.

## Deploy paths

| Path | Mechanism |
| :--- | :--- |
| **Push to `main`** | Vercel Git integration — primary, requires approval |
| `npx vercel@59.16.0 deploy --prod` | Vercel CLI — fallback |

> ⚠️⚠️ **The Vercel CLI does not read `.gitignore`.** Measured with `vercel deploy --dry --json`: without
> `.vercelignore` the upload set included `.workbuddy-ai/memory/MEMORY.md`, `.workbuddy-ai/backups/…` and
> `tsconfig.tsbuildinfo`. Vercel honours **only** `.vercelignore` plus its built-in defaults
> (`node_modules`, `.git`, `.gitignore`, `.next`, `.vercel`, `.env*`). **Run `vercel deploy --dry --json`
> and inspect the file list before any local deploy** — it costs nothing and creates no deployment. CI is
> immune (fresh checkout).

> ⚠️ `"Unauthorized user jadenblack"` on a deployment is a **warning, not a block**, while this repo is
> public — all deployments reach READY. Vercel's Hobby rule (the commit author must own the Hobby team)
> applies to **private** repos. **If the repo is ever made private, it becomes a hard block** and only
> `roryskagen`'s commits deploy. A GitHub PAT or plan upgrade does **not** help — the gating plan is
> Vercel's.
