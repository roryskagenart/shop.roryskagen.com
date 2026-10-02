# Trap register

Every entry follows the format in [`../protocols/knowledge.md`](../protocols/knowledge.md#2-trap-entry-format).
**No evidence, no entry.**

Status: `OPEN` (still true) · `MITIGATED` (worked around, root cause remains) · `RESOLVED` (fixed — kept as
a regression test).

---

## Data integrity

<a id="t01"></a>
### T01 — The storefront fabricates purchasable products
**Status:** OPEN
**Bites:** A visitor can assemble a **$28,000 cart** for products that exist only in a local JSON file and
in one serverless instance's memory. **Nothing throws and every page returns 200**, so no monitoring will
ever surface it.
**Evidence:** `lib/fourthwall/index.ts:385-397` (`getCollectionProducts`) and `:451-465` (`getProduct`) fall
back to local JSON whenever Fourthwall returns nothing. `components/cart/actions.ts:22-36` (`addItem`)
then fails at Fourthwall, and `lib/fourthwall/index.ts:481-484` falls back to an **in-process `Map` cart**.
`redirectToCheckout` sends that cart id to the **ungated** `/checkout/`. Verified: `/USD/collections/fine-art-originals`
renders 15 originals at $5.5k–$28k with no corresponding Fourthwall product, each with a working
add-to-cart.
**Do instead:** This is the defect the next release exists to remove. Until then, do not describe the
originals as purchasable. Fix = delete the fallback, not guard it.
**Source:** 2026-10-01.

<a id="t02"></a>
### T02 — A `DELETE` probe archived a live product
**Status:** OPEN (the product is still archived)
**Bites:** An unknown HTTP method sent at a live resource **silently mutated production**. `DELETE` returned
`204` — a *soft* delete — so the failure looked like a success.
**Evidence:** A `DELETE /open-api/v1.0/products/{id}` against `the-martian-white-glossy-mug` left
`state: SOLD_OUT`, `access: ARCHIVED`. A re-`GET` showed an archived duplicate in the catalogue, which
cannot be removed (no update path — T03).
**Do instead:** [`../protocols/destructive-actions.md`](../protocols/destructive-actions.md). Probe a
scratch record. Read the docs first.
**Source:** 2026-10-01.

<a id="t03"></a>
### T03 — There is no update endpoint
**Status:** OPEN (vendor constraint)
**Bites:** Any correction requires **archive + recreate**, which permanently leaves an archived duplicate.
**Evidence:** `PATCH`/`PUT /open-api/v1.0/products/{id}` → **405**. `PUT /products/{id}/availability`
`{available:true}` → 200 but **does not reverse an archive**.
**Do instead:** Get the create payload right the first time. Rebuilds are safe on the URL front (archiving
releases the slug) — use the seeding script's **`--force`**, since an archived product keeps its name and
name-based de-duplication would silently skip it.
**Source:** 2026-10-01.

<a id="t04"></a>
### T04 — A collection cannot be renamed; recreating leaves a public orphan
**Status:** OPEN
**Bites:** A renamed collection leaves a **PUBLIC orphan** that still renders in the site nav.
**Evidence:** Only `PUT /collections/{id}/products` is updatable. `getCollections()`
(`lib/fourthwall/index.ts:353-356`) appends any Fourthwall collection not present in the taxonomy.
**Do instead:** Change the display name in `lib/taxonomy.ts` — the taxonomy title wins over a colliding
Fourthwall name (asserted in `lib/fourthwall/__tests__/collections.test.ts`).
**Source:** 2026-10-01.

<a id="t05"></a>
### T05 — `PUT /collections/{id}/products` replaces the whole list
**Status:** OPEN
**Bites:** It reads like an append and is not. Omitting an id **removes** that product.
**Evidence:** API docs: *"Sets the full list of product IDs in the collection."* Scope `offer_write`.
**Do instead:** Always send the complete intended list, and re-read the collection afterwards.
**Source:** 2026-10-01.

<a id="t06"></a>
### T06 — Omitting `sizes` creates exactly one variant
**Status:** OPEN (already live in production)
**Bites:** The shop's four mugs each have **only** a `White, 11oz` variant. The intent was a size range.
**Evidence:** `GET /open-api/v1.0/products` → each mug has one variant, `attributes.size: "11oz"`.
**Do instead:** Pass `sizes` explicitly. Watch the API's inconsistent spelling (`"20 oz"`).
**Source:** 2026-10-01.

---

## Fourthwall API mechanics

<a id="t07"></a>
### T07 — The template list is mutable
**Status:** OPEN
**Bites:** A template resolved by name at run time can silently become a **different product**.
**Evidence:** `GET /product-templates` returned 25 for this shop. Mid-session the set changed: a Comfort
Colors tee present in one call was a Drawstring Bag in the next. `total: 601` is the platform-wide count
and does not respond to `size`/`page`.
**Do instead:** **Pin template ids in config and assert at apply time.** Never resolve a template by name.
**Source:** 2026-10-01.

<a id="t08"></a>
### T08 — `regions[].region` is a per-template regionId, not a placement
**Status:** OPEN
**Bites:** A hardcoded `"front"` works for a t-shirt and is **rejected for a mug** — the same code path
fails only on some products.
**Evidence:** A mug template exposes exactly one `customizableAreas[]` entry with `regionId: "default"`
(placements `front`/`back`, 2700×1050 @300 DPI). Apparel exposes many.
**Do instead:** Resolve the region from the template's `customizableAreas`, per template.
**Source:** 2026-10-01.

<a id="t09"></a>
### T09 — `unitPrice.value` is dollars, not cents
**Status:** OPEN
**Bites:** Reading it as cents makes every price off by 100×.
**Evidence:** `gondeoleu` returns `{"value": 4500.00, "currency": "USD"}` and the storefront serves
**$4,500 USD**.
**Do instead:** Treat it as a decimal dollar amount.
**Source:** 2026-10-01.

<a id="t10"></a>
### T10 — The list endpoint 404s while the detail endpoint works
**Status:** OPEN
**Bites:** Conflating them makes a **local-only slug indistinguishable from a slug that never existed** —
which is how T01 stayed invisible.
**Evidence:** `GET /v1/products` → 404 `No static resource api/public/v1.0/products`. But
`GET /v1/products/{handle}` → **200** with the token, 401 without, 404 `OFFER_SLUG_NOT_FOUND_ERROR` for an
unknown slug (probed against a real slug, a real-but-absent slug, and a nonsense slug).
**Do instead:** Use the detail endpoint to prove a product exists. Never conclude "the API 404s" from the
list endpoint alone.
**Source:** 2026-10-01.

<a id="t11"></a>
### T11 — The CDN caches per exact URL
**Status:** OPEN
**Bites:** **A stale read looks exactly like a failed write.** This sends you debugging a write that
succeeded.
**Evidence:** Re-`GET` of a collection after a successful `PUT` returned the previous product list until a
random query param was appended.
**Do instead:** **Cache-bust before concluding anything about a write.**
**Source:** 2026-10-01.

<a id="t12"></a>
### T12 — The Platform API cannot create priced physical products
**Status:** OPEN (structural)
**Bites:** The originals — which need their own price, own SKU, stock of 1, and self-fulfilment — **cannot
be created by the API at all**. Any plan that assumes otherwise is unbuildable.
**Evidence:** `POST /products` with `type: "design"` requires `productTemplateId` + `regions[]` and accepts
no `price`, `variants`, `slug`, `stock` or `images`; pricing is a `profitMargin` over base cost. Manual
products are dashboard-only; no bulk/CSV import is documented.
**Do instead:** Plan originals as **dashboard-only manual products**. This is why an earlier sync feature
was fixed by deletion rather than repair.
**Source:** 2026-10-01.

<a id="t13"></a>
### T13 — There is no wall-art template
**Status:** OPEN (structural)
**Bites:** `canvas-prints` and `metal-litho` are **structurally unfulfillable** through this API.
**Evidence:** The 25 templates in `.workbuddy-ai/memory/DETAIL.md` contain no poster, canvas or metal print
entry.
**Do instead:** Treat these two taxonomy handles as marketing surface, not shippable collections — or
source a different fulfilment route.
**Source:** 2026-10-01.

<a id="t14"></a>
### T14 — The password gate blocks discovery, not purchase
**Status:** OPEN
**Bites:** Assuming "the shop is private" leads to wrong conclusions about risk. `/checkout/` is **open**.
**Evidence:** Browser-UA probes: `/`, `/products/<slug>`, `/collections/<slug>`, `/cart` → 302 → `/password`;
**`/checkout` → 301 → `/checkout/` → 200** with `<title>Checkout – Fourthwall</title>`.
**Do instead:** Describe the gate accurately. An earlier project note claimed the shop "cannot be bought
from" — **too strong, corrected after measurement.**
**Source:** 2026-10-01 (corrected same day).

---

## Tooling and environment

<a id="t15"></a>
### T15 — `vitest` passes where `tsc` fails
**Status:** OPEN
**Bites:** A green test run hides a broken typecheck. Measured: a test file reported green by vitest then
produced **15 errors** under `npm run lint`.
**Evidence:** `vitest.config.ts` sets `globals: true` at runtime only, so a test omitting its
`describe`/`it`/`expect` imports passes vitest and fails `tsc` (`TS2582`). `tsconfig.json` also sets
`noUncheckedIndexedAccess: true`.
**Do instead:** **Run both gates, always.**
**Source:** 2026-10-01.

<a id="t16"></a>
### T16 — `next build` is not a usable gate here
**Status:** OPEN
**Bites:** It stalls with zero output and zero writes, and Next suppresses its spinner on a non-TTY pipe —
so **silence proves nothing** in either direction.
**Evidence:** Repeated observation; no artifacts written, no completion.
**Do instead:** Use `tsc` + `vitest` locally; use CI for a real build.
**Source:** 2026-10-01.

<a id="t17"></a>
### T17 — The Vercel CLI does not read `.gitignore`
**Status:** MITIGATED (`.vercelignore` added, `b7b3a51`)
**Bites:** A local deploy ships **untracked local files** into the deployment — including agent memory and
build artifacts.
**Evidence:** `vercel deploy --dry --json` showed the upload set containing `.workbuddy-ai/memory/MEMORY.md`,
`.workbuddy-ai/backups/…` and `tsconfig.tsbuildinfo`. Vercel honours only `.vercelignore` plus its built-in
defaults.
**Do instead:** Keep `.vercelignore` current, and **re-run `vercel deploy --dry --json` and inspect the file
list** before any local deploy. Costs nothing, creates no deployment. CI is immune (fresh checkout).
**Source:** 2026-10-01.

<a id="t18"></a>
### T18 — `taskkill /PID $!` addresses the wrong process
**Status:** OPEN
**Bites:** In Git Bash `$!` is an **MSYS pid**, not a Windows pid. `taskkill` resolves the number as a
Windows PID and hits an unrelated process. Measured: it **killed the calling shell**.
**Evidence:** A cleanup trap's `taskkill /PID $! /T /F` returned exit 128 on the wrapper it meant to kill
and SIGTERM'd the agent's own command.
**Do instead:** Use bash's builtin `kill "$PID"` (it understands MSYS pids), or take a real Windows pid from
`netstat -ano | grep LISTENING | grep ":$PORT "`. **Never use `/T`** on a pid you did not get from netstat.
**Source:** 2026-09-22.

<a id="t19"></a>
### T19 — Killing the npm wrapper leaves the server running
**Status:** OPEN
**Bites:** The port stays held, and the next start fails with `Port … is already in use` — which reads
exactly like a broken script.
**Evidence:** `npm run dev &` → killing `$!` killed the wrapper; the `next`/`node` child kept the port.
**Do instead:** Sweep the **listener** pid from `netstat`, not just the wrapper.
**Source:** 2026-10-01.

<a id="t20"></a>
### T20 — `vercel env` traps
**Status:** OPEN
**Bites:** Several, all silent. See the table in
[`../stack/environments.md`](../stack/environments.md#traps).
**Evidence:** Most notably: `env add NAME preview` is **interactive**, so a piped value is eaten by the
first prompt and the call **fails silently**; and piping through `tail -1` made a partial run look
successful while only 3 of 6 entries existed.
**Do instead:** Pass `--yes`/`--git-branch` and `--type`; **confirm with `vercel env ls` and count.**
**Source:** 2026-10-01.

<a id="t21"></a>
### T21 — `NEXT_PUBLIC_GTM_ID` placeholder is worse than unset
**Status:** OPEN
**Bites:** Setting the placeholder **overrides a working fallback** and disables analytics.
**Evidence:** `lib/analytics.ts:30` — `cleanEnv(process.env.NEXT_PUBLIC_GTM_ID) || 'GTM-PV2BBNN'`.
**Do instead:** Unset it, or set a real id.
**Source:** 2026-10-01.

<a id="t22"></a>
### T22 — Destructured `process.env` is invisible to a dotted grep
**Status:** OPEN
**Bites:** `grep 'process\.env\.X'` misses `const { X } = process.env`, so required vars look absent.
**Evidence:** `app/layout.tsx:9` destructures `{ TWITTER_CREATOR, TWITTER_SITE, SITE_NAME }`; `SITE_NAME` is
also used at `components/icons/logo.tsx:7` and `components/opengraph-image.tsx:11`. Unset ⇒ the OG title
and logo aria-label render `undefined`.
**Do instead:** Grep for `process\.env` **and** destructuring patterns.
**Source:** 2026-10-01.

---

## Repo and process

<a id="t23"></a>
### T23 — Four names for one project
**Status:** OPEN
**Bites:** The GitHub remote is **not** derivable from the folder name, the Vercel project, or the custom
domain. Inferring it points work at the wrong repository.
**Evidence:** Local folder `shop.roryskagenart.com`; Vercel `roryskagen-5713/shop-roryskagen-com`; domain
`shop.roryskagenart.com`; **GitHub `roryskagenart/shop.roryskagen.com`** (`.com`).
**Do instead:** Use the table in [`/AGENTS.md`](../../../AGENTS.md#2-read-this-before-you-name-anything).
**Source:** 2026-10-01.

<a id="t24"></a>
### T24 — Two version spaces disagree
**Status:** OPEN
**Bites:** Naming a release from the wrong scheme produces two contradictory plans, and the repo follows
the wrong one.
**Evidence:** `lib/brand-config.ts:66-101` calls **`v1.1.0` "Step 1 (Current Release)"** (mirrored at
`lib/docs-content.ts:1178-1190`), but `git tag` shows **only `v0.1.0`**. The current plan uses `v0.2.0`.
**Do instead:** Check `git tag` and the plan directory before naming anything. Pick one scheme explicitly.
**Source:** 2026-10-01.

<a id="t25"></a>
### T25 — A stale checkout inflates `git diff` catastrophically
**Status:** OPEN
**Bites:** A tiny change reads as a whole-file rewrite — measured: a **4-line change reported as 891
changed lines** — which looks like catastrophic whitespace damage and is not.
**Evidence:** With a stale `HEAD` the index holds an old tree. `git status` and `git diff --cached <base>`
also disagree, producing phantom entries including files reading as deleted that were not.
**Do instead:** Diff against the **intended base SHA** (`git diff <base-sha> --stat`) and build new content
from `git show <base>:<path>`.
**Source:** 2026-09-15.

<a id="t26"></a>
### T26 — Dead configuration that looks live
**Status:** OPEN
**Bites:** Time spent chasing a config that nothing reads.
**Evidence:** `FOURTHWALL_WEBHOOK_SECRET` — `GET /open-api/v1.0/webhooks` → `{"results":[]}`, so **nothing
invalidates ISR**. `GITHUB_KEY` — provisioned in Vercel, read nowhere.
**Do instead:** Confirm a variable is read before debugging it. A var set in the platform and read by no
code is not "configured".
**Source:** 2026-10-01.

<a id="t27"></a>
### T27 — `admin: false` blocks branch protection, and the read is ambiguous
**Status:** OPEN
**Bites:** You cannot add branch protection, and you cannot tell from the API whether it exists.
**Evidence:** `GET /branches/main/protection` → **404** for a non-admin, which is *indistinguishable* from
"not configured". `admin: false` does **not** block repo secrets/variables (`gh secret set` succeeds).
**Do instead:** Read the `protected` boolean from `GET /branches/main`. **Current state: `main` is
UNPROTECTED.** Only the owner can change it.
**Source:** 2026-10-01.

---

## Resolved — kept as regression tests

<a id="t28"></a>
### T28 — Auth failures were reported as successes
**Status:** RESOLVED (`4661d3a`, PR #1)
**Bites:** `syncArtworksToFourthwall()` incremented `createdCount` on a non-2xx response, so a **401
reported `Success/Ready: 137, Failed: 0`**.
**Evidence:** Code inspection plus a live 401.
**Do instead:** The write path was **deleted, not repaired** — the endpoint now returns 501 and never reads
credentials from the request body. **A false-success error path is a data-integrity bug, not a logging
bug.**
**Source:** 2026-10-01.

<a id="t29"></a>
### T29 — `/import` was linked from four public surfaces
**Status:** RESOLVED (`13dba2f`, PR #4)
**Bites:** A public link to a Basic-auth route produces a **browser password prompt**, not a crash — so it
is easy to miss.
**Evidence:** Grepping `href="/import"` across `components/**` found **four** links (footer, docs header,
docs sidebar ×2), not the one a note had recorded.
**Do instead:** **Grep the count; never trust a remembered count.** A guard now covers `components/**` —
see its documented blind spots in [`../stack/overview.md`](../stack/overview.md#the-public-surfaces-guard).
**Source:** 2026-10-01.

<a id="t30"></a>
### T30 — `NEXT_PUBLIC_FW_API_URL` pointed at the webhook URL
**Status:** RESOLVED
**Bites:** The app called the wrong host entirely.
**Evidence:** Config inspection; corrected to the Storefront host.
**Do instead:** The two Fourthwall hosts are not interchangeable — see
[`../stack/fourthwall.md`](../stack/fourthwall.md#1-two-apis-two-hosts).
**Source:** 2026-10-01.

---

## Added after the initial migration

<a id="t31"></a>
### T31 — `npm run prettier:check` was never a green gate
**Status:** OPEN
**Bites:** It looks like a formatting gate and is not one. A contributor runs it, sees ~91 files failing,
and either assumes they broke something or runs a repo-wide `prettier --write` — which rewrites most of
the tree and buries their real change in a formatting diff.
**Evidence:** `prettier --check --ignore-unknown $(git ls-files)` at `87cf568` → **"Code style issues found
in 91 files"** out of **103 tracked files** (measured 2026-10-02). Sanity-checked on files untouched by the
measurement: `lib/utils.ts` and `app/page.tsx` both fail. `prettier:check` is **not** referenced by
`.github/workflows/ci.yml`, so it has never blocked anything.
**Do instead:** Treat it as advisory. Format **only the files you touched**
(`prettier --write <paths>`). If the repo ever wants a real formatting gate, the fix is one deliberate
`prettier --write .` commit that touches nothing else — recorded here so nobody mistakes that commit for
damage.
**Source:** 2026-10-02.
