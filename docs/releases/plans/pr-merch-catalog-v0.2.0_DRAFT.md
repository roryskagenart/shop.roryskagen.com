# DRAFT — PRD: v0.2.0 "Staged Catalogue"

| | |
| :--- | :--- |
| **Status** | DRAFT — not approved, not started. **Blocked on OQ1–OQ8** |
| **Created** | 2026-10-01 · **re-scoped and re-measured 2026-10-02** |
| **Supersedes** | the 2026-10-01 revision of this document ("Sellable Storefront") |
| **Scope** | **Construct the sellable catalogue inside Fourthwall and leave it non-public.** Publishing is a separate release. |
| **Release** | `v0.2.0` — see OQ7; the version number is contested (**T24**) |

> This is a **draft**. Nothing here is implemented. No product has been created or archived by this
> document. The build it describes **has not been run.**

---

## 0. What this is, and what it is not

### The one-sentence goal

> **After this release, the entire sellable catalogue exists inside Fourthwall and is unreachable by a
> guest. Publishing it is a separate, deliberate, human-gated act that this release does not perform.**

### Why the re-scope

The 2026-10-01 revision put the catalogue build, the publication, and a front-end refactor into one gate
sequence. That couples three risks with different blast radii — a bad create payload corrupts the
catalogue, a bad publish exposes it, and a bad refactor breaks the storefront. **Building and publishing
are separable, so they are separated.** The build is reversible. Publication is not.

### In scope

- **Building** 4 collections and up to 40 design products from **10 artworks**, through the Fourthwall
  **Platform API**.
- **Staging** every one of them in a non-public state, and **proving** they are non-public.
- **Specifying** — but not executing — the launch gate that flips the catalogue live.

### Explicitly NOT in scope

| Not this release | Why |
| :--- | :--- |
| Any change to `app/**` or `components/**` | This release writes to Fourthwall, not to the storefront. |
| Removing the fabricated-catalogue fallback (**T01**) | Deferred by decision, not oversight — see [§9](#9-do-not-do-yet). |
| Publishing anything, or un-gating the shop | That is **Phase B**, a separate PRD with its own approval gate. |
| The 15 originals | Structurally impossible via API — **T12**. Dashboard-only, permanently. |
| `canvas-prints`, `metal-litho` | No wall-art template exists — **T13**. Structurally unfulfillable. |
| The UX re-imagining | Deferred to Phase B, where it can be verified against a live catalogue. |

---

## 0a. Decisions taken

### From Jaden, 2026-10-01

| # | Decision | Consequence |
| :--- | :--- | :--- |
| **OQ1** | **`v0.2.0`.** Continue the tag line. | The `v1.x` roadmap labels in `brand-config.ts` / `docs-content.ts` must be relabelled (**T24**). |
| **OQ2** | Publish both hidden Austin Skyline products; **verify the gate** | Verified — the gate covers browsing, **not `/checkout/`** (**T14**). |
| **OQ4** | **The $4,500 `gondeoleu` price is intentional — it is an original.** | It must not sit in `all` beside $22 mugs. Slug typo is cosmetic and optional. |
| **OQ7** | Rebuild the four mugs for 15oz/20oz | **Deferred to Phase B** by this re-scope — see §9. |

### From Jaden, 2026-10-02 — the re-scope

| # | Decision | Consequence |
| :--- | :--- | :--- |
| **R1** | **This release constructs only.** Nothing is published. | Publication becomes its own PRD with its own approval gate. |
| **R2** | Non-public state is achieved by **`publishOnCreate: false`** plus the shop-wide password gate. | Every product is created `HIDDEN` with zero extra calls. |
| **R3** | **The Platform API builds the products; the dashboard creates the collections.** | See [D2](#d2--collections-are-created-in-the-dashboard-products-are-attached-by-api). |
| **R4** | **No MCP server is enabled.** | Respects the deliberate baseline in `docs/agentic/mcp/README.md`. Revisit in Phase B or via OQ2. |
| **R5** | The 1500px gate is **replaced by a per-region check**. | The blanket gate rejects 6 of the 10 chosen artworks by under 7%. See [D4](#d4--eligibility-is-per-region-not-a-blanket-1500px). |

---

## 1. Verified starting state

**Re-measured 2026-10-02.** The KB in `docs/agentic/` was measured 2026-10-01; **where the two disagree,
this document wins and the KB is stale** — see [Appendix B](#appendix-b--documentation-to-update).

### 1.1 Repo

| Fact | Value | Command |
| :--- | :--- | :--- |
| `HEAD` | **`0ef582e`** | `git rev-parse HEAD` |
| Working tree | **clean** | `git status --short` → empty |
| Branch | `main` = `origin/main` | `git rev-parse --abbrev-ref '@{u}'` |
| Tags | **only `v0.1.0`** | `git tag -l` |
| Tests | **97 passed / 6 files** | `vitest run` |

> ⚠️ **`HEAD` moved from `87cf568` to `0ef582e` mid-session** — a fast-forward of the agentic-KB merge.
> Every figure in the 2026-10-01 revision was taken at `87cf568`. Re-derive before citing (**T25**).

### 1.2 The shop, and exactly what the password gate covers

| | |
| :--- | :--- |
| Shop | `Rory Skagen Art` — `sh_b63dd6c0-033c-4db8-916e-6adeb02a5fe5` |
| Status | **`PASSWORD_PROTECTED`** — `GET /open-api/v1.0/shops/current` |

| Path | Result |
| :--- | :--- |
| `/`, `/products/<slug>`, `/collections/<slug>`, `/cart` | **302 → `/password`** |
| **`/checkout`** | **301 → `/checkout/` → 200 — UNGATED** (a real SPA) |
| `/login`, `/account`, `/sign-in` | 403 |

**⇒ The gate blocks DISCOVERY, not PURCHASE** (**T14**).

> ⚠️ **This gate is on Fourthwall's host.** `shop.roryskagenart.com` resolves to Fourthwall's gated
> storefront, not to the Next.js app. **The Next.js app is a separate deployment and is not covered by
> this gate.** See [§2.7](#27--the-question-the-whole-design-rests-on) — this is the load-bearing
> unknown of the entire release.

### 1.3 Live catalogue state

**Collections — 3, all `PUBLIC`:**

| Name | Slug | id | Products |
| :--- | :--- | :--- | ---: |
| Kitsch CPG | `kitsch-cpg` | `col_qMf6-GzBQlytUmha907_Tg` | 4 |
| featured | `featured` | `col_m7hZOp3nRpyUjhENpvl6Sw` | 1 |
| All Products | `all` | `col_k2tFEAvQQfyoVF1PYIi7sg` | 5 |

**Products — 8 records, 5 customer-visible:**

| Product | state | access | Price | Note |
| :--- | :--- | :--- | :--- | :--- |
| `odoroita-sakana-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | **11oz only** (**T06**) |
| `the-martian-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | **11oz only** |
| `the-martian-ii-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | **11oz only** |
| `today-atomic-sunrise-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | **11oz only** |
| `gondeoleu` | AVAILABLE | PUBLIC | **$4,500.00** | an intentional original (**T09**) |
| `austin-skyline-2019-white-glossy-mug` | AVAILABLE | **HIDDEN** | $22.00 | invisible on the Fourthwall host |
| `austin-skyline-2019-comfort-colors-…-t-shirt` | AVAILABLE | **HIDDEN** | $34.00 | **the precedent for `apparel`** — see OQ4 |
| `the-martian-white-glossy-mug` (2nd) | SOLD_OUT | ARCHIVED | $22.00 | soft-deleted by the `DELETE` probe (**T02**) |

### 1.4 ⚠️ What the KB says that is no longer true

The most consequential finding of the research pass. Four KB claims are **contradicted or unsupported by
the live OpenAPI specification**:

| KB claim | Reality (2026-10-02) |
| :--- | :--- |
| `fourthwall.md` §3 — *"`PATCH`/`PUT /products/{id}` → 405 — **no update endpoint exists**"* | Narrowly true, misleading in effect. **`PUT /products/{id}/state` and `/availability` both exist.** |
| **T04** — *"A collection cannot be renamed"*; *"Only `PUT /collections/{id}/products` is updatable"* | **`PUT /open-api/v1.0/collections/{collectionId}` exists** and accepts `name`, `description`, `offerIds`. |
| `fourthwall.md` §3.4 — *"`POST /collections` is public the instant it returns. **There is no draft state to hide behind.**"* | **Half true.** A four-state collection model exists; **no API endpoint can set it** — but the **dashboard** creates collections **`Hidden` by default**. |
| `fourthwall.md` §6 — *"`access: HIDDEN` … means the Storefront API does not serve it at all"* | **Asserted without a quoted command, and the docs do not say it.** The Storefront API returns `access` on every product and documents no filter. **This claim is load-bearing and unverified — [§2.7](#27--the-question-the-whole-design-rests-on).** |

The KB's own rule applies: *"Re-measure before relying on it — vendor APIs change, and this document is
dated for exactly that reason."* Correcting these is **T12/T13** and [Appendix B](#appendix-b--documentation-to-update).

### 1.5 ⚠️ Nine catalogue records have dead image URLs

**Measured 2026-10-02** by GET against every one of the 137 records' `image.url`. **Nine 404; 128 resolve.**

The correlation is perfect and mechanical: **all nine broken URLs use a placeholder `/v1/` upload-version
segment** (`…/image/upload/**v1**/beat-bop.jpg`); **every one of the 128 working URLs carries a real
version id** (`…/image/upload/**v1787076989**/2019today-copy.jpg`). 9/9 placeholders are dead; 0/128
versioned URLs are. This is not a transient CDN fault — it is an unresolved upload version baked into the
catalogue data.

| Slug | Status | Note |
| :--- | :--- | :--- |
| **`beat-bop`** | **`Available`** | **chosen artwork #10 (§C1)** |
| **`the-cats-of-the-colloseum-2`** | **`Available`** | sellable, broken image |
| `jungle-bust` | Sold | |
| `jungle-tempo-2` | Sold | |
| `mid-flight-connection` | Sold | |
| `southern-belle` | Sold | |
| `steamy-the-flavor-genie` | Sold | |
| `the-cat-bird-seat` | Archived | |
| `wise-bird` | Sold | |

> ⚠️ **This is a hard blocker for `beat-bop`, and it is not a build problem — it is a data problem.**
> `publish-merch-to-fourthwall.ts:405` fetches `artwork.image.url`; against `beat-bop` that is a guaranteed
> 404, so the build will throw rather than silently degrade. **Either source a replacement image for
> `beat-bop` or substitute artwork #10.** The other 8 broken records are outside the ten, but one of them
> (`the-cats-of-the-colloseum-2`) is also `Available` — so **two sellable artworks currently render a broken
> image on the live site**, a defect worth fixing regardless of this PRD.

---

## 2. The capability surface — what Fourthwall actually offers

**Researched 2026-10-02** from the published OpenAPI specs, `docs.fourthwall.com`, `help.fourthwall.com`,
and the MCP tool reference. This section is the evidence base for every decision in §4.

### 2.1 ⭐ The visibility ladder — four states, and two independent axes

| Axis | Field | Values | Meaning |
| :--- | :--- | :--- | :--- |
| **Visibility** | `access` | `PUBLIC` · `HIDDEN` · `PRIVATE` · `ARCHIVED` | Who can reach it |
| **Stock** | `state` | `AVAILABLE` · `SOLD_OUT` | Whether it can be bought |

Conflating these two is the central trap of this area. `OfferAccessV1.discriminator.mapping` →
`PUBLIC, HIDDEN, PRIVATE, ARCHIVED`; `OfferStateV1.discriminator.mapping` → `AVAILABLE, SOLD_OUT`.

**What each visibility state actually does:**

| State | Shop listing | Direct URL | Purchasable | Documented use |
| :--- | :--- | :--- | :--- | :--- |
| **`PRIVATE`** | ✗ | **✗ no public URL at all** | ✗ | *"work on an internal draft before a product is ready to launch"* |
| **`HIDDEN`** | ✗ | ✓ **still viewable** | **✓ still purchasable** | *"a soft launch or a private campaign"* |
| `PUBLIC` | ✓ | ✓ | ✓ | live |
| `ARCHIVED` | ✗ | ✗ | ✗ | retired; **frees the slug** |

> ⚠️⚠️ **`HIDDEN` is not a safe draft state.** Fourthwall's own documentation states a hidden product's
> *"direct link still works and it can still be purchased."* Anyone holding a URL can buy. **`PRIVATE`
> is the only genuinely unreachable state — and the Platform API cannot set it** (§2.3).

**Collection states** are the same four names (`CollectionStateV1`) and are **readable but not writable**
through the API (§2.6.2).

### 2.2 ⭐ The write-surface matrix

Four surfaces can write. They are **not** equivalent, and the differences decide the architecture.

| Operation | Dashboard | Platform API | Official MCP | Eli Actions |
| :--- | :---: | :---: | :---: | :---: |
| Create a design product | ✓ | ✓ `POST /products` | ✓ | ✓ *(Pro)* |
| Create a **manual, priced** product | ✓ | **✗** | digital only | ? |
| Set product **`PUBLIC`/`HIDDEN`** | ✓ | ✓ `PUT /products/{id}/state` | ✓ | ✓ *("mark all products public")* |
| Set product **`PRIVATE`** | ✓ | **✗ not reachable** | ? | ? |
| Archive a product | ✓ | ✓ `DELETE /products/{id}` | ✓ | ? |
| Update product **name / description / price** | ✓ | **✗** | ✓ `update-offer` | ? |
| Update product **slug** | ✓ | **✗** | ✓ `update-offer-slug` | ? |
| Update **variant prices in bulk** | ✓ | **✗** | ✓ `bulk-update-offer-variant-prices` | ? |
| Create a collection | ✓ *(Hidden by default)* | ✓ *(state not settable)* | ✓ | ? |
| Update collection **name / description** | ✓ | ✓ `PUT /collections/{id}` | ✓ | ? |
| Set collection **state** | ✓ *(+ Schedule as Public)* | **✗ no endpoint** | ✓ `update-collection-state` | ? |
| Set collection **availability** | ✓ | ✓ `PUT /collections/{id}/availability` | ✓ | ? |
| Set a collection's **product list** | ✓ | ✓ `PUT /collections/{id}/products` | ✓ | ? |
| Take the shop live / password it | ✓ | **✗** | ✓ `update-shop-site-status` | ? |

Cells marked `?` are documented tools whose **parameters are unverified** — the MCP tool reference
publishes **names and one-line descriptions only, no argument schemas**, and the server requires OAuth
(`POST https://mcp.fourthwall.com` → **401** with a `WWW-Authenticate: Bearer resource_metadata=…`
challenge, so `tools/list` is not publicly discoverable).

> **The decisive rows are `PRIVATE` and collection *state*.** The API can create a product hidden; only
> the **dashboard** can make it truly unreachable or set a collection's visibility. That is why R3
> splits the work across both.

### 2.3 The API lifecycle endpoints (exact)

| Endpoint | Body | Note |
| :--- | :--- | :--- |
| `POST /open-api/v1.0/products` | `publishOnCreate` (bool) | **Defaults to `false`** — *"The product is created hidden unless `publishOnCreate` is true."* |
| `PUT /open-api/v1.0/products/{id}/state` | `{"state":"PUBLIC"\|"HIDDEN"}` | *"Only `PUBLIC` and `HIDDEN` are reachable via this endpoint — use `DELETE` to archive."* |
| `PUT /open-api/v1.0/products/{id}/availability` | `{"available":bool}` | Stock axis; preserved across a state transition. |
| `DELETE /open-api/v1.0/products/{id}` | — | **Soft** delete → `ARCHIVED`. Frees the slug. |
| `POST /open-api/v1.0/collections` | `name`, `description`, `offerIds[]` | **No state field.** |
| `PUT /open-api/v1.0/collections/{id}` | `name?`, `description?`, `offerIds?` | **All optional.** |
| `PUT /open-api/v1.0/collections/{id}/availability` | `{"available":bool}` | Documented only as *"toggle availability"*. |
| `PUT /open-api/v1.0/collections/{id}/products` | `{"offerIds":[…]}` | **Full replacement, not an append** — **T05**. |

### 2.3a ⚠️ Rate limits — a real constraint, not a footnote

The **default** is 100 requests / 10 seconds per shop, but the write endpoints this release depends on
are far tighter, and they are what govern the build:

| Endpoint | Limit |
| :--- | :--- |
| **`POST /products`** | **5 requests / minute** |
| **`POST /customizations`** | **5 requests / minute** |
| **`POST /media/upload-url`** | **20 requests / minute** |
| Everything else | 100 / 10 seconds |

> ⚠️ **40 products is therefore an ~8-minute minimum build**, before the asynchronous mockup renders
> complete. 429 bodies are `OPEN_API_TOO_MANY_REQUESTS`.
>
> **⇒ The build needs deliberate pacing and 429 backoff.** An earlier revision of this document called
> rate limiting "a non-risk" — **that was wrong**, and a naive loop over 40 products will fail partway
> through and leave a half-built catalogue (**R2**). This is also a hard argument for the build being
> **resumable**, which is what idempotency by name already gives it.

### 2.4 The official MCP server

`https://mcp.fourthwall.com` · Streamable HTTP · **OAuth 2.0** · read **and** write · **available on all
plans** (the help centre states this explicitly). Docs launched **April 2026**; the write/management
tools were documented in **June 2026**.

It adds write capability the Platform API lacks: `ecommerce_update-offer`,
`ecommerce_update-offer-slug`, `ecommerce_update-offer-variant`,
`ecommerce_bulk-update-offer-variant-prices`, `ecommerce_update-collection-state`,
`ecommerce_update-collection-details`, `ecommerce_update-shop-site-status`, plus a design/draft pipeline
(`ecommerce_generate-product-design-previews`, `ecommerce_get-draft-attributes`,
`ecommerce_apply-draft-to-product`) and brand tools (`brand_from_url`, `brand_extract_assets`,
`image_remove_background`).

> **It is not a strict superset.** REST already covers create, publish/unpublish, availability and
> archive — everything this release needs. MCP's marginal value is **product-detail, slug and variant-price
> editing**, which a build-only release does not require. **The gap is narrower than it first appears** —
> which strengthens [D6](#d6--no-mcp-server-is-enabled) rather than weakening it.

### 2.5 Eli, and the agentic surface — what shipped, and when

| Feature | What it does | Shipped |
| :--- | :--- | :--- |
| **Eli** (dashboard assistant) | *"generate a full product line from a single design"*; bulk settings ops; promotions | Beta to all, ~**May 2026** |
| **Eli Actions** | Bulk ops from plain language — *"mark all my products as public"*, *"hide all out-of-stock products"* | help page **2026-05-27** |
| **ChatGPT & Claude app** | *"Create new merch — 'Create a t-shirt with this design'"* | **July 2026** |
| Title & description generator | AI product copy | **2026-05-01** |
| Adobe Express in Product Designer | Background removal, effects, crop | **2026-08-07** |
| Create design products (the pipeline) | Artwork → mockups → purchasable product | **May 2026 — labelled Beta** |
| **Official MCP server** | Agent access to the shop | docs **April 2026**, write tools **June 2026** |

> ⚠️ **Eli is documented as a Fourthwall *Pro* feature** on its help page, while the marketing FAQ says
> it is *"included with every Fourthwall account."* **Unresolved conflict — OQ5 depends on it.** The MCP
> server has no such caveat.

> **Eli Actions is the natural launch-flip tool**: the operation this release must specify but not perform
> is precisely a bulk visibility change. It is also the **least auditable** option, which is why it is a
> recommendation, not a decision — **OQ5**.

### 2.6 ⚠️ What no API can do — the constraints this design must respect

1. **A product's `name`, `description` and price are immutable via the Platform API.** The sanctioned fix
   is the dashboard; the API-only workaround is archive + recreate, leaving an archived duplicate
   (**T03**).
2. **A collection's visibility state cannot be set by the Platform API.** `POST /collections` accepts no
   state field and **its default state is not documented**. The dashboard, by contrast, **creates
   collections `Hidden` by default** and offers **"Schedule as Public"**.
3. **`PRIVATE` is unreachable from the Platform API** for products and collections alike.
4. **The shop's live/password status is dashboard-only** (or MCP). No API endpoint can change it.
5. **Manual, priced products cannot be created by the API at all** — **T12**.
6. **There is no wall-art template** among the shop's 25 — **T13**.
7. **The template list is mutable** — **T07**.
8. **Write operations require `Manager` or `Super Admin`** permission.

> **On `available`:** `PUT /collections/{id}/availability` is documented only as *"toggle availability"*.
> The help centre lists *"marked as sold out"* as a **separate** collection toggle, which suggests
> `available: false` means **sold-out, not unlisted**. **Do not use `available` as a visibility control.**
> (Inference, flagged — OQ-verify.)

### 2.7 ⭐ The question the whole design rests on

> **Does the Storefront API serve `HIDDEN` products and collections?**

Everything above assumes that staging in Fourthwall keeps items off every public surface. **That
assumption is not documented, and the evidence points both ways:**

| Evidence it is safe | Evidence it is not |
| :--- | :--- |
| The Fourthwall **host** is password-gated, so `/products/<slug>` → 302 → `/password`. | `GET /v1/collections` is documented as *"Returns **all** collections"* — with **no visibility filter**. |
| The KB asserts *"`access: HIDDEN` … means the Storefront API does not serve it at all"*. | That assertion carries **no quoted command**, and the docs never say it. |
| | Product objects returned by the Storefront API **carry an `access` field** — which would be pointless if non-public items were never returned. |
| | Only the built-in **`all`** collection is documented as *"all **public** products"*. That is the single explicit exclusion statement in the docs — and its narrowness is itself a warning. |

**Why it is load-bearing, twice over:**

1. **The Next.js app reads the Storefront API** and is **not behind Fourthwall's password gate**. If the
   API serves hidden items, the 40 staged products and 4 staged collections become visible on the app.
2. **`getCollections()`** (`lib/fourthwall/index.ts:353-356`) **appends any Fourthwall collection not in
   the taxonomy** — so a staged `everyday-carry` would appear in the nav regardless of its state.

**⇒ This is `T00`, it is a Gate-0 blocker, and it is the first thing anyone should measure.** It is a
read-only probe: create **nothing**, fetch `GET /v1/collections` and `GET /v1/collections/{slug}/products`
with the storefront token, and check whether the two **already-existing `HIDDEN`** products
(`austin-skyline-2019-…`) appear. That costs nothing and settles the design.

---

## 3. The product, decomposed

### C1 — The 10 artworks

Five are fixed by the brief (the art already on mugs and tees); five are chosen. All ten are `Available`,
all JPEG, **all 2100px wide**.

| # | Slug | Dimensions | Short side | 1500px gate | Series | Origin? |
| :-- | :--- | :--- | ---: | :---: | :--- | :---: |
| 1 | `today` | 2697×3851 | 2697 | **PASS** | Pop Surrealism & Folklore | |
| 2 | `odoroita-sakana` | 2100×1571 | 1571 | **PASS** | Monsters & Kaiju | |
| 3 | `the-martian-2` | 2100×1526 | 1526 | **PASS** | Atomic Pop & Sci-Fi | |
| 4 | `the-martian` | 2100×1519 | 1519 | **PASS** | Atomic Pop & Sci-Fi | ✓ |
| 5 | `gondoleu` | 2100×1476 | 1476 | fail — 98.4% | Monsters & Kaiju | |
| 6 | `empopatya` | 2100×1474 | 1474 | fail — 98.3% | Monsters & Kaiju | ✓ |
| 7 | `gianondor` | 2100×1469 | 1469 | fail — 97.9% | Monsters & Kaiju | ✓ |
| 8 | `austin-2019` | 2100×1467 | 1467 | fail — 97.8% | Austin Iconic & Texas Pop | ✓ |
| 9 | `the-persistence-of-cats` | 2100×1440 | 1440 | fail — 96.0% | Pop Surrealism & Folklore | ✓ |
| 10 | `beat-bop` | 2100×1400 | 1400 | fail — 93.3% | Pop Surrealism & Folklore | |

Rows 1–4 are the live mugs; row 8 is on the live mug **and** the live tee. Rows 5–7 and 9–10 are chosen
for **series balance** (4 Kaiju, 3 Pop Surrealism, 2 Atomic, 1 Austin Iconic) and because each already
has a catalogue record.

> ⚠️ **Row 10 (`beat-bop`) cannot ship as-is — its image URL is 404 (§1.5).** The measured substitute
> changes this split to **1 Austin / 2 Pop / 5 Kaiju / 2 Atomic**; see **OQ8**, which also shows the
> series-balance and ≥1400px constraints cannot both be satisfied.

> ⚠️ **Six of the ten fail the repo's 1500px heuristic by between 1.6% and 6.7%.** The KB already records
> that the gate is *"a quality heuristic, not a hard constraint"* and that *"real products were created
> from a 2100×1467 source and the mockups looked good."* **This is the largest open question in the
> document — [D4](#d4--eligibility-is-per-region-not-a-blanket-1500px) and OQ1.**

> ⚠️ **"Greetings from Austin" — the studio's most famous mural — is `Sold` at 576×376.** It cannot be
> merchandised from this catalogue. Of the 6 `Available` Austin-iconic works, only `austin-2019` exceeds
> 800px. **The "Austin Iconic" promise is a sourcing problem, not an engineering one.**

### C1a — Source masters: measured, and they do not rescue the gate

A batch of 27 candidate source images was supplied for comparison on **2026-10-02** and measured
(`.workbuddy-ai/scripts/full-match.py`, `quality-diff.py`). Two questions were asked; both now have
evidence-backed answers.

**Q1 — is any local file higher-resolution than the catalogue? No.** 22 of 27 are the *same artwork at
the identical pixel dimensions* — perceptual-hash distance **0–1 of 128 bits**, i.e. the same image, not
merely a similar one. Nine of the ten artworks above have a local master:

| # | Slug | Local master | Dimensions | Higher-res? |
| :-- | :--- | :--- | :--- | :---: |
| 1 | `today` | `2019today-copy.jpg` | 2697×3851 | no — identical |
| 2 | `odoroita-sakana` | `OdoritaSakana.jpg` | 2100×1571 | no — identical |
| 3 | `the-martian-2` | `themartian2-copy.jpg` | 2100×1526 | no — identical |
| 4 | `the-martian` | `themartian1-copy.jpg` | 2100×1519 | no — identical |
| 5 | `gondoleu` | `gondeoleu.jpg` | 2100×1476 | no — identical |
| 6 | `empopatya` | `empopatya.jpg` | 2100×1474 | no — identical |
| 7 | `gianondor` | `gianondor.jpg` | 2100×1469 | no — identical |
| 8 | `austin-2019` | `austin2019-copy.jpg` | 2100×1467 | no — identical |
| 9 | `the-persistence-of-cats` | `2019cats-copy.jpg` | 2100×1440 | no — identical |
| 10 | `beat-bop` | **none** | — | **and its CDN URL is dead (§1.5)** |

> ⚠️ **This closes the "maybe the masters are bigger" branch of OQ1.** The six failing artworks still fail.
> **The only real fix remains sourcing new 300 DPI scans.**

**Q2 — are the local files better *quality*? Yes, substantially — and the build currently uses the worse
copy.** Local files are JPEG quality ≈**98**; the Cloudinary-served catalogue copies are quality **71–93**
(mean 85). Peak per-pixel deltas reach **158/255**, with PSNR as low as **26 dB** (`pollockjr`). These are
not rounding differences; they are visible re-encode artifacts.

This matters because **`scripts/publish-merch-to-fourthwall.ts:405` uploads `artwork.image.url`** — the
compressed CDN copy, never a local master. So every product this build creates inherits the q85 re-encode.

*Recommendation:* **point the build at the local masters for the 9 artworks that have one** (a source-path
change, not a new pipeline), and keep the CDN URL as the fallback. This buys real print quality at zero
API cost. It does **not** change the pixel count, so D4 and OQ1 stand unchanged.

### C2 — The 4 collections

Four collections replace the 7 taxonomy handles. **Each name is chosen so its derived slug equals the
existing taxonomy handle**, because the slug derives from `name` and the taxonomy is the source of truth
for the nav.

| Collection name | Derived slug | Taxonomy handle | Products |
| :--- | :--- | :--- | ---: |
| `Kitsch CPG` | `kitsch-cpg` | `kitsch-cpg` — **exists** (`col_qMf6-GzBQlytUmha907_Tg`) | 10 |
| `Apparel` | `apparel` | `apparel` — roadmap | 10 |
| `Desk Art` | `desk-art` | `desk-art` — roadmap | 10 |
| `Everyday Carry` | `everyday-carry` | **⚠️ no handle exists** | 10 |

> ⚠️ **`everyday-carry` has no `lib/taxonomy.ts` entry**, which puts one code file in scope for a release
> that is otherwise Fourthwall-only. **OQ3.**

### C3 — The product matrix

10 artworks × 4 product types = **40 products**, from **6 templates**.

| Collection | Template | Template id | Base | Target | Margin |
| :--- | :--- | :--- | ---: | ---: | ---: |
| `kitsch-cpg` | White Glossy Mug | `pro_4v5OfYhyRx62KW5b7Oj6Uw` | $5.95 | `$22.00` | $16.05 |
| `apparel` | **⚠️ Comfort Colors Tee — id unknown** | *unrecovered* | ~$15.45 | `$34.00` | ~$18.55 |
| `desk-art` | Hardcover Journal – Blank | `pro_-wHFTR2xRbO-5bYAvLSVng` | $15.50 | `$32.00` | $16.50 |
| `desk-art` | Snap Case for iPhone® | `pro_fur0cz31TDC0tRUiYzJXXw` | $12.95 | `$28.00` | $15.05 |
| `everyday-carry` | All-Over Print Backpack | `pro_149a5b8d86ae4219aa` | $32.95 | `$58.00` | $25.05 |
| `everyday-carry` | All-Over Print Fanny Pack | `pro_22456d0504af4ae38f` | $21.37 | `$38.00` | $16.63 |

> ⚠️ **The Comfort Colors tee is not in the current 25-template list.** It appeared in one call and was
> replaced by a Drawstring Bag in the next (**T07**) — yet the live tee product exists, so the template
> existed. **Recovering its id is a Gate-1 blocker (T02).** Two routes: read it off the existing
> `austin-skyline-2019-comfort-colors-…` product record, or re-fetch the template list until it
> reappears. Fallback: **AS Colour Unisex Premium T-Shirt** (`pro_EJBSRKhJSd2unv4ZnGKwdQ`, DTG, $16.32).

> ⚠️ **Enumerate templates by paging, not by name.** `GET /product-templates/page/{page}` is **1-indexed
> with no page-size parameter**; iterate until you have collected `total`. Use `GET
> /product-templates/{productId}` for the full record. **`productId` is the stable key** — `name` is not
> unique, and the summary's `thumbnail` is imgproxy-generated and explicitly **not durable**.

> ⚠️ **Every price is a `profitMargin` over a base cost that must be re-read at build time.**
> `profitMargin` is a **USD amount**, not a percentage and not a final price
> (`lib/fourthwall/merch.ts:188-196`). `profitMarginForTarget()` already converts correctly and returns
> `null` rather than creating an unsellable product.

> ⚠️ Because the margin is **per product, not per variant**, one margin cannot hit one price across sizes.
> At $16.05 the mug lands at **$22.00 / $24.55 / $26.55** for 11oz / 15oz / 20oz. **OQ6.**

### C4 — The staged build

All 40 products are created with **`publishOnCreate: false`**, leaving each `HIDDEN`. No publishing call
is made. The build is **idempotent**, **dry-runnable by default**, and **resumable** (§2.3a).

### C5 — The launch gate (specified here, executed in Phase B)

| Step | Operation | Surface |
| :--- | :--- | :--- |
| 1 | Verify every product reads `HIDDEN` and every collection resolves | Storefront API, cache-busted |
| 2 | Flip products `HIDDEN` → `PUBLIC` | `PUT /products/{id}/state` ×40, or Eli Actions |
| 3 | Flip collections `Hidden` → `Public` | Dashboard, or the "Schedule as Public" control |
| 4 | Un-gate the shop | Dashboard: Site Design → status tag → Live → Save |
| 5 | Verify a guest browser can browse and reach checkout | Browser probe |

> ⚠️ **Steps 2–4 are a single unit.** A public catalogue behind a password gate is fine; a public
> catalogue behind an *open* shop is live. **Do not un-gate before the products are verified.**

### C6 — Verification

Every claim this release makes must be re-derivable by a command. **The build's own report is not
evidence; the API's answer is.** Verification must be cache-busted (**T11**) and must read the **detail**
endpoint, never the list (**T10**).

---

## 4. Design decisions

### D1 — The Platform API builds; the dashboard stages and publishes

The build is a script: auditable, dry-runnable, idempotent, and already half-written
(`scripts/publish-merch-to-fourthwall.ts`). The operations the API cannot perform — `PRIVATE`, collection
state, and the shop's live status — are **manual, one-off, dashboard operations**, documented as such
rather than automated.

*Rationale:* the repo's rule is that integration work uses *"documented HTTP and first-party CLIs, which
are auditable and leave no standing capability behind"* (`docs/agentic/mcp/README.md`).

### D2 — Collections are created in the dashboard; products are attached by API

**Revised 2026-10-02.** The API cannot set a collection's state and **does not document its default**.
The dashboard **creates collections `Hidden` by default** and offers **"Schedule as Public"**.

| Option | Verdict |
| :--- | :--- |
| **A — create collections via `POST /collections`** | Default state undocumented. Risks a **public** collection the moment it returns. |
| **B — create collections in the dashboard, attach products via API** *(chosen)* | Lands `Hidden` by default; the product list stays scriptable via `PUT /collections/{id}/products`. |

**B is chosen.** It removes the entire reliance on the password gate for collection safety, and it turns
collection visibility into a real, dashboard-controlled launch gate rather than something we hope the API
gets right.

**Division of labour:**

| Step | Surface |
| :--- | :--- |
| Create the 4 collections (they land `Hidden`) | **Dashboard** — 4 manual steps, once |
| Attach the 40 products (full list, re-runnable) | **API** — `PUT /collections/{id}/products` |
| Flip to `Public` at launch | **Dashboard** |

> ⚠️ **This does not by itself make a staged collection invisible to the Next.js app** — see
> [§2.7](#27--the-question-the-whole-design-rests-on). The dashboard default is a genuine improvement, not
> a proof.

### D3 — Products are created `HIDDEN`; `PRIVATE` is reserved for mistakes

`HIDDEN` is the API default and the right default here: it survives a build interruption without exposing
anything, and it is what the two existing `austin-skyline-2019` products already do. `PRIVATE` is held
back for anything that must be unreachable even by direct URL — a mistyped product, a price under
investigation.

### D4 — Eligibility is per-region, not a blanket 1500px

The repo's `FOURTHWALL_MIN_ACCEPTED_PX = 1500` is applied to `min(width, height)` for every artwork
(`lib/fourthwall/merch.ts:67-100`). It rejects **6 of the 10 chosen artworks by under 7%**, and the KB
already concedes it is a heuristic the API does not enforce.

The authoritative requirement is **per template area**, published by the API itself:
`GET /product-templates/{id}` → `customizableAreas[].dimensions` → `{ dpi, pixelsWidth, pixelsHeight,
inchesWidth, inchesHeight }`. A mug area is recorded as **2700×1050 @ 300 DPI**.

**Decision:** replace the blanket gate with a **per-region check** that reports the DPI actually achieved
at the region's print size, and fails only when the artwork cannot fill the region at an acceptable DPI.
`FOURTHWALL_MIN_ACCEPTED_PX` becomes a **warning threshold**, not a gate.

*Rationale:* a blanket short-side rule cannot distinguish a mug region (2700×1050) from a backpack panel,
so it is simultaneously too strict for some regions and too lax for others. The API publishes the real
number; use it.

> ⚠️ **This changes a tested rule.** `evaluateArtworkForMerch` has unit tests. Change their semantics
> deliberately, in the same commit, with the old behaviour recorded — do not loosen a constant until the
> tests pass.

> **Region names are template-specific and not enumerated.** Read `customizableAreas[].regionId` per
> template (**T08**). `placementStrategy` accepts `AUTO` (default) · `FILL_ALL` · `FULL_REGION` ·
> `PLACEMENT_ID`; `AUTO` uses the product's automation defaults and **falls back to fill-all for mugs and
> stickers**, which is why a hardcoded `"front"` works for a tee and is rejected for a mug.

### D5 — Template ids are pinned in config and asserted at build time

**T07**: the template list changed mid-session. Resolving a template by name can silently build the wrong
product. The 6 ids go in a committed manifest, and the build **asserts each id still exists and still has
the expected region** before creating anything.

### D6 — No MCP server is enabled

MCP adds write capability the Platform API lacks (§2.4) — but **not the capability this release needs**.
Everything the build does, REST already does. Enabling it would grant a **standing, interactive,
OAuth-authenticated capability to mutate the live shop**, in a repo whose MCP baseline is deliberately
empty and whose rule 4 is *"Know the blast radius before enabling. A server that can write to Fourthwall
can soft-delete products."*

Revisit in Phase B, or via **OQ2**.

### D7 — A committed manifest is the source of truth

The 10 artworks, 4 collections, 6 template ids, price targets and region choices go into a committed
JSON manifest. The build reads it; it is not encoded in CLI flags. This makes the catalogue **reviewable
in a PR** before it exists, and makes the build reproducible rather than a sequence of remembered
commands.

### D8 — The build is paced and resumable

`POST /products` is **5/min** (§2.3a). The build must pace itself, honour `OPEN_API_TOO_MANY_REQUESTS`
with backoff, and be **safe to re-run**: name-based de-duplication already gives it this, and `--force`
is the deliberate escape hatch. **A half-built catalogue must be a resumable state, not a corrupted one.**

---

## 5. Release plan

**Stop at any gate.** No gate may be skipped: there is no bulk delete and no product-field update, so a
wrong product is an archive-plus-recreate, and an archived product keeps its name.

### Gate 0 — Decisions closed, and the design validated. No writes.

- [ ] **`T00` — measure whether the Storefront API serves `HIDDEN` items** ([§2.7](#27--the-question-the-whole-design-rests-on)). **This gates everything.**
- [ ] **OQ1** answered — the 1500px question, and whether PNG masters will be sourced.
- [ ] **OQ4** answered — is `apparel` viable from JPEG sources?
- [ ] **OQ3** answered — does `everyday-carry` get a taxonomy handle?
- [ ] **OQ2** answered — API-only, or is the MCP in scope for the launch flip?
- [ ] `git checkout -- tsconfig.json` before staging anything.

### Gate 1 — The manifest is reviewed. No writes.

- [ ] The manifest lists exactly 10 artworks, 4 collections, 6 pinned template ids.
- [ ] **Every template id re-fetched**; `customizableAreas[].regionId` + `dimensions` recorded (**T02**).
- [ ] The Comfort Colors tee id recovered, or the fallback chosen (**C3**).
- [ ] Each price target converts to a positive `profitMargin` against the **live** base cost.
- [ ] **No write has occurred.**

### Gate 2 — The build runs, dry first

```bash
# dry run — must create nothing, must print the full intended plan
npx tsx scripts/publish-merch-to-fourthwall.ts --manifest <path>
# then apply, one template at a time (paced: POST /products is 5/min)
npx tsx scripts/publish-merch-to-fourthwall.ts --manifest <path> --template <id> --apply
```

- [ ] Dry run reports the intended count and **creates nothing**.
- [ ] Apply creates products with **`publishOnCreate: false`**.
- [ ] **Zero `FAILED` lines.** A non-2xx must never be counted as success (**T28**).
- [ ] Any 429 is paced and retried, not counted as a failure (**D8**).

### Gate 3 — The catalogue is verified non-public

```bash
# every product reads HIDDEN, via the DETAIL endpoint (never the list — T10), cache-busted (T11)
curl -s "$SF/v1/products/<slug>?cb=$RANDOM" -H "Authorization: $TOKEN"
```

- [ ] All products exist and read **`HIDDEN`**.
- [ ] All 4 collections resolve, are `Hidden`, and contain the intended product ids (**full list**, **T05**).
- [ ] **The rendered mockup is good — dashboard, eyes only.** No script can do this step.
- [ ] The price reads `$22.00` — not `$0.22`, not `$2200` (**T09**).
- [ ] Variant count is correct — not one `11oz` variant (**T06**).
- [ ] A guest browser gets `302 → /password` for every new product and collection URL.

### Gate 4 — Local gates green

```bash
git checkout -- tsconfig.json
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
```

- [ ] Both green. **Baseline 97 passed / 6 files; the count may only go up.**
- [ ] Any changed eligibility rule has deliberately updated tests (**D4**).

### The programme acceptance test

> **The catalogue exists in Fourthwall, is complete, and is unreachable by a guest.**
> 10 artworks × 4 product types = up to 40 products, all `HIDDEN`, in 4 `Hidden` collections, with the
> shop still password-protected. **Nothing is published.**

---

## 6. Task inventory

| # | Task | Gate | Notes |
| :-- | :--- | :--- | :--- |
| **T00** | **Measure whether the Storefront API returns `HIDDEN` products/collections** | **0** | **§2.7 — read-only probe, gates the design** |
| **T01** | Write the catalogue manifest (10 artworks, 4 collections, 6 template ids, prices) | 1 | D7 |
| **T02** | Re-fetch all 6 template ids; record `regionId` + `dimensions`; **recover the Comfort Colors tee id** | 1 | D5, T08, C3 |
| **T03** | Replace the blanket gate with a per-region DPI check | 1 | **D4** — changes tested code |
| **T04** | Add `PUT`/`DELETE` support to the script's `api()` helper | 2 | It is `GET \| POST` only today |
| **T05** | Make the build read the manifest instead of CLI flags | 2 | D7 |
| **T06** | Make the build iterate all 6 templates in one run | 2 | It does one template per invocation |
| **T07** | Add 429 pacing + backoff, and prove resumability | 2 | **D8**, §2.3a |
| **T08** | Add collection create + `PUT /collections/{id}/products` to the build | 2 | Full-list semantics — T05 |
| **T09** | Add a `--verify` mode: assert every product `HIDDEN`, every collection `Hidden`, variant counts right | 3 | Cache-busted, detail endpoint |
| **T10** | Pass `sizes` explicitly on every apparel and mug product | 2 | **T06** is already live in production |
| **T11** | Create the 4 collections in the dashboard (they land `Hidden`) | 2 | **D2** — manual, 4 steps |
| **T12** | Add the `everyday-carry` taxonomy handle — **or** drop the collection | 0 | OQ3 |
| **T13** | Build the launch-gate runbook (5 steps, §C5) | 3 | Specified, not executed |
| **T14** | Record the 4 new traps + correct T03/T04 in `docs/agentic/traps/register.md` | 4 | Appendix B |
| **T15** | Correct the stale claims in `docs/agentic/stack/fourthwall.md` (incl. the unverified HIDDEN claim) | 4 | Appendix B |
| **T16** | Add the official MCP server + the agentic feature timeline to `docs/agentic/mcp/README.md` | 4 | Appendix B |
| **T17** | Re-register this document in `docs/releases/plans/README.md` | 4 | Already done in the re-scope commit |
| **T18** | **Resolve `beat-bop`** — substitute `jobar` (OQ8) or obtain a replacement image | **0** | **§1.5 — the build hard-fails on a 404** |
| **T19** | Add an **image-URL reachability check** to `--verify` (and to the manifest builder) | 3 | Would have caught §1.5 before the build did |
| **T20** | Point the build at the **local q98 masters** where one exists; CDN URL as fallback | 2 | **§C1a** — a quality win, not a resolution one |

---

## 7. Sequencing and critical path

```
T00 (does the Storefront API serve HIDDEN?) ──┐
T18 (beat-bop is 404 — substitute) ───────────┤
OQ1 (1500px / PNG masters) ───────────────────┼─→ T01 manifest ─→ T02 templates ─→ T03 gate ─→ Gate 1
OQ4 (apparel viability) ──────────────────────┤                                                │
OQ3 (everyday-carry) ─────────────────────────┘                                                ▼
                        T04 PUT helper ─→ T05 manifest ─→ T06 loop ─→ T07 pacing ─→ T08 collections
                                                                                               │
                                                                                               ▼
                                                                            Gate 2 dry ─→ Gate 2 apply
                                                                                               │
                                                                                               ▼
                                                                            T09 verify ─→ Gate 3 ─→ Gate 4
```

**Critical path:** **T00** → OQ1 → T01 → T03 → Gate 1 → T05 → Gate 2.

> **`T00` blocks everything.** If the Storefront API does serve hidden items, then staging in Fourthwall
> does **not** keep the catalogue off the Next.js app, and this release's core premise needs rethinking
> before a single product is created. **Measure it first — it costs one read-only request.**
>
> **OQ1 blocks the artwork set.** If the answer is *"source 300 DPI PNG masters from Rory"*, the 10 may
> change and T01 is void. **Its "maybe we already have bigger files" branch is now closed (§C1a).**
>
> **`T18` blocks the build outright** — not a risk to weigh, a certain failure. `beat-bop`'s URL is 404 and
> `publish-merch-to-fourthwall.ts:405` fetches exactly that URL. Resolve it before Gate 1.

---

## 8. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| :-- | :--- | :--- | :--- | :--- |
| **R0** | **The Storefront API serves `HIDDEN` items, so the "staged" catalogue is visible on the ungated Next.js app** | **Unknown** | **Critical** | **T00 — measure before building anything.** Fallback: `PRIVATE` via the dashboard, or build products last. |
| **R1** | A create payload is wrong and cannot be fixed — no product-field update path (**T03**) | **High** | Medium | Get it right first time; `--force` rebuild; archiving frees the slug. |
| **R2** | The build hits the **5/min** create limit and half-completes | **High** | Medium | **D8** — pace, back off on 429, keep the build resumable. |
| **R3** | A rebuild leaves archived duplicates cluttering the dashboard | High | Low | Expected. Archived items do not count toward plan limits. |
| **R4** | The shop gate is lifted while the catalogue is incomplete | Low | **Critical** | §C5 treats the flips and the un-gate as one unit. State it in the runbook. |
| **R5** | `apparel` cannot be built from JPEG sources | Medium | Medium | OQ4. Precedent: the live tee is DTG+JPEG and rendered. Fall back to sublimation. |
| **R6** | A product is created with only one variant (**T06**, already live) | **High** | Low | T10 — pass `sizes`; assert variant count in `--verify`. |
| **R7** | The 6 sub-1500px artworks print poorly | Medium | Medium | D4; verify each mockup by eye at Gate 3. |
| **R8** | A template id resolves to a different product (**T07**) | Medium | Medium | D5 — pin and assert. |
| **R9** | A stale read is mistaken for a failed write (**T11**) | **High** | Low | Cache-bust every verification. |
| **R10** | ~40 SKUs is too many for a launch — Fourthwall's own guidance says *"one design across 4–6 products"* | Medium | Medium | OQ6. The staged build makes a later trim cheap. |
| **R11** | **T01 stays live** — the storefront still fabricates purchasable originals | — | Medium | Out of scope by decision (§9). **Must** be fixed before un-gating. |
| **R12** | The Comfort Colors tee template never reappears | Medium | Low | Fall back to AS Colour Unisex Premium Tee (**C3**). |
| **R13** | **An artwork's `image.url` is dead, so the build throws** | **Certain** for `beat-bop` | **High** | **T18** — substitute `jobar`, or source a replacement. Nine records affected; **T19** adds a reachability check. |
| **R14** | Products inherit the **q85 CDN re-encode** rather than the q98 master | **Certain** | Low | **T20** — switch the upload source. Print quality only; no effect on the pixel gate. |

---

## 9. Do not do yet

| Deferred | Why | Trigger to revisit |
| :--- | :--- | :--- |
| **Publishing anything** | This release constructs only (R1). | Phase B PRD. |
| **Un-gating the shop** | Same. | Phase B. |
| **Removing the fabricated-catalogue fallback (T01)** | Out of scope. Safe only while gated. | Phase B — **must** land before un-gating. |
| **The UX re-imagining** | Cannot be verified against a catalogue that does not exist yet. | Phase B. |
| **Enabling the MCP server (D6)** | Standing write capability against a live shop. | OQ2, or Phase B. |
| **Rebuilding the 4 live mugs for 15oz/20oz** | Archiving four live products is a publish-phase concern. | Phase B. |
| **Re-homing `gondeoleu` out of `all`** | A publish-phase concern; `all` is not reachable while gated. | Phase B. |
| **Fixing the `gondeoleu` slug typo** | Archive + recreate via API; trivial via the MCP. Cosmetic. | Phase B, or never. |
| **The 15 originals** | Structurally impossible via API (**T12**). | Never, via API. |
| **Wall art** | No template exists (**T13**). | If a print vendor is added. |
| **Extended families** — tumbler, surf cap, hoodie, slides, shoes, drawstring bag | Out of the 4 collections. | A later release. |
| **Eli / ChatGPT-app product creation** | Least auditable path; not needed for a scripted build. | Phase B, or OQ5. |

---

## 10. Open questions

Each carries a recommendation. **A question without a recommendation is a stall.**

**OQ1 — Do we accept the 6 sub-1500px artworks, or source proper masters?**
Six of the ten sit at 1400–1476px on the short side — 93–98% of the repo's heuristic. The KB concedes the
gate is *"a quality heuristic, not a hard constraint"* and that a real product was built from a 2100×1467
source with good mockups.
**The "maybe we already have bigger masters" branch is now closed by measurement (§C1a):** all 22 matched
local files are the *same pixel dimensions* as the catalogue. Nothing on hand is bigger.
*Recommendation:* **accept them for this build and replace the gate with a per-region DPI check (D4).**
Then, **in parallel and off the critical path, ask Rory for 300 DPI PNG masters** — that is the real fix,
it is the only thing that helps `apparel` (OQ4), and it costs nothing to request now. Separately, **use the
local q98 masters as the upload source** for the 9 artworks that have one (§C1a) — that is a quality win
available today, independent of resolution.

**OQ2 — Platform API only, or is the MCP in scope?**
MCP adds product-detail, slug and variant-price editing that REST lacks (§2.4) — none of which this
release needs.
*Recommendation:* **API only for the build (D6).** Reconsider for the *launch flip* in Phase B, where
`update-shop-site-status` and `update-collection-state` would replace manual dashboard steps. Do not
enable it now.

**OQ3 — Does `everyday-carry` get a taxonomy handle, or is it dropped?**
It has no `lib/taxonomy.ts` entry, which puts one code file in scope.
*Recommendation:* **add the handle.** One entry in an array is trivial, and dropping the collection leaves
the 10 bag products with nowhere to live. If the release must stay Fourthwall-only, drop `everyday-carry`
and redistribute those 10 products — but say so explicitly.

**OQ4 — Is `apparel` viable, given every source is JPEG?**
`merch.ts:33-38` records that DTG/DTFx/embroidery require PNG transparency, and all 137 images are JPEG.
**But the precedent cuts the other way:** the live `austin-skyline-2019-comfort-colors-…-t-shirt` is a DTG
product built from a JPEG source, and it rendered. So the rule is a caution, not an enforced gate.
*Recommendation:* **build one tee, verify the mockup by eye, then decide.** Prefer white or light garments,
where an opaque print is not a defect. Do not build ten tees to discover this.

**OQ5 — Who flips the catalogue public — a script, Eli Actions, or the dashboard?**
A script is auditable and reviewable in a PR. Eli Actions is purpose-built for bulk visibility changes
but is **Pro-only and leaves no diff** — and the Pro claim is itself contradicted in Fourthwall's own
docs (§2.5).
*Recommendation:* **a script for products** (`PUT /products/{id}/state`), because this repo's standard is
that every state change is re-derivable by a command; **the dashboard for collections**, because the API
cannot do it (D2). Use Eli Actions only as a cross-check.

**OQ6 — Which size does the mug margin target?**
One `profitMargin` per product, but three base costs. At a margin set from the 11oz target the ladder is
**$22.00 / $24.55 / $26.55**.
*Recommendation:* **keep $22.00 as the visible entry price** and accept the ladder. Rebuilding mugs is the
expensive operation (**T03**); decide once.

**OQ7 — Does the version number stay `v0.2.0`?**
`lib/brand-config.ts:66-101` claims **`v1.1.0` is the current release**, while the tag line has only
`v0.1.0` (**T24**).
*Recommendation:* **keep `v0.2.0`** — it continues the only tag line, and a pushed tag cannot be
renumbered. Relabel the `BRAND_CONFIG.roadmap` entries in the same PR.

**OQ8 — `beat-bop`'s image is dead. Substitute artwork #10, or source a replacement?**
`beat-bop` is `Available`, is chosen artwork #10, and its `image.url` returns **404** (§1.5). The build
fetches that URL at line 405, so it will hard-fail rather than produce a bad product. Nine records share
the defect, but only `beat-bop` is in the ten.

The substitute must satisfy three constraints at once — URL resolves, short side ≥1400px, and series
balance. **Measurement shows the first two and the third are mutually exclusive.** Exactly **4** records
clear the resolution floor, and **all four are Monsters & Kaiju**:

| Candidate | Dimensions | Short side | Local q98 master? |
| :--- | :--- | ---: | :---: |
| `jobar` | 2100×1454 | **1454** | ✓ `jobar.jpg` |
| `osore` | 2100×1445 | 1445 | ✓ `osore.jpg` |
| `gaurdon` | 2100×1444 | 1444 | ✓ `gaurdon.jpg` |
| `kondowari` | 2100×1444 | 1444 | ✓ `kondowari.jpg` |

The best Pop Surrealism alternative, `the-greeting-card-machine`, is **1050×791** — it would *lower* the
floor rather than raise it. There is no Pop Surrealism record both `Available` and ≥1400px.

*Recommendation:* **substitute `jobar`** — largest of the four (1454px, +54px over `beat-bop`), a resolving
URL, and a local q98 master. **Accept that the series split becomes 1 Austin / 2 Pop / 5 Kaiju / 2 Atomic**
and update §C1's stated "4/3/2/1" to match; do not pretend the split survives. Only if Rory supplies a
replacement image should `beat-bop` stay. Fixing the other 8 broken records is a separate defect ticket,
not this PRD.

---

## 11. Release mechanics

- **Branch:** `feat/merch-catalog-staged` for the build changes; `docs/merch-catalog-staged` if the
  document moves alone. Open the PR as a **draft** while OQ1–OQ8 are unanswered.
- **Register this plan** in [`README.md`](README.md) in the same PR — a plan that is not registered is a
  plan nobody will find.
- **Do not** edit `CHANGELOG.md`, a deployment log, or a canonical context file from a plan.
- **Gates:** `./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/vitest run`. **Both, always**
  (**T15**). Do not add `prettier:check` (**T31**).
- **Before staging:** `git checkout -- tsconfig.json`.
- **Never stage:** `.env*`, `.workbuddy-ai/`, `tsconfig.tsbuildinfo`.
- **This repo is public.** Redact before committing anything derived from a shell session
  (`protocols/documentation.md` §5).
- **No deploy. No push without explicit per-release approval.** `main` is git-connected to Vercel.

---

## Appendix A — Claim → evidence

| Claim | Evidence |
| :--- | :--- |
| `HEAD` = `0ef582e`, tree clean | `git rev-parse HEAD`; `git status --short` |
| Only `v0.1.0` is tagged | `git tag -l` |
| `publishOnCreate` defaults to `false` | `open-api.json` → `create-product` requestBody: *"Defaults to false (product stays hidden)."* |
| `PUT /products/{id}/state` accepts `PUBLIC`/`HIDDEN` only | `open-api.json` → `UpdateProductStateV1Request.description` |
| `access` has four states | `open-api.json` → `OfferAbstractV1.OfferAccessV1.discriminator.mapping` |
| `state` has two states | `open-api.json` → `OfferAbstractV1.OfferStateV1.discriminator.mapping` |
| `PUT /collections/{id}` exists; takes `name`/`description`/`offerIds` | `open-api.json` → `update-collection` requestBody |
| `POST /collections` has no state field; **default state undocumented** | `open-api.json` → `create-collection` requestBody |
| Collection state model is `PUBLIC/HIDDEN/PRIVATE/ARCHIVED` | `open-api.json` → `CollectionStateV1.discriminator.mapping` |
| **The dashboard creates collections `Hidden` by default, with "Schedule as Public"** | `help.fourthwall.com/…/create-a-collection` |
| Collections are **not auto-displayed**; they need a Featured/Collection-List section | `help.fourthwall.com/…/create-a-collection` |
| `available: false` ≈ sold-out, **not** unlisted *(inference)* | `help.fourthwall.com` lists "marked as sold out" as a separate toggle |
| **Rate limits: `POST /products` and `/customizations` = 5/min; `/media/upload-url` = 20/min; default 100/10s** | `docs.fourthwall.com/guides/rate-limiting` |
| 429 body is `OPEN_API_TOO_MANY_REQUESTS` | same |
| MCP at `mcp.fourthwall.com`, OAuth 2.0, read+write, all plans | `docs.fourthwall.com/ai/mcp`; `help.fourthwall.com/…/connect-ai-assistants-to-fourthwall-with-mcp` |
| MCP adds `update-offer`, `update-offer-slug`, `bulk-update-offer-variant-prices`, `update-collection-state` | MCP tool reference, `docs.fourthwall.com/ai/mcp` |
| MCP tool **parameters are not documented**; server returns 401 without OAuth | `POST https://mcp.fourthwall.com` → 401 + `WWW-Authenticate: Bearer resource_metadata=…` |
| MCP docs launched Apr 2026; write tools Jun 2026 | `docs.fourthwall.com/guides/changelog` |
| Eli Actions performs bulk visibility changes | `help.fourthwall.com/…/eli-ai-actions` (updated 2026-05-27) |
| Eli documented as **Pro**, contradicting the marketing FAQ | same, vs `fourthwall.com/ai-assistant-eli` |
| ChatGPT & Claude app: *"Create a t-shirt with this design"* | `docs.fourthwall.com/ai/ai-app` (Jul 2026) |
| Title/description generator | `help.fourthwall.com` (2026-05-01) |
| Adobe Express in Product Designer | `help.fourthwall.com` (2026-08-07) |
| "Create design products" is labelled **Beta** | `docs.fourthwall.com/guides/changelog` (May 2026) |
| Write ops require Manager or Super Admin | `docs.fourthwall.com/ai/mcp` |
| **The Storefront API documents no visibility filter; `GET /v1/collections` "Returns all collections"; only `all` is documented as public-only; products carry `access`** | `open-api-docs/storefront.json`; `docs.fourthwall.com/storefront/products` |
| `GET /product-templates/page/{page}` is 1-indexed with no page-size param | `open-api.json`; docs |
| Template summary `thumbnail` is imgproxy-generated and **not durable** | docs |
| `placementStrategy` ∈ `AUTO`/`FILL_ALL`/`FULL_REGION`/`PLACEMENT_ID`; `AUTO` falls back to fill-all for mugs/stickers | `open-api.json` → `ProductDesignRegionV1`; create-design-products guide |
| Media flow: presigned URL (~6h) → PUT to GCS → register → `imageId`; formats and size limit **not documented** | `docs.fourthwall.com/guides/create-design-products` |
| Shop id, collection ids, product records | `GET /open-api/v1.0/shops/current`, `/collections`, `/products` (2026-10-01) |
| 4 of 42 `Available` artworks clear 1500px | `lib/fourthwall/rory-artworks-data.json`; reproduces `stack/artwork-catalogue.md` |
| The 10 chosen artworks are all `Available`, JPEG, 2100px wide | same file, measured 2026-10-02 |
| 6 of the 10 fail the gate by 1.6–6.7% | same file: 1476, 1474, 1469, 1467, 1440, 1400 |
| `greetings-from-austin` is `Sold` at 576×376 | same file |
| Shop is `PASSWORD_PROTECTED`; `/checkout` is ungated | `fourthwall.md` §5 (**T14**) |
| The script's `api()` helper is `GET \| POST` only | `scripts/publish-merch-to-fourthwall.ts:148` |
| `evaluateArtworkForMerch` gates on `min(width,height)` | `lib/fourthwall/merch.ts:67-100` |
| DTG/DTFx/embroidery documented as requiring PNG transparency | `lib/fourthwall/merch.ts:33-38` |
| A mug area is 2700×1050 @300 DPI | `fourthwall.md` §4 (**T08**) |
| `getCollections()` appends any Fourthwall collection not in the taxonomy | `lib/fourthwall/index.ts:353-356` (**T04**) |
| Template list is mutable; `total: 601` is platform-wide | **T07** |
| No wall-art template | **T13** |
| The 25-template inventory with ids and base costs | 2026-10-01 revision of this document, §1.4 |

---

## Appendix B — Documentation to update

| Document | Change | When |
| :--- | :--- | :--- |
| `traps/register.md` **T03** | Still true for product *fields*, but **narrow it** — `PUT /products/{id}/state` and `/availability` exist. | This release |
| `traps/register.md` **T04** | **Stale.** `PUT /collections/{collectionId}` exists and takes `name`/`description`. The orphan risk stands; the *"cannot be renamed"* claim does not. | This release |
| `traps/register.md` | **Four new entries**: (1) `HIDDEN` is still purchasable by direct URL; (2) `PRIVATE` is unreachable from the Platform API; (3) a collection's state cannot be set by the Platform API; (4) **`POST /products` is 5/min** — a naive 40-product loop will half-complete. | This release |
| `traps/register.md` | **Two more from the 2026-10-02 image pass**: (5) **a catalogue `image.url` can be a dead placeholder** — a `/v1/` upload-version segment 404s 9/9 times while real version ids resolve 128/128, so *"the record exists"* does not mean *"the image exists"*; (6) **the CDN copy is a lossy re-encode** (q85 vs the q98 master), so *"same pixels"* on a dimension check does not mean *"same print quality"*. | This release |
| `traps/register.md` **T05–T11** | Unchanged — all still reproduce. | — |
| `stack/fourthwall.md` §3 | Narrow the *"no update endpoint"* claim; add `/state` and `/availability` and the four-state access model. | This release |
| `stack/fourthwall.md` §3.3 | Correct the *"name, description and visibility cannot be changed"* claim. | This release |
| `stack/fourthwall.md` §3.4 | Correct the *"no draft state to hide behind"* reasoning — the dashboard creates collections `Hidden`. | This release |
| `stack/fourthwall.md` §6 | **Flag the unverified claim** that the Storefront API does not serve `HIDDEN` items — it carries no evidence, and §2.7 shows it is load-bearing. Replace with the `T00` measurement. | **This release — highest priority** |
| `stack/fourthwall.md` | Add: the rate-limit table, the official MCP server, the four-surface write matrix (§2.2), and the collection-visibility gap. | This release |
| `stack/artwork-catalogue.md` | Add the per-region finding (**D4**): the gate is not merely a heuristic, it is the **wrong shape**. | This release |
| `mcp/README.md` | Add Fourthwall's official MCP server to *"Servers that would genuinely fit"*, with the OQ2 verdict and the Apr/Jun 2026 dates. | This release |
| `docs/releases/plans/README.md` | Re-register this document as re-scoped; update the *"What v0.2.0 actually requires"* table. | ✅ done in the re-scope |
| `lib/fourthwall/merch.ts` | `FOURTHWALL_MIN_ACCEPTED_PX` becomes a warning threshold, not a gate (**D4**). | This release |
| `lib/taxonomy.ts` | Add `everyday-carry` — if OQ3 resolves that way. | This release |
| `docs/agentic/VERSION` + `CHANGELOG.md` | **MINOR** — new traps and corrected stack facts. | This release |
