---
name: fourthwall-product-catalog
description: "Use when you need the full sellable Fourthwall template catalog (all product types, not just this shop's published subset), the admin 'create product' gallery facets mapped to API fields, or the canonical catalog_full.csv / catalog_summary.json / fourthwall-full-catalog.md artifacts. Covers the public no-login path-paginated pull, the regionId-vs-placementId trap, the gzip/proxy gotchas, and how to validate a 'launch a product' create payload. Relevant because the storefront only shows published products; the full template catalog is the source of truth for any launcher tool."
version: 1.0.0
x-origin: shop.roryskagenart.com
x-created: 2026-10-02
---

# Fourthwall Product Catalog — Pull, Map & Generate

Turn "what can I actually sell on Fourthwall?" into a measured, reproducible catalog plus the
artifacts a launcher tool validates against. The whole catalog is **public** — no login, no storefront
token — so this works read-only with zero credentials.

**Core rule: the catalog number has an expiry date.** It was **605** on 2026-10-02 (measured, 25 pages,
0 failures). Fourthwall adds templates constantly; a "605" claim becomes a lie the moment the set grows.
Re-pull before you assert a denominator. See §6.

---

## 0. When to use

- You are building or validating a **products-launcher** (pick a template → attach art → create a
  sellable product) and need the full template set, not just what `roryskagenart` already published.
- You need the admin gallery filters (Categories, Collections, Colors, Base price, Production method,
  Print regions, Brands) reconciled against real API fields.
- You need to regenerate `catalog_full.csv`, `catalog_summary.json`, or `fourthwall-full-catalog.md`.
- You are writing a create payload and must avoid the `regionId` vs `placementId` trap.

---

## 1. What you get (canonical snapshot)

All three live under this skill's `references/`. Treat them as the **source of truth** for the launcher's
catalog ingest; the launcher's acceptance test re-derives them and must match.

| Artifact | What it is |
| :--- | :--- |
| `references/catalog_full.csv` | **All 605 templates × every attribute** (name, productId, top/sub category, brand, productionMethod, basePrice, priceFrom/To, numColors, colors, regions, placements, minOrders, supportsBackendRendering). |
| `references/catalog_summary.json` | Facet roll-ups: top categories, 47 sub-categories, 10 production methods, 47 brands, price min/avg/max, 544 distinct colors, 91 region ids, 17 placement ids, min-orders. |
| `references/fourthwall-full-catalog.md` | Human-readable facet map + the admin-gallery → API field mapping (§0) + create-vs-read-only notes. |

`fourthwall-product-schema.md` (in this skill's `references/` parent history / `.workbuddy-ai/tmp`) holds
the **create** schema. For the two-API architecture and the live write surface, read
[`../../../stack/fourthwall.md`](../../../stack/fourthwall.md) and
[`../../../../lib/fourthwall/AGENTS.md`](../../../../lib/fourthwall/AGENTS.md) first.

---

## 2. The two APIs (refresher)

| API | Base | Auth | Use here |
| :--- | :--- | :--- | :--- |
| **Storefront** | `storefront-api.fourthwall.com/v1` | publishable token as `?storefront_token=` | Reads published products only — **not** the template catalog. |
| **Platform (Open API)** | `api.fourthwall.com/open-api/v1.0` | Basic `FOURTHWALL_API_USERNAME`/`FOURTHWALL_API_PASSWORD` | Template catalog (read) **and** product create (write). |

The catalog pull in §3 uses **Platform**, read-only, and works **without** Basic auth (the endpoint is
public). Auth only matters at create time.

---

## 3. Phase 0 — Pull the full catalog (public, no auth)

`GET /product-templates` is **path-paginated**, 25 per page, 1-indexed:

```
GET https://api.fourthwall.com/open-api/v1.0/product-templates/page/1
… up to /page/25   # 605 total → 25 pages (last page has 5)
```

Traps that cost a false "25" reading:

- **Query params are ignored.** `?size=600&page=1` does nothing — the API always returns 25 and reads
  the page from the **path**. The `total` field is the real count.
- **Responses are gzip-compressed.** Pass `--compressed` to curl, or you get binary.
- A reverse proxy may sit in front of the host in some environments; the public endpoint returned the
  same 605 with and without shop auth, so auth is not the filter.

`references/pull-catalog.sh` does the full 25-page pull (list + per-template detail) and writes
`catalog_list.json` + `catalog_details.json`. It is idempotent and read-only. Run it from repo root
after sourcing `.env.local` only if you later need auth-gated fields (you don't, for the catalog).

---

## 4. Phase 1 — Generate the artifacts

`references/analyze_catalog.py` reads `catalog_list.json` + `catalog_details.json` and emits the three
artifacts. It filters `None` region/price values defensively (the API omits `priceFrom` on some
templates). Outputs:

- `catalog_full.csv` — one row per template, pipe-delimited multi-values (`colors`, `regions`).
- `catalog_summary.json` — the roll-up in §1.
- `fourthwall-full-catalog.md` — the facet map.

---

## 5. Phase 2 — Map admin "create product" gallery → API

Full table in `references/fourthwall-full-catalog.md` §0. Summary:

| Admin facet | API field | In API? |
| :--- | :--- | :--- |
| Categories (Apparel/Accessories/Drinkware/Home & Living) | `category` (top) | ✅ 421/126/30/28 |
| Sub-categories (T-Shirts, Mugs, Wall Art, …) | `category` (after `/`) | ✅ 47 |
| Production method | `productionMethod` | ✅ 10 |
| Brands (Champion, Stanley/Stella, …) | `brand` | ✅ 47 |
| Colors | `colorVariants[].color.name` | ✅ 544 |
| Base price | `basePrice` / `priceFrom`–`priceTo` | ✅ $1.21–$70.50 |
| Print regions | `customizableAreas[].regionId` | ✅ 91 |
| Min. orders | `minimumOrdersNumber` | ⚠️ all 0 — non-discriminating |
| Collections (Eco-Friendly, Budget friendly, Signature, Streetwear, Seasonal, Wellness) | — | ❌ curated UI labels, no field |
| Special features / How quickly / Ships from | — | ❌ not in API |

**Bottom line:** every *filter* is backed by a real attribute except the three curated UI labels. You
cannot query Collections server-side — group client-side from the attributes above (e.g. All-Over Prints
= `ALL_OVER_PRINT`, Gaming = a sub-category, Knitwear = `KNITTING`, Champion = a brand).

---

## 6. Phase 3 — Validate a launch (create) payload

The launcher creates a **design** product: `POST /products` with `type:"design"` + `productTemplateId`
(from this catalog) + `regions[{region, imageId, placementStrategy}]` + optional `colors`, `sizes`,
`profitMargin`, `publishOnCreate`. Grounded in `lib/fourthwall/merch.ts`:

- **`regions[].region` must equal a `regionId` from the template's `customizableAreas`** — NOT a
  placement id (`leftChest`, `largeCenter`, …). This is the single most common create failure.
  (`merch.ts:171` documents it; `scripts/publish-merch-to-fourthwall.ts:185` enforces it.)
- **`profitMargin` is USD added on top of base, not a percentage and not a final price.**
  Use `profitMarginForTarget(targetPrice, basePrice)` (`merch.ts:232`) to convert a retail target.
- **`publishOnCreate` defaults to `false`** (`merch.ts:185`, `:216`) — products are created hidden.
- **Art minimums:** `FOURTHWALL_MIN_ACCEPTED_PX = 1500` (`merch.ts:27`); transparency required for
  `DTG`, `DTFX`, `EMBROIDERY` (`FOURTHWALL_TRANSPARENCY_REQUIRED_METHODS`, `merch.ts:38`).
- **Never resolve a template by name** — pin `productTemplateId`. The catalog's `productId` is the id.
- **`unitPrice` is a decimal dollar amount, not cents** (`lib/fourthwall/AGENTS.md:20`).
- **Cache-bust before asserting on a live read** — the CDN caches per exact URL
  (`lib/fourthwall/AGENTS.md:58`).

⚠️ **Never probe an unknown HTTP method against a live product/collection id.** A stray `DELETE` once
soft-deleted a real product. Probe a scratch record or read the docs. (AGENTS.md rule #5.)

---

## 7. Traps learned the hard way

- ⚠️ **"25 templates" is page 1, not the catalog.** Path pagination; trust `total`.
- ⚠️ **gzip**: curl without `--compressed` yields binary, not JSON.
- ⚠️ **`regionId` ≠ `placementId`.** The catalog exposes both; create wants the region.
- ⚠️ **Denominator expiry**: 605 was measured 2026-10-02. Re-pull before citing the count or any
  fraction (e.g. "441/605 have multiple colors").
- ⚠️ **`minimumOrdersNumber` is 0 for all 605** — do not use it as a filter or a signal.
- ⚠️ **Collections are not queryable** — derive client-side or drop them.

---

## 8. Reproduce (human-runnable)

```bash
# from repo root
bash docs/agentic/skills/fourthwall-product-catalog/references/pull-catalog.sh   # 25-page read-only pull
python docs/agentic/skills/fourthwall-product-catalog/references/analyze_catalog.py  # emit the 3 artifacts
```

No credentials required for the pull. `pull-catalog.sh` writes `catalog_list.json` /
`catalog_details.json` to its working dir; `analyze_catalog.py` reads those and writes the artifacts
next to them (redirect or copy into `references/`).
