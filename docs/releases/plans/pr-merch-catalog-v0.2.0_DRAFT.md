# DRAFT — PR plan: v0.2.0 "Sellable Storefront"

| | |
| :--- | :--- |
| **Status** | DRAFT — not approved, not started. Blocked on OQ1, OQ2, OQ3 |
| **Author** | Buddy (agent) |
| **Created** | 2026-10-01 |
| **Supersedes** | nothing. Amends `lib/taxonomy.ts` (the merchandising design) |
| **Depends on** | nothing merged. Touches the same new `docs/` tree as PR #2 — merge one first |
| **Scope** | Re-scope the storefront to Fourthwall-fulfillable product/collection types, seed a 10-artwork catalogue, and stop the site advertising products that cannot be bought |
| **Release** | `v0.2.0` — see OQ1, the version number is contested |

> This is a **draft**. It is written before any implementation so the design can be reviewed and
> rejected cheaply. Nothing here is implemented. No product has been created or archived.

---

## 0a. Decisions taken (2026-10-01)

Four questions were answered by Jaden. They are settled; the rest of this document reflects them.

| # | Decision | Consequence |
| :--- | :--- | :--- |
| OQ1 | **`v0.2.0`.** Continue the tag line. | T15 stays in scope: the `v1.x` roadmap labels in `brand-config.ts` / `docs-content.ts` must be relabelled so no document claims a current release that has no tag |
| OQ2 | **Publish both hidden Austin Skyline products**, *and* confirm the shop's protection status | Verified — see §1.2. The gate covers browsing, **not `/checkout/`**. R2 is downgraded from "cannot be bought from" to a launch-readiness blocker |
| OQ4 | **The $4,500 `gondeoleu` price is intentional — it is an original.** | It must **not** sit in `all` beside $22 mugs. It moves to the Originals/inquire surface (D4, OQ8). The slug typo is cosmetic and now optional |
| OQ7 | **Rebuild the four mugs at Gate 3** to add 15oz/20oz | Gate 3 grows by one rebuild step plus a `PUT /collections/{id}/products` re-point |

**New scope added in the same answer** (Jaden, verbatim): *"please intelligently rename/reword/remove/
reimagine shop ux, and congruency with Fourthwall patterns or conventions of high converting ecommerce."*

That is a **capability, not a footnote** — it is captured as **C8** in §2 and as T17–T21 in §5. It
widens Phase B from "remove what is not sellable" to "make what remains behave like a shop that
converts", including collection naming, copy, and product-page conventions. It does **not** widen the
catalogue: the 10 artworks and the 4 collections stand.

---

## 0. What this document is, and what it is not

**Is:** a release plan for one front-end + catalogue release, grounded in the live Fourthwall shop as
measured on 2026-10-01.

**Is not:** a design for a new importer, a re-platforming, or a print-quality fix. The single largest
constraint on this programme is the **source artwork**, and no code in this release changes it (§7 R1).

---

## 1. Verified starting state

Everything below was measured this session against the live shop, the live Storefront API, the live
Platform API, or the working tree at `87cf568`. Appendix A carries the claim → evidence rows.

### 1.1 Local and remote agree

`git rev-parse HEAD` = `87cf5682026dc4d8475b880142471444a5fa6183` = `GET /repos/.../commits/main`.
Working tree clean. Only tag: `v0.1.0`. No `CHANGELOG.md`. PR #2 (GitHub OAuth plan) is open as a draft
and owns `docs/releases/plans/pr-gh-oauth_DRAFT.md` — the only plan-document precedent in the repo.

### 1.2 The shop, and exactly what the password gate covers

| | |
| :--- | :--- |
| Shop | `Rory Skagen Art` (`sh_b63dd6c0-033c-4db8-916e-6adeb02a5fe5`) |
| Domain / public domain | `roryskagenart-shop` / `shop.roryskagenart.com` |
| **Status** | **`PASSWORD_PROTECTED`** — reported by `GET /shops/current`, and confirmed by HTTP |

⚠️ **Corrected 2026-10-01 (Jaden reported a guest reaching checkout; verified, and he is right).** The
gate is **not** shop-wide. Measured against `roryskagenart-shop.fourthwall.com` with a browser
user-agent:

| Path | Result |
| :--- | :--- |
| `/` | **302 → `/password`** |
| `/products/the-martian-white-glossy-mug` | **302 → `/password`** |
| `/collections/kitsch-cpg` | **302 → `/password`** |
| `/cart` | **302 → `/password`** |
| `/password` | 200 — *"Coming soon \| Rory Skagen Art"* |
| **`/checkout`** | **301 → `/checkout/` → 200.** A real page: `<title>Checkout – Fourthwall</title>`, `<body id="app-checkout">`. **Not gated.** |
| `/login`, `/account`, `/sign-in` | 403 |
| `/robots.txt`, `/sitemap.xml`, `/platform/analytics.json` | 200 |

So: **browsing is gated; checkout is open.** The earlier note in this repo's memory that the shop
"cannot be bought from" was too strong. What is actually true:

- A guest cannot *discover* products on the gated host — every browse path bounces to `/password`.
- A guest **can** reach `/checkout/`, and the Storefront cart API is live and token-authenticated
  (`POST /v1/carts` with `storefront_token` → `400` only because a required `items` array was missing;
  without the token → `401`). So **the purchase path is plausibly functional for real products.**
- The `/password` page's canonical URL is `https://shop.roryskagenart.com/password`, i.e. Fourthwall
  treats the **custom domain** as the canonical host of the gated storefront.

**Consequence for this plan:** the gate blocks *discovery*, not *purchase*. That makes the front-end
refactor the load-bearing piece — the Next.js app is the only ungated storefront — and it means R2 is a
**launch-readiness** issue (nobody arriving cold sees a shop), not a hard blocker on checkout.

### 1.3 What is actually in Fourthwall

**Collections — 3, all `PUBLIC`:**

| Name | Slug | id | Products |
| :--- | :--- | :--- | :--- |
| Kitsch CPG | `kitsch-cpg` | `col_qMf6-GzBQlytUmha907_Tg` | 4 |
| featured | `featured` | `col_m7hZOp3nRpyUjhENpvl6Sw` | 1 |
| All Products | `all` | `col_k2tFEAvQQfyoVF1PYIi7sg` | 5 |

**Products — 8 records, of which 5 are visible to a customer:**

| Product | State | Access | Price | Note |
| :--- | :--- | :--- | :--- | :--- |
| `odoroita-sakana-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | 11oz only |
| `the-martian-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | 11oz only |
| `the-martian-ii-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | 11oz only |
| `today-atomic-sunrise-white-glossy-mug` | AVAILABLE | PUBLIC | $22.00 | 11oz only |
| `gondeoleu` | AVAILABLE | PUBLIC | **$4,500.00** | see OQ4, OQ5 |
| `austin-skyline-2019-white-glossy-mug` | AVAILABLE | **HIDDEN** | $22.00 | invisible on the storefront |
| `austin-skyline-2019-comfort-colors-garment-dyed-heavyweight-t-shirt` | AVAILABLE | **HIDDEN** | $34.00 | invisible on the storefront |
| `the-martian-white-glossy-mug` (2nd record) | SOLD_OUT | ARCHIVED | $22.00 | soft-deleted duplicate |

So the customer-facing catalogue is **5 products**: four $22 mugs and one $4,500 item. The tee and mug
carrying *Austin Skyline 2019* — the artwork named in the brief — are currently **hidden**.

`unitPrice.value` is a **dollar amount**, not cents: `gondeoleu` reads `4500` and the Storefront API
serves it as `$4500 USD`, while the mug's `unitCost` reads `5.95` against a $5.95 template base cost.
This resolves an apparent 100× inconsistency between products; there is none.

### 1.4 What Fourthwall can produce — the live 25 templates

`GET /open-api/v1.0/product-templates` returns **25** templates for this shop. The response also carries
`total: 601`, which does **not** match the 25 returned and does not move when `size`/`page` change —
treat `total` as the platform-wide catalogue count and the 25 as authoritative for this shop.

| Method | Template | Template id | Base |
| :--- | :--- | :--- | :--- |
| SUBLIMATION | White Glossy Mug | `pro_4v5OfYhyRx62KW5b7Oj6Uw` | $5.95 |
| SUBLIMATION | Snap Case for iPhone® | `pro_fur0cz31TDC0tRUiYzJXXw` | $12.95 |
| SUBLIMATION | Men's Slides | `pro_qNudZcUDRb6bwV4IK3GxBA` | $32.50 |
| SUBLIMATION | Men's High Top Canvas Shoes | `pro_y9TCXB9rQRizgS4WXaHHtg` | $43.00 |
| SUBLIMATION | All-Over Print Drawstring Bag | `pro_9225cd05703244a291` | $15.25 |
| UV | Hardcover Journal – Blank | `pro_-wHFTR2xRbO-5bYAvLSVng` | $15.50 |
| UV | Hardcover Bound Notebook \| JournalBook® | `pro_SJmfUn0YSOOwCATTBEoQKw` | $12.71 |
| UV | Sherpa Vacuum Tumbler & Insulator | `pro_tC5lJsKHR_qTF1VlrNpsoQ` | $18.95 |
| ALL_OVER_PRINT | All-Over Print Backpack | `pro_149a5b8d86ae4219aa` | $32.95 |
| ALL_OVER_PRINT | All-Over Print Fanny Pack | `pro_22456d0504af4ae38f` | $21.37 |
| DTG | Gildan Ultra Cotton Long Sleeve T-Shirt | `pro_6ae602fcb22447bfbc` | $14.79 |
| DTG | AS Colour Unisex Premium T-Shirt | `pro_EJBSRKhJSd2unv4ZnGKwdQ` | $16.32 |
| DTG | Bella+Canvas Supersoft Hoodie | `pro_Tt13ahLqQmOs0lgYd-uRgw` | $31.06 |
| DTG | Gildan Classic Hoodie | `pro_gUu4CvXsRm-BxogjB89KzA` | $22.20 |
| DTG | Bella+Canvas Women's Micro Rib Raglan Baby Tee | `pro_ax_jlOVKTk--CLvnuKupgw` | $16.95 |
| DTG | Stanley/Stella Women's Organic Crew Neck Sweatshirt | `pro_EfhZQjDdRDqvrbXEc6r9wA` | $32.88 |
| DTFX | AS Colour Unisex Premium T-Shirt | `pro_3WAxijeHRa60iWOTsmDCeA` | $16.32 |
| DTFX | Gildan Classic Crewneck Sweatshirt | `pro_60zZalF0S_qvXk3of8Sfeg` | $18.79 |
| DTFX |  AS Colour Surf Cap | `pro_tm8d4qRXTX-v8IX-TAlbYg` | $20.84 |
| DTFX | Bella+Canvas Supersoft Long Sleeve T-Shirt | `pro_6z4GUurATC2-mwQ_hms_5g` | $18.29 |
| DTFX | Bella+Canvas Unisex Midweight Sweatpants | `pro_V7qS5M2SQheH2blj_fACEQ` | $36.50 |
| DTFX | Bella+Canvas Women's Garment Dye Shorts | `pro_1BGgRpFrQCSYM5ErNQXkkA` | $24.75 |
| EMBROIDERY | Flexfit Visor | `pro_79afd248d4ff4f6da4` | $18.50 |
| EMBROIDERY | Bella+Canvas Baby Jersey Short Sleeve Tee | `pro_zq1WLUHfRSC2G8L6BNWZVA` | $14.21 |
| EMBROIDERY | Gildan Classic Hoodie | `pro_955a8fc6bc9b4b068f` | $23.43 |

⚠️ **The set changed mid-session.** An earlier call returned *Comfort Colors Garment-Dyed Heavyweight
T-Shirt* ($15.45, DTG) and no Drawstring Bag; a later call returned the Drawstring Bag and no Comfort
Colors. `page`/`size` do not change the result, so this is not pagination — the shop's available set is
mutable. **The Comfort Colors tee is the template behind the live Austin Skyline tee**, so this matters.
Consequence: **pin template ids in config and assert them at apply time; never resolve by name at run
time.** See §7 R4.

**There is no wall-art template.** No poster, no canvas, no metal print. `canvas-prints` and
`metal-litho` are structurally unfulfillable — not a configuration gap.

### 1.5 The front end today

| Surface | File | Problem |
| :--- | :--- | :--- |
| Homepage hero | `app/[currency]/page.tsx:41-106` | Hard-codes "15 original monumental enamel masterworks", "$4k–$28k", "Complete Archive (137 Works)" |
| Homepage chips | `app/[currency]/page.tsx:83-96` | Renders all 7 `PRODUCT_COLLECTIONS`, 5 of which have no products |
| Homepage grid | `components/grid/three-items.tsx:49-52` | Sources `NEXT_PUBLIC_FW_COLLECTION` = `fine-art-originals`, a handle Fourthwall does not have |
| B2B banner | `app/[currency]/page.tsx:144-193` | Advertises volume tiering, tax appraisals, murals — none of it a product |
| Nav | `components/layout/navbar/index.tsx:30-44` | `getCollections()` returns 7 taxonomy + `all` + remote extras → 11 links |
| Category page | `app/[currency]/collections/[handle]/page.tsx:141-146` | Prints "15 Certified Studio Originals Available" for a handle with no Fourthwall collection |

**The load-bearing defect.** `getCollectionProducts()` (`lib/fourthwall/index.ts:359-426`) falls back to
the **local catalogue** whenever Fourthwall returns nothing, and `getProduct()`
(`lib/fourthwall/index.ts:431-465`) does the same. So:

- `/USD/collections/fine-art-originals` renders 15 originals at $5,500–$28,000 that **have no Fourthwall
  product**.
- Each one opens a real product page with a variant selector and an add-to-cart button.
- `addItem` (`components/cart/actions.ts:22-36`) calls Fourthwall with a variant id Fourthwall has never
  seen; on failure `lib/fourthwall/index.ts:481-484` falls back to an **in-process `Map`** cart.
- `redirectToCheckout` (`components/cart/actions.ts:103-118`) then sends the visitor to
  `roryskagenart-shop.fourthwall.com/checkout/?cartId=…`.

A visitor can therefore assemble a cart of $28,000 originals that exists only in one serverless
instance's memory. **Nothing throws. Every page is 200.** This is the reason the release exists.

⚠️ **Corrected 2026-10-01.** An earlier draft of this document said the product-detail fetch
"always 404s". **That was wrong, and it matters.** Measured:

| Call | Result |
| :--- | :--- |
| `GET /v1/products/the-martian-white-glossy-mug?storefront_token=…` | **200** — a real product resolves |
| Same call, **no token** | 401 |
| `GET /v1/products/greetings-from-austin?storefront_token=…` | **404 `OFFER_SLUG_NOT_FOUND_ERROR`** |
| `GET /v1/products/nope-not-real?storefront_token=…` | 404 `OFFER_SLUG_NOT_FOUND_ERROR` |

So only the **list** endpoint `/v1/products` 404s; the **detail** endpoint works. The fallback therefore
fires for exactly the products that should not be on the site — a local-only slug is
indistinguishable, at the API level, from a slug that never existed. That is the whole defect: **the app
treats "Fourthwall says no such product" as "render it from local JSON anyway."**

### 1.6 The artwork ceiling — the constraint that shapes everything

`lib/fourthwall/rory-artworks-data.json`: 137 records, 42 `Available`, 82 `Sold`, 13 `Archived`.
All 137 are JPEG; width/height in the file are the true stored size.

Ranked by shortest side, the top of the `Available` pool is:

| # | Slug | Title | Series | Size | Shortest side |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `today` | Today (Atomic Sunrise) | Pop Surrealism | 2697×3851 | **2697** ✓ |
| 2 | `odoroita-sakana` | Odoroita Sakana | Monsters & Kaiju | 2100×1571 | **1571** ✓ |
| 3 | `the-martian-2` | The Martian II | Atomic Pop & Sci-Fi | 2100×1526 | **1526** ✓ |
| 4 | `the-martian` | The Martian | Atomic Pop & Sci-Fi | 2100×1519 | **1519** ✓ |
| 5 | `gondoleu` | Gondoleu | Monsters & Kaiju | 2100×1476 | 1476 |
| 6 | `empopatya` | Empopatya | Monsters & Kaiju | 2100×1474 | 1474 |
| 7 | `gianondor` | Gianondor | Monsters & Kaiju | 2100×1469 | 1469 |
| 8 | `austin-2019` | Austin Skyline 2019 | Austin Iconic | 2100×1467 | 1467 |
| 9 | `jobar` … `the-cats-of-the-colosseum-2` | — | Kaiju / Pop | 2100×1400–1454 | 1400–1454 |

**Only 4 of 42 `Available` artworks clear the repo's own 1500px gate.** The 1500px rule is a *local*
quality bar from Fourthwall's documentation, not a server rejection — the live Austin Skyline tee was
created from a 2100×1467 source (short side 1467) and the rendered mockup is good.

⚠️ **"Greetings from Austin" — the studio's most famous mural — is `Sold` and only 576×376.** It cannot
be merchandised from this catalogue. Neither can `greetings-from-texas` (576×403), `78704` (576×402),
`austin-postcard` (576×403) or `agave-patch` (576×360). Of the 6 `Available` Austin-iconic works, the
only one above 800px is `austin-2019`. **The "Austin Iconic" merchandising promise is currently
unfulfillable**, and this release must stop the site from making it.

---

## 2. The product, decomposed

Six capabilities. C1–C2 are the catalogue; C3–C6 are the storefront.

| # | Capability | Release |
| :--- | :--- | :--- |
| C1 | A **declarative merch catalogue** — 10 artworks × a defined template matrix × target prices × collection membership — as reviewable data, not script arguments | v0.2.0 |
| C2 | A **seeding run** that creates the products and assigns them to collections, idempotently, with a verified count | v0.2.0 |
| C3 | A **sellable taxonomy** — the storefront navigates only collection types Fourthwall can fulfil | v0.2.0 |
| C4 | **Truthful surfaces** — no page renders a buy box for a product that has no Fourthwall variant | v0.2.0 |
| C5 | **Content that matches the catalogue** — copy names only producible product types | v0.2.0 |
| C6 | A **guard** that fails CI when a storefront surface links to a collection that does not exist in Fourthwall | v0.2.0 |
| C7 | Extended product families — headwear, hoodies, tumblers, footwear, drawstring bag | v0.3.0 candidate |
| C8 | **A shop that behaves like a shop** — collection names, copy and product-page conventions aligned to Fourthwall's own patterns and to high-converting ecommerce norms | v0.2.0 |

### 2.1 The 10 artworks (C1)

The five already on merch are **fixed by the brief**. The other five are chosen for print resolution
first, series spread second:

| # | Slug | Title | Series | Why |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `the-martian` | The Martian | Atomic Pop & Sci-Fi | **on a live mug** |
| 2 | `the-martian-2` | The Martian II | Atomic Pop & Sci-Fi | **on a live mug** |
| 3 | `odoroita-sakana` | Odoroita Sakana | Monsters & Kaiju | **on a live mug** |
| 4 | `today` | Today (Atomic Sunrise) | Pop Surrealism | **on a live mug**; best resolution in the catalogue |
| 5 | `austin-2019` | Austin Skyline 2019 | Austin Iconic | **on a live mug and the live tee**; only usable Austin-iconic image |
| 6 | `gondoleu` | Gondoleu | Monsters & Kaiju | 1476px; already has a live product (see OQ4/OQ5) |
| 7 | `empopatya` | Empopatya | Monsters & Kaiju | 1474px; also a $16,000 original |
| 8 | `gianondor` | Gianondor | Monsters & Kaiju | 1469px; also an $18,500 original |
| 9 | `the-persistence-of-cats` | The Persistence of Cats | Pop Surrealism | 1440px; also a $14,500 original |
| 10 | `beat-bop` | Beat Bop | Pop Surrealism | 1400px |

**Series spread: Kaiju 4 · Pop Surrealism 3 · Atomic Pop & Sci-Fi 2 · Austin Iconic 1.** The imbalance
is forced by §1.6, not chosen. Three of the ten (`empopatya`, `gianondor`,
`the-persistence-of-cats`) are also originals in `originals-data.json`, which gives an
**original-plus-merch cross-sell** — the one productization angle the current site cannot express
because its originals are not purchasable.

### 2.2 The sellable collections (C3) — 4, replacing 7

Collection **names are chosen so the derived slug equals the taxonomy handle**, so
`getCollectionProducts('<handle>')` hits Fourthwall and returns real products with **no code change**.
The slug derives from `name`; there is no collection-update endpoint for name or description.

| # | Name → slug | State | Templates | Artworks | Products |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `kitsch-cpg` | **EXISTS** | White Glossy Mug | all 10 | 10 |
| 2 | `apparel` | NEW | Comfort Colors Garment-Dyed Heavyweight T-Shirt | all 10 | 10 |
| 3 | `desk-art` | NEW | Hardcover Journal + Snap Case for iPhone® | top 5 | 10 |
| 4 | `everyday-carry` | NEW | All-Over Print Backpack + Fanny Pack | top 5 | 10 |

**Top 5** = `today`, `odoroita-sakana`, `the-martian-2`, `the-martian`, `gondoleu` — the five
highest-resolution sources, which is also the five the current mugs already prove.

**Target retail prices** (margin = target − template base; `profitMargin` is a USD amount over base
cost, and is **per product, not per variant**):

| Template | Base | Target | Margin |
| :--- | :--- | :--- | :--- |
| White Glossy Mug | $5.95 | $22.00 | $16.05 |
| Comfort Colors Heavyweight Tee | $15.45 | $34.00 | $18.55 |
| Hardcover Journal | $15.50 | $32.00 | $16.50 |
| Snap Case for iPhone® | $12.95 | $28.00 | $15.05 |
| All-Over Print Backpack | $32.95 | $58.00 | $25.05 |
| All-Over Print Fanny Pack | $21.37 | $38.00 | $16.63 |

⚠️ Because the margin is per product, a single margin cannot hit one target across sizes. At $16.05 the
mug lands at **$22.00 / $24.55 / $26.55** for 11oz / 15oz / 20oz. Either accept the ladder or set the
margin from the 15oz target — **OQ6**.

**Total: 40 products** — 5 live and public, 2 live and hidden, 33 new — across 4 collections.

**Out of scope for v0.2.0 (C7, recommended v0.3.0):** Sherpa Tumbler (UV $18.95), AS Colour Surf Cap
(DTFX $20.84), Bella+Canvas Supersoft Hoodie (DTG $31.06), Men's Slides ($32.50), Men's High Top Canvas
Shoes ($43.00), All-Over Print Drawstring Bag ($15.25), and the DTFX/EMBROIDERY variants of garments
already covered by a DTG template.

### 2.3 C8 — the UX reimagining, scoped

"Rename / reword / remove / reimagine" is four different jobs. Kept concrete:

**Rename.** ⚠️ A collection's slug derives from its name and **cannot be changed** — only its product
list can. So renaming a live collection means recreating it, which leaves the old one PUBLIC and
orphaned, and `getCollections()` (`index.ts:353-356`) appends any Fourthwall collection that is not
already in the taxonomy — so an orphan would **still appear in the nav**. **Do not rename by
recreating.** Instead: the taxonomy already wins over a colliding Fourthwall name — that behaviour is
asserted in `collections.test.ts` ("prefers the taxonomy title over a colliding Fourthwall collection").
So present shopper-facing titles from `lib/taxonomy.ts` (`kitsch-cpg` → *"Mugs & Drinkware"*) while the
slug stays `kitsch-cpg`. For the three **new** collections, choose a name that is both shopper-facing and
slug-clean: *Apparel* → `apparel`, *Desk & Studio* → `desk-studio`, *Bags & Carry* → `bags-carry`. Name
and slug must be decided **before** the create call, because there is no second chance.

**Reword.** The current copy is a wish-list: §1.6 of the taxonomy names ~23 product types of which only
a handful exist as templates. Delete `metal-litho`, `canvas-prints` and every "planned product" line.
Then add the conventional signals the site has none of: materials, care, sizing guidance, shipping
expectation, returns, and a real "ships from" statement. The product description already available from
Fourthwall (`merchDescription()` in `lib/fourthwall/merch.ts:112-115`) is a start, not a finish.

**Remove.** The B2B banner's tax appraisals, murals and volume tiering (`app.tsx:144-193`); "Complete
Archive (137 Works)"; the "15 Certified Studio Originals Available" badge; the `$4k–$28k` hero.

**Reimagine.** A product page that follows what shoppers expect and what Fourthwall's own storefront
does: mockup-led gallery (Fourthwall renders the mockups — the site currently shows the flat artwork),
a variant selector that reflects **real** Fourthwall variants (size and colour), price and add-to-cart
above the fold, breadcrumbs, related products from the same collection, and — for anything not backed by
a Fourthwall product — an **inquire** state instead of a cart button (T12).

**Fourthwall congruency.** The checkout is Fourthwall-hosted and open (§1.2), so the app's job ends at
handing over a valid `cartId`. The two storefronts should read as one brand: the app should adopt the
host's own collection and product naming rather than inventing a parallel vocabulary, and should not
promise capabilities the host does not have.

⚠️ **Explicit non-goal:** C8 does not restyle the site. It changes information architecture, naming and
copy, and it is bounded by what the seeded catalogue can actually deliver.

---

## 3. Design decisions

**D1 — The catalogue is data, not script flags.**
`lib/fourthwall/merch-catalog.ts` exports the 10-slug allowlist, the template matrix (with **pinned
template ids**), target prices, and collection membership. Rejected: passing `--only`/`--template`
per run. The existing CLI resolves templates by name against a set that changed mid-session (§1.4) and
creates one template per invocation, which cannot express a 40-product matrix.

**D2 — Collection membership is declarative, via `PUT /collections/{id}/products`.**
Verified in the authoritative docs: `PUT /open-api/v1.0/collections/{collectionId}/products`,
body `{ "offerIds": ["<uuid>", …] }`, scope `offer_write`, and the docs state it **"sets the full list
of product IDs in the collection"**. Rejected: create-collections-last with `offerIds` on
`POST /collections`. Both work, but the PUT form is re-runnable — it repairs a partial run instead of
duplicating a collection, and collections cannot be renamed or deleted.

**D3 — Merchandise the 10 artworks; do not attempt to sell the originals through the API.**
Rejected: extending the design pipeline to originals. `POST /products` accepts no `price`, `variants`,
`slug`, `stock` or `images`; the only route for a priced one-of-one is a **dashboard-only manual
product**. Rejected: leaving the 15 originals browsable as-is — that is §1.5's defect.

**D4 — The storefront becomes two surfaces: *Shop* (buyable) and *Originals* (inquire).**
Originals keep a single hero + an inquiry CTA and a link to the studio portfolio; they stop being a
15-item purchasable grid. Rejected: deleting originals from the site — the artist's actual business is
originals, and one real manual listing already exists.
**Confirmed by OQ4:** `gondeoleu` at $4,500 is a genuine original listing, not a pricing error. So the
Originals surface is not hypothetical — it has one live product today. It must also be **removed from
the `all` collection**, where it currently sits beside $22 mugs, and re-homed. Note that a manual
product is dashboard-only, so this half of the store is maintained by hand, not by the seeding script.

**D5 — Rebuild the four live mugs with explicit sizes.**
The live mugs carry a single `White, 11oz` variant because `sizes` was omitted at create time. There is
no update endpoint, but archiving **releases the slug**, so a rebuild is clean and the collection is
re-pointed with D2's PUT. Rejected: leaving 11oz-only — it forfeits the 15oz/20oz upsell on the one
product that is already selling. **Owner decision: OQ7.**

---

## 4. Release plan

### v0.2.0 — "Sellable Storefront"

Four gates. **Stop at any gate.** No gate may be skipped, because there is no bulk delete and no update
endpoint: a wrong product is an archive-plus-recreate, and an archived product keeps its name.

**Gate 0 — pre-flight, no writes.**
1. **Publish the two HIDDEN Austin Skyline products** (OQ2 — decided). Dashboard-only. Without this,
   the artwork the brief names is invisible to every customer.
2. **Gate status: verified, decision open** (OQ2). The gate covers browsing, not `/checkout/` (§1.2).
   Either un-gate the shop — dashboard: Site Design → status tag → Live → Save — or record explicitly
   that v0.2.0 ships to a shop nobody can *find*. This is a launch-readiness decision, not a technical
   one.
3. **`gondeoleu`** (OQ4 — decided: it is an intentional original). Re-home it out of `all` and onto the
   Originals surface (T19). Confirm nothing in the seeding script targets the slug `gondoleu` before it
   runs.
4. `git checkout -- tsconfig.json` before staging anything.

*Not in scope:* any change to checkout, the webhook route, or `/import`.

**Gate 1 — pilot. One artwork, one template, one product.**
Run the seeding script with `--only the-martian --template pro_4v5OfYhyRx62KW5b7Oj6Uw --apply` on a
scratch name first, or accept that this creates a real product. Then verify **all four** of:

```bash
# a. the product exists and is public
curl -s "$PLAT/products?size=100" -H "Authorization: Basic $AUTH" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).results.map(p=>p.slug+" "+p.state.type+" "+p.access.type).join("\n")))'

# b. the Storefront API serves it (cache-busting param is required — a stale read looks like a failure)
curl -s "$SF/collections/kitsch-cpg/products?currency=USD&storefront_token=$TOK&cb=$RANDOM" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).results||[];console.log(r.length,"products")})'

# c. the rendered mockup is good — dashboard, eyes only. This is the step no script can do.
# d. the price is right: the mug must read $22.00, not $0.22 and not $2200.
```

**If (c) or (d) fails, stop.** Fix the source artwork or the pricing rule, do not proceed to Gate 2.

*Not in scope:* any front-end change.

**Gate 2 — the core catalogue. 10 mugs + 10 tees.**
Create `kitsch-cpg` membership (PUT the full 10 ids) and create `apparel` with the 10 tees. This is the
tier the live shop already half-proves.

*Exit criteria:*
```bash
# 20 products exist and are PUBLIC
# both collections serve exactly 10 products through the Storefront API
# zero FAILED lines in the seeding run
# an archived duplicate count of 0 for names created in this run
```

*Not in scope:* `desk-art`, `everyday-carry`, any front-end change, footwear.

**Gate 3 — the extended catalogue, plus the mug rebuild. 20 more products.**
`desk-art` (10) and `everyday-carry` (10), then **T21** — rebuild the four mugs with explicit `sizes`
(11oz/15oz/20oz) and re-point `kitsch-cpg` with the PUT in the same run (OQ7 — decided). Then, and only
then, the front-end refactor lands.

*Exit criteria:*
```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
# baseline before this release: 97 passed (6 files). Both gates must be green, and the count must
# only go UP — a drop means a guard was deleted rather than satisfied.
# every taxonomy handle resolves to a non-empty Fourthwall collection:
for h in kitsch-cpg apparel desk-art everyday-carry; do
  echo -n "$h "
  curl -s "$SF/collections/$h/products?currency=USD&storefront_token=$TOK&cb=$RANDOM" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log((JSON.parse(s).results||[]).length))'
done
# 10 10 10 10 — any other number is a failure
```

*Not in scope:* the v0.3.0 families, the studio site, `roryskagenart.com`.

### The acceptance test for the whole programme

> **Every product card the storefront renders resolves to a real Fourthwall product that can be added
> to a cart and checked out.**

Concretely: for each product the site renders, `GET /v1/collections/<handle>/products` returns it, and
`addItem` succeeds against Fourthwall rather than falling through to the in-process `Map`
(`lib/fourthwall/index.ts:481-484`).

**If it does not hold, the release failed and the correct response is to revert the front-end change —
not to keep the new navigation and the old fake catalogue.** Shipping a smaller honest catalogue beats
shipping a larger dishonest one.

---

## 5. Task inventory

| # | Task | Capability | Release | Blocked by |
| :--- | :--- | :--- | :--- | :--- |
| T1 | `lib/fourthwall/merch-catalog.ts`: 10-slug allowlist, pinned template ids, target prices, collection map | C1 | v0.2.0 | OQ1, OQ6, OQ7 |
| T2 | Unit tests for the catalogue: every slug exists in `rory-artworks-data.json` and is `Available`; every template id is in the pinned table; every target clears its base cost | C1 | v0.2.0 | T1 |
| T3 | Extend `scripts/publish-merch-to-fourthwall.ts` to consume the catalogue (matrix, not one template), with `--only`/`--collection`/`--apply` and a printed created/skipped/failed count | C2 | v0.2.0 | T1 |
| T4 | Add collection reconciliation: create missing collections, then `PUT /collections/{id}/products` with the full `offerIds` list | C2 | v0.2.0 | T3 |
| T5 | Gate 1 pilot + verification | C2 | v0.2.0 | T4, OQ2, OQ4, OQ5 |
| T6 | Gate 2: 10 mugs + 10 tees | C2 | v0.2.0 | T5 |
| T7 | Gate 3: `desk-art` + `everyday-carry` | C2 | v0.2.0 | T6 |
| T8 | Rewrite `PRODUCT_COLLECTIONS` to the 4 sellable handles; delete unfulfillable `productTypes`/`sampleProducts` copy | C3, C5 | v0.2.0 | T7 |
| T9 | Rewrite the homepage hero + chips; remove the "15 originals / $4k–$28k / 137 works" claims; reduce the B2B banner to one inquiry CTA | C5 | v0.2.0 | T8 |
| T10 | Re-point `three-items.tsx` + `carousel.tsx` off `fine-art-originals` | C4 | v0.2.0 | T8 |
| T11 | Remove the local-catalogue fallback in `getCollectionProducts` / `getProduct`; thread a `source` flag through `reshapeProduct` | C4 | v0.2.0 | T8 |
| T12 | Render an "Inquire" state instead of a buy box when `source !== 'fourthwall'` | C4 | v0.2.0 | T11 |
| T13 | Fix `NEXT_PUBLIC_FW_COLLECTION` (`fine-art-originals` → `kitsch-cpg`) in Vercel **and** `.env.local`; note that `NEXT_PUBLIC_*` is inlined at build, so it needs a redeploy | C4 | v0.2.0 | T10 |
| T14 | Update `TAXONOMY_HANDLES` in `collections.test.ts`; add a guard that no `components/**` href points at a handle with no Fourthwall collection | C6 | v0.2.0 | T8 |
| T15 | Relabel the `v1.x` roadmap in `brand-config.ts` + `docs-content.ts` (OQ1) | — | v0.2.0 | OQ1 |
| T16 | Delete the `the-martian-white-glossy-mug` archived duplicate if the dashboard permits | — | v0.2.0 | OQ3 |
| T17 | **Pin the 4 collection display names vs slugs before any create call** (§2.3). `kitsch-cpg` keeps its slug and gets a shopper-facing taxonomy title; the 3 new collections get names that are both shopper-facing and slug-clean | C8 | v0.2.0 | T1 |
| T18 | Rewrite all shopper-facing copy: materials, care, sizing, shipping, returns; delete every product type with no template | C8, C5 | v0.2.0 | T8 |
| T19 | Re-home `gondeoleu` out of `all` into the Originals surface — dashboard for the listing, `PUT /collections/{all}/products` to drop it from `all` | C8, C4 | v0.2.0 | OQ4 |
| T20 | Product-page conventions: variant selector driven by **real** Fourthwall variants, breadcrumbs, related products from the same collection | C8, C4 | v0.2.0 | T12 |
| T21 | **Rebuild the 4 mugs with explicit `sizes`** and re-point `kitsch-cpg` with the PUT (OQ7) | C2 | v0.2.0 | T7 |

**Genuinely parallel:** T1, T2, T15 and T17 need no API access and can be written before Gate 1. T18 and
T20 are pure front-end work that can be drafted against the *known* catalogue shape. T14's guard can be
written against the new handle list before the products exist — it will simply fail until Gate 3 passes,
which is the point.

---

## 6. Sequencing and critical path

```
OQ1 OQ2 OQ4 OQ5 OQ6 OQ7  (owner decisions — everything waits on these)
        │
     Gate 0
        │
   T1 ─ T2 ─ T3 ─ T4 ─ T5 ══ STOP if the mockup or the price is wrong
                          │
                        T6 (20 products)
                          │
                        T7 (40 products)
                          │
             T8 ─ T9 ─ T10 ─ T11 ─ T12 ─ T13 ─ T14
                          │
             T15, T16  (independent)
```

**Critical path: OQ decisions → Gate 0 → T1→T4 → T5 → T6 → T7 → T8 → T11 → T12 → T14.**

The front end must land **after** the catalogue, never before: T8–T14 remove the fallback that makes
the site work at all today, and doing that first would leave every category empty.

---

## 7. Risk register

| ID | Risk | Impact | Mitigation | Status |
| :--- | :--- | :--- | :--- | :--- |
| R1 | **The source artwork is the bottleneck.** 38 of 42 `Available` works are under 1500px; the studio's most famous mural is 576×376. | High | Merchandise the 10 best and say so in the copy. The real fix is 300 DPI PNG masters from Rory — **an owner action, not a code change** | Open, out of scope |
| R2 | **The shop is `PASSWORD_PROTECTED` — browsing is gated, `/checkout/` is not** (§1.2). No API endpoint can change it | **High** (downgraded from Critical) | Dashboard: Site Design → status tag → Live → Save. Until then v0.2.0 ships a shop nobody can *find* — but the Next.js app is ungated and can complete a purchase, so this is launch-readiness, not a hard blocker | Open, owner-only |
| R3 | **No update endpoint and no bulk delete.** A wrong price or a wrong region is archive-plus-recreate, and the archive is soft — it leaves a duplicate behind | High | Gate 1 pilot; pin everything in config; never probe an unknown method against a live resource | Accepted |
| R4 | **The template set is mutable and changed mid-session** (§1.4) | Medium | Pin template ids; assert each still exists before creating; fail loudly, never fall back to a name match | Open |
| R5 | `austin-2019` is 1467px — under the local gate — and both of its live products are `HIDDEN` | Medium | Accept 1467 (the live tee proves it prints); publish the two products at Gate 0 | Open, OQ2 |
| R6 | A single `profitMargin` cannot hit one price across sizes | Low | Choose the size the margin targets — OQ6 | Open |
| R7 | The Storefront API is **CDN-cached per exact URL**. A stale read looks exactly like a failed write | Medium | Always cache-bust with a random param; wait before concluding | Known trap |
| R8 | `lib/taxonomy.ts` is read by the nav, the homepage, the category page and `collections.test.ts`. A partial edit leaves the nav and the tests disagreeing | Medium | T8 and T14 land together; run `tsc` **and** `vitest` — vitest alone passes on code `tsc` rejects | Known trap |
| R9 | ⚠️ **The plausible distractor.** This refactor is visible and satisfying; the unglamorous blockers are R2 (the password gate), OQ4 (a possibly-100×-wrong live price) and the two hidden Austin Skyline products. | High | All four are Gate 0 items with named owners. The refactor must not become the reason they slip | Open |
| R10 | PR #2 (unmerged) also creates `docs/releases/plans/` | Low | Merge one first; rebase the other. No conflict is possible in the file itself | Open |

---

## 8. Do not do yet

Carried forward, still live:

- **Do not deploy, and do not push to `main`.** Push-to-deploy is active, so a push to `main` is a
  production deploy. Each push needs its own explicit approval.
- **Do not publish to `roryskagenart.com`.** The artist's studio site, separate repo, out of scope.
- **Do not switch this project's git remote.** `origin` stays `roryskagenart/shop.roryskagen.com` —
  note `.com`, not `.art.com`.
- **Do not recreate the GitHub Actions deploy bypass.** Git integration works; `deploy.yml` was deleted
  deliberately.
- **Do not probe an unknown HTTP method against a live resource.** Learning that `DELETE` soft-deletes
  cost a real product; that is where the archived duplicate in §1.3 came from.

New for this release:

- **Do not add a second unguarded public write endpoint.** If the seeding script gains an HTTP trigger,
  it inherits the `/import` gate question — do not ship it beside Basic auth without deciding.
- **Do not put Fourthwall credentials in a client component.** The seeding script is a local CLI; keep
  it that way.
- **Do not extend the design pipeline to originals** (D3). It has no price field.

---

## 9. Open questions for the owner

Each carries a recommendation. **Status as at 2026-10-01:** OQ1, OQ2, OQ4 and OQ7 are **answered** (see
§0a) — the rationale below is kept because it is what the decision was made against. **OQ3, OQ5, OQ6 and
OQ8 remain open**, and only OQ6 still blocks work (T1's mug margin). OQ1–OQ3 blocked Gate 0; OQ4–OQ7
blocked T1.

**OQ1 — Which version number does this release take?**
The repo holds **two numbering spaces** and they disagree. The tag line has exactly one member,
`v0.1.0`. `lib/brand-config.ts:66-101` declares `v1.1.0` as *"Step 1 (Current Release - Low Risk /
Active)"* and `v1.2.0`–`v1.5.0` as planned; `lib/docs-content.ts:1178-1190` repeats v1.2.0–v1.5.0. No
`v1.1.0` tag exists.
*Recommendation:* **name this release `v0.2.0`** — it continues the only tag line, and a pushed tag
cannot be renumbered. Then relabel the `BRAND_CONFIG.roadmap` entries (T15) to a visibly different
scheme, because a document that claims a current release that does not exist is the same contradiction
in a third place. If instead you want `v1.1.0`, the roadmap must be renumbered **in the same PR**.

**OQ2 — Do the two HIDDEN Austin Skyline products get published, and does the shop get un-gated?**
`austin-skyline-2019-white-glossy-mug` and `…-comfort-colors-…-t-shirt` are `AVAILABLE` but `HIDDEN`,
so the Storefront API does not serve them. The brief names that artwork explicitly.
*Recommendation:* publish both at Gate 0, and un-gate the shop before Gate 1 — otherwise the whole
release is unverifiable end to end. Both are dashboard-only, so they need you or Rory.

**OQ3 — Keep Basic auth on `/import` for one more release?**
Raised by PR #2; it becomes relevant only if the seeding script gets an HTTP trigger.
*Recommendation:* yes — keep it, per PR #2's OQ3.

**OQ4 — Is `gondeoleu`'s $4,500.00 price intentional?**
The live product is `gondeoleu` (note the extra `e`; the catalogue slug is `gondoleu`), `STANDARD`,
`AVAILABLE`, `PUBLIC`, `LIMITED` stock 1, 8 lb, 10×12×2 in, priced **$4,500.00**. The catalogue lists
`gondoleu` at `basePriceUSD: 55`. Either it is a deliberate original listing or a price entered in
cents where dollars were meant — a 100× error on a public product.
*Recommendation:* confirm before T1. If it is an original listing, it should not sit in `all` beside
$22 mugs; if it is an error, fix it in the dashboard first, because it is the only non-merch product a
customer can currently see.

**OQ5 — Fix the `gondeoleu` slug typo?**
The slug derives from the name and there is no update endpoint, so fixing it means archive + recreate.
*Recommendation:* fold it into OQ4 — if the product is rebuilt anyway, the slug costs nothing.

**OQ6 — Which size does the mug margin target?**
One `profitMargin` per product, but three base costs. At a margin set from the 11oz target, the ladder
is $22.00 / $24.55 / $26.55.
*Recommendation:* target the **15oz** ($24.55 on an $8.50 base → $22.00 / $24.55 / $26.55 becomes
$20.05 / $22.00 / $24.00-ish); pick whichever keeps $22.00 as the visible entry price. Decide once —
rebuilding mugs is the expensive operation.

**OQ7 — Rebuild the four live mugs to get 15oz and 20oz?**
They carry a single 11oz variant because `sizes` was omitted at create. Archiving frees the slug, so the
rebuild is clean, but it briefly removes four live products and leaves four archived duplicates.
*Recommendation:* **yes, at Gate 3, not Gate 1** — do it once, after the matrix is proven, and re-point
`kitsch-cpg` with the PUT in the same run.

**OQ8 — Should the 3 originals among the 10 be merchandised as "also available as the original"?**
`empopatya` ($16,000), `gianondor` ($18,500) and `the-persistence-of-cats` ($14,500) are in
`originals-data.json`.
*Recommendation:* yes — a text link from the merch product to an inquiry, not a cart button. It is the
one genuinely differentiated thing this catalogue has, and D4 gives it a home.

---

## 10. Release mechanics

- **Branch:** `feat/merch-catalog-v0.2.0` for the code; `docs/…` for this document. Open the PR as a
  **draft** while OQ1–OQ3 are unanswered — that is the honest state and it prevents an accidental merge.
- **Do not** edit `CHANGELOG.md` (none exists), the deployment log, or a canonical context file for a
  plan. Those change when the work executes.
- **Gates:** CI is `.github/workflows/ci.yml` → `npm ci`, `npm run lint` (= `tsc --noEmit`), `npm test`.
  Run **both** `tsc` and `vitest` locally: `vitest.config.ts` sets `globals: true` at runtime only, so a
  test that omits its imports passes vitest and fails `tsc`. `tsconfig.json` sets
  `noUncheckedIndexedAccess: true`.
- **Before staging:** `git checkout -- tsconfig.json` (Next rewrites it on every dev/build run).
- **Before any local `vercel deploy`:** `vercel deploy --dry --json` and check the file list — the CLI
  does not read `.gitignore`.
- **This document is untracked until committed.** A brand-new plan file is the most fragile artifact in
  the session; commit it (not push) before doing anything else, or say so and it stays local.

---

## Appendix A — Claim → evidence

| Claim | Evidence |
| :--- | :--- |
| Local tree = remote `main` at `87cf568…` | `git rev-parse HEAD`; `gh api repos/roryskagenart/shop.roryskagen.com/commits/main` |
| Shop is `PASSWORD_PROTECTED` | `GET /open-api/v1.0/shops/current` → `"status":"PASSWORD_PROTECTED"` |
| 3 collections, slugs `kitsch-cpg`/`featured`/`all` | `GET /open-api/v1.0/collections?size=100` |
| 8 products, 5 customer-visible | `GET /open-api/v1.0/products?size=100` |
| `unitPrice.value` is dollars | `gondeoleu` `{"value":4500}` served as `$4500 USD` by the Storefront API; mug `unitCost` `5.95` vs $5.95 base |
| 25 templates, ids and base costs | `GET /open-api/v1.0/product-templates`; the table in §1.4 |
| `total: 601` is not this shop's count | Same call returns 25 results; `size`/`page` do not change the result |
| The template set changed mid-session | First call: Comfort Colors tee present, Drawstring Bag absent. Later call: the reverse |
| No wall-art template exists | The 25 templates in §1.4 contain no poster/canvas/metal entry |
| Mug region is `default`, 2700×1050 @300 DPI, placements front/back | `GET /open-api/v1.0/product-templates/pro_4v5OfYhyRx62KW5b7Oj6Uw` |
| Collections can be assigned products by API | `PUT /open-api/v1.0/collections/{collectionId}/products`, body `{offerIds}` — docs: *"Sets the full list of product IDs in the collection"*, scope `offer_write` |
| `/v1/products` (list) 404s on the Storefront host; `/v1/collections/{slug}/products` works | Direct probe; the 404 body is `No static resource api/public/v1.0/products` |
| **`/v1/products/{handle}` (detail) works** — 200 with the token, 401 without, 404 `OFFER_SLUG_NOT_FOUND_ERROR` for an unknown slug | Direct probe against `the-martian-white-glossy-mug`, `greetings-from-austin`, `nope-not-real` |
| **The password gate covers browsing but not checkout** | `curl` with a browser UA: `/`, `/products/…`, `/collections/…`, `/cart` → 302 `/password`; `/checkout` → 301 → `/checkout/` → 200, `<title>Checkout – Fourthwall</title>` |
| The Storefront cart API is live and token-authenticated | `POST /v1/carts` + token → `400 "JSON parse error. Value failed for JSON property \`items\`"`; without token → 401 |
| `/password` canonical host is `shop.roryskagenart.com` | `<link rel="canonical">` on the `/password` page |
| The taxonomy title wins over a colliding Fourthwall collection name | `lib/fourthwall/__tests__/collections.test.ts` ("prefers the taxonomy title over a colliding Fourthwall collection") — the basis for D4/§2.3 naming |
| `kitsch-cpg` serves 4 mugs at $22; `all` serves those plus Gondeoleu at $4500 | `GET /v1/collections/{kitsch-cpg,all}/products?currency=USD&storefront_token=…` |
| Homepage hard-codes "15 originals / $4k–$28k / 137 Works" | `app/[currency]/page.tsx:47,57,66,101` |
| Homepage grid sources a non-existent handle | `components/grid/three-items.tsx:50`; `.env.local` `NEXT_PUBLIC_FW_COLLECTION="fine-art-originals"` |
| Local-catalogue fallback fabricates purchasable products | `lib/fourthwall/index.ts:385-397` and `:451-465` |
| The cart falls back to an in-process `Map` | `lib/fourthwall/index.ts:481-484`; `components/cart/actions.ts:22-36` |
| Only 4 of 42 `Available` artworks clear 1500px | Computed over `lib/fourthwall/rory-artworks-data.json` |
| "Greetings from Austin" is `Sold` at 576×376 | Same file, `slug: greetings-from-austin` |
| Only `austin-2019` of the Austin-iconic set exceeds 800px | Same file, series `Austin Iconic & Texas Pop` |
| Two live products are `HIDDEN` | `GET /open-api/v1.0/products?size=100` → `access.type: "HIDDEN"` |
| `collections.test.ts` asserts all 7 taxonomy handles | `lib/fourthwall/__tests__/collections.test.ts:20-28` |
| `BRAND_CONFIG.roadmap` claims `v1.1.0` is the current release | `lib/brand-config.ts:66-101`; `lib/docs-content.ts:1178-1190` |
| Plan-document idiom | `docs/releases/plans/pr-gh-oauth_DRAFT.md` (PR #2, branch `docs/gh-oauth-plan`) |

## Appendix B — Documentation to update

| Document | Change | When |
| :--- | :--- | :--- |
| `docs/releases/plans/README.md` | **Create** — there is no plan index today; list PR #2 and this document with status and blocking question | With this PR |
| `README.md` | The Fourthwall template's own text: `pnpm install` (the repo uses npm), and a "Getting started" that assumes a template store rather than this shop | v0.2.0 |
| `lib/docs-content.ts` | Public `/docs` describes the unfulfillable taxonomy; reconcile with §2.2 | v0.2.0 |
| `lib/brand-config.ts` | Roadmap version labels (OQ1) | v0.2.0 |
| `CHANGELOG.md` | Does not exist. Create it at the first tagged release, or keep the release record in `docs/releases/` | v0.2.0 |
