# Stack — overview

Measured 2026-10-02 at `87cf568`.

## What this is

A Next.js storefront for **Rory Skagen Art**, sitting over a **Fourthwall** catalogue. The Next.js app is
the real storefront; the Fourthwall-hosted site is a browsing-gated mirror (see
[`fourthwall.md`](fourthwall.md#the-password-gate)).

## Runtime and versions

| Layer | Version | Notes |
| :--- | :--- | :--- |
| Node | `>=20` (`engines`) | CI uses 20 |
| Next.js | `15.6.0-canary.60` | App Router |
| React | `^19.3.0` | |
| TypeScript | `5.5.4` | `strict`, plus **`noUncheckedIndexedAccess: true`** |
| Tailwind CSS | `^3.4.6` | + `@tailwindcss/typography`, `@tailwindcss/container-queries` |
| Vitest | `^4.0.17` | `globals: true` — **runtime only**, see the trap below |
| Prettier | `3.3.3` | ⚠️ **`prettier:check` is not a gate** — see below |
| Docs UI | `fumadocs-core` / `fumadocs-ui` `^16.15.17` | powers `/docs` |
| UI | `@headlessui/react`, `@heroicons/react`, `lucide-react`, `sonner`, `geist` | |
| Scripts | `tsx` | runs the Fourthwall seeding scripts |

> ⚠️ **`npm run prettier:check` fails on 91 of 103 tracked files at `87cf568`** (measured 2026-10-02), so
> it has **never been a green gate here** and is **not** part of CI. Do not treat a failure as your
> regression, and do not run a repo-wide `prettier --write` as a drive-by — it rewrites most of the tree.
> Format only the files you touched. → [`../traps/register.md`](../traps/register.md#t31)

### Package manager

**npm.** `package-lock.json` is the file that actually matches `package.json` (verified with
`npm ci --dry-run`). A `bun.lock` is present and the `README.md` still says `pnpm install` — both are
vestigial from the upstream template. CI follows npm.

`.npmrc` sets `legacy-peer-deps=true`; npm honours it, and CI depends on it.

> ⚠️ `bun install` rewrites `react`/`react-dom` inside `bun.lock`. Revert with `git checkout HEAD -- bun.lock`
> unless the change was intentional.

## Layout

```
app/                        App Router
├── [currency]/             the storefront: page, collections/[handle], product/[handle]
├── collections/[handle]/   legacy redirect surface
├── product/[handle]/       legacy redirect surface
├── pages/[handle]/         CMS-style pages
├── docs/[[...slug]]/       public docs (fumadocs)
├── docs/dev/[[...slug]]/   internal docs
├── import/                 Basic-auth gated import UI
├── api/import/fourthwall/  Basic-auth gated import endpoint
├── api/webhooks/fourthwall/
├── robots.ts, sitemap.ts, opengraph-image.tsx
lib/
├── fourthwall/             the integration — index.ts, merch.ts, importer.ts, reshape.ts, types.ts
│                           + originals-data.json, rory-artworks-data.json
├── taxonomy.ts             ← SOURCE OF TRUTH for the nav
├── brand-config.ts         brand + roadmap version labels
├── docs-content.ts         content for /docs
├── analytics.ts, constants.ts, utils.ts, types.ts
components/                 UI, incl. cart/, grid/, layout/, product/, docs/
scripts/                    one-shot Fourthwall seeding + env migration (these WRITE)
.github/workflows/ci.yml    the only workflow
```

## The two JSON catalogues in `lib/fourthwall/`

| File | Contents | Role |
| :--- | :--- | :--- |
| `rory-artworks-data.json` | 137 artworks (42 Available, 82 Sold, 13 Archived) | The source-art inventory. **All JPEG.** See [`artwork-catalogue.md`](artwork-catalogue.md). |
| `originals-data.json` | The 15 originals shown on the homepage | Local fallback data — **this is the fallback that fabricates purchasable products.** |

> ⚠️ **Both are fallbacks, not data sources.** When Fourthwall returns nothing,
> `getCollectionProducts()` (`lib/fourthwall/index.ts:385-397`) and `getProduct()` (`:451-465`) serve these
> files instead — with working add-to-cart buttons. See [`../traps/register.md`](../traps/register.md#t01).

## Versions

⚠️ **Two version spaces disagree. Reconcile before naming any release.**

| Source | Claims |
| :--- | :--- |
| `lib/brand-config.ts:66-101` | **`v1.1.0` is "Step 1 (Current Release)"**; `v1.2.0`–`v1.5.0` planned |
| `lib/docs-content.ts:1178-1190` | Mirrors the same roadmap |
| `git tag` | **Only `v0.1.0`** |
| `docs/releases/plans/pr-merch-catalog-v0.2.0_DRAFT.md` | Plans the next release as **`v0.2.0`** |

There is no `v1.1.0` tag. `v0.2.0` is the version the current plan uses. **Pick one scheme and say so
explicitly** — do not let a release name drift between them.

## Testing

| | |
| :--- | :--- |
| Test files | **11** |
| Tests | **137 passing** |
| Baseline verified | 2026-10-02, `tsc --noEmit` 0 errors |

Test files:

- `lib/fourthwall/__tests__/collections.test.ts`
- `lib/fourthwall/__tests__/importer.test.ts`
- `lib/fourthwall/__tests__/merch.test.ts`
- `app/api/webhooks/fourthwall/__tests__/route.test.ts`
- `components/__tests__/public-surfaces.test.ts`
- `middleware.test.ts`

> ⚠️ **`vitest` passes where `tsc` fails.** `globals: true` is set at runtime only, so a test using
> `describe`/`it`/`expect` without importing them runs green and fails `npm run lint` (`TS2582`).
> **Run both gates.** See [`../protocols/verification.md`](../protocols/verification.md).

### The `public-surfaces` guard

`components/__tests__/public-surfaces.test.ts` fails if any `href` inside `components/**` points at
`/import` or `/api/import/fourthwall`. Those routes are Basic-auth gated, so a public link produces a
browser password prompt rather than a crash — which is why it is worth a guard.

**Known blind spots:** it does not scan `app/**`, does not follow template literals, and ignores absolute
URLs. Do not treat a green run as proof that no public surface links to a gated route.

## CI

`.github/workflows/ci.yml` — the only workflow:

```
actions/checkout@v7 → actions/setup-node@v7 (node 20, cache npm) → npm ci → npm run lint → npm test
```

Runs on every push to every branch and on every PR, with `concurrency` set to cancel superseded runs.

> The Vercel deploy workflow was **deliberately deleted**. Do not recreate it — Git integration handles
> deploys, and a second path caused the author-gate problem documented in
> [`../skills/blocked-deploy-author-gate/SKILL.md`](../skills/blocked-deploy-author-gate/SKILL.md).
