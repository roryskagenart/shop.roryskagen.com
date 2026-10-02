# Stack — Fourthwall

**Measured live 2026-10-01.** Every claim below was produced by a request, not inferred. Re-measure before  
relying on it — vendor APIs change, and this document is dated for exactly that reason.

The integration code lives in [`lib/fourthwall/`](../../../lib/fourthwall/), and its own rules are in  
[`lib/fourthwall/AGENTS.md`](../../../lib/fourthwall/AGENTS.md).

---

## 1. Two APIs, two hosts

**Never derive one from the other.** They have different hosts, different auth, and different surfaces.

|         | **Read** — Storefront                                                       | **Write** — Platform                                                                             |
| :------ | :-------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| Host    | `https://storefront-api.fourthwall.com/v1`                                  | `https://api.fourthwall.com/open-api/v1.0`                                                       |
| Auth    | `NEXT_PUBLIC_FW_STOREFRONT_TOKEN` (publishable, ships in the client bundle) | Basic `FOURTHWALL_API_USERNAME` / `FOURTHWALL_API_PASSWORD`, or Bearer `FOURTHWALL_ACCESS_TOKEN` |
| Used by | the Next.js storefront                                                      | `scripts/publish-merch-to-fourthwall.ts`                                                         |

**Invalid token ⇒ `401`, not `404`.** A `404` therefore means the resource is missing, not that auth  
failed — an important distinction when debugging.

## 2. Read surface (Storefront)

| Call                                         | Result                                                                                            |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `GET /v1/shop`                               | works                                                                                             |
| `GET /v1/collections`                        | works                                                                                             |
| `GET /v1/collections/{slug}/products`        | works                                                                                             |
| `GET /v1/products` **(the list)**            | **404** — `No static resource api/public/v1.0/products`                                           |
| `GET /v1/products/{handle}` **(the detail)** | **works** — 200 with the token, 401 without, 404 `OFFER_SLUG_NOT_FOUND_ERROR` for an unknown slug |
| `POST /v1/carts`                             | works, token-authenticated                                                                        |

> ⚠️ **Do not claim `/v1/products` always 404s.** The *list* 404s; the *detail* works. Conflating them>   
> makes a local-only slug indistinguishable from a slug that never existed — which is exactly the>   
> confusion behind the fabricated-catalogue defect.

> ⚠️⚠️ **The CDN caches per EXACT URL.** A stale read is indistinguishable from a failed write.>   
> **Cache-bust with a random query param before concluding anything.**

> ⚠️ **`unitPrice.value` is a DOLLAR amount, not cents.** `gondeoleu` returns `{"value": 4500.00}` and the>   
> storefront serves **$4,500 USD**. Read it as cents and every price is off by 100×.

## 3. Write surface (Platform)

| Call                                                                             | Result                                                                             |
| :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `POST /products` (`type: "design"`)                                              | works; returns `productId` + `customizationId`                                     |
| `PATCH` / `PUT /products/{id}`                                                   | **405 — no update endpoint exists**                                                |
| `DELETE /products/{id}`                                                          | **204 — SOFT delete**: `state: SOLD_OUT`, `access: ARCHIVED`                       |
| `PUT /products/{id}/availability` `{available:true}`                             | 200, but **does not reverse an archive**                                           |
| `POST /collections` `{name, description, offerIds}`                              | 200, **immediately PUBLIC**; slug derives from `name`                              |
| `PUT /collections/{id}/products` `{offerIds:[…]}`                                | 200 — *"sets the FULL list of product IDs in the collection"*; scope `offer_write` |
| `GET /shop`, `/shops`, `/shop/settings`, `/settings`, `/storefront`, `/password` | **404** — no shop-settings resource exists                                         |

### ⚠️ Consequences you must design around

1. **There is no update path.** Anything not settable at `POST` time requires **archive + recreate**, which     
   leaves an archived duplicate behind. Design the create payload correctly the first time.
2. **Archiving releases the slug.** So a rebuild lands on the same URL — which is why the seeding script     
   has **`--force`**: an archived product keeps its name, so name-based de-duplication would silently skip     
   it.
3. **A collection's name, description and visibility cannot be changed — only its product list.** Renaming     
   by recreating therefore leaves a **PUBLIC orphan**, and `getCollections()`     
   (`lib/fourthwall/index.ts:353-356`) appends any Fourthwall collection not in the taxonomy — so the     
   orphan still appears in the nav. **Fix the display name in `lib/taxonomy.ts` instead**: the taxonomy     
   title already wins over a colliding Fourthwall name (asserted in `collections.test.ts`).
4. **`POST /collections` is public the instant it returns.** There is no draft state to hide behind.
5. **`PUT /collections/{id}/products` replaces, it does not append.** Omitting an id removes that product.

### Manual products are dashboard-only

Products that need their own price, their own variants/SKU, inventory stock of 1, and self-fulfilment —  
i.e. the **originals** — cannot be created by the API at all. There is no endpoint and no documented  
bulk/CSV import, and inventory is editable **only** for self-fulfilled products.

`formatArtworkForFourthwall()` (`lib/fourthwall/importer.ts:220`) matches no documented write endpoint. It  
is retained only because the CSV and JSON exports consume it.

## 4. The design pipeline, and what it will not do

`POST /products` with `type: "design"` is a **print-on-demand design** pipeline. It requires  
`productTemplateId` + `regions[]`, and accepts **no** `price`, `variants`, `slug`, `stock` or `images`.  
Pricing is a **`profitMargin` over base cost**.

- ⚠️ **`profitMargin` is a USD amount over base cost, per product — not per variant.** One margin therefore    
  cannot produce one price across multiple sizes.
- ⚠️ **`regions[].region` must equal a `customizableAreas[].regionId`, per template.** A mug exposes    
  exactly one area, `default` (placements `front`/`back`, 2700×1050 @300 DPI); apparel exposes many. A    
  hardcoded `"front"` works for a tee and is **rejected for a mug**.
- ⚠️ **Omitting `sizes` does NOT create all sizes.** Measured: one `White, 11oz` variant. Pass them    
  explicitly — and note the API's inconsistent spelling (`"20 oz"`).
- ⚠️ **The template list is MUTABLE.** `GET /product-templates` returned **25** for this shop; `total: 601`    
  is the platform-wide count and does not move with `size`/`page`. **The set changed mid-session** (a    
  Comfort Colors tee ⇄ a Drawstring Bag). **Pin template ids in config and assert at apply time; never    
  resolve a template by name.**
- **There is NO wall-art template.** No poster, canvas or metal print exists in the 25. Therefore    
  `canvas-prints` and `metal-litho` are **structurally unfulfillable through this API** — a product    
  decision, not a config gap.

The full 25-template inventory with base costs is in `.workbuddy-ai/memory/DETAIL.md`.

<a id="the-password-gate"></a>

## 5. ⚠️ The password gate

`GET /open-api/v1.0/shops/current` → `"status": "PASSWORD_PROTECTED"`.

**No API endpoint can change it.** It is dashboard-only: **Site Design → status tag (top-right) → Live →  
Save**. (The other Save/Publish button only saves theme content — a real time-waster.)

### What the gate actually covers

Measured with a browser user-agent against `roryskagenart-shop.fourthwall.com`:

| Path                  | Result                                              |
| :-------------------- | :-------------------------------------------------- |
| `/`                   | 302 → `/password`                                   |
| `/products/<slug>`    | 302 → `/password`                                   |
| `/collections/<slug>` | 302 → `/password`                                   |
| `/cart`               | 302 → `/password`                                   |
| **`/checkout`**       | **301 → `/checkout/` → 200 — UNGATED** (a real SPA) |
| `/login`, `/account`  | 403                                                 |

**⇒ The gate blocks DISCOVERY, not PURCHASE.** An earlier note in this project claimed the shop "cannot be  
bought from"; that was **too strong and was corrected** after measurement. The ungated Next.js app is the  
only real storefront.

**Unarchiving is dashboard-only:** Products → All products → Status → Archived → ⋯ → Unarchive, then set  
**Public** and **uncheck "Mark as sold out"**.

## 6. The password gate is not the only visibility control

`access: HIDDEN` on a product means the Storefront API does not serve it at all — a different mechanism  
from the shop-wide password gate. Two products are currently `HIDDEN`.

## 7. Live catalogue state (measured 2026-10-01)

- **Collections (3, all PUBLIC):** `kitsch-cpg` (`col_qMf6-GzBQlytUmha907_Tg`), `featured`    
  (`col_m7hZOp3nRpyUjhENpvl6Sw`), `all` (`col_k2tFEAvQQfyoVF1PYIi7sg`).
- **Products: 8 records, 5 customer-visible.**
  - 4 mugs @ **$22.00** — `odoroita-sakana-white-glossy-mug`, `the-martian-white-glossy-mug`,      
    `the-martian-ii-white-glossy-mug`, `today-atomic-sunrise-white-glossy-mug`. Each has **only a      
    `White, 11oz` variant** — the omitted-`sizes` bug, visible in production.
  - `gondeoleu` @ \*\*$4,500.00\** — \`STANDARD\`, \`AVAILABLE\`, \`PUBLIC\`, \`LIMITED\` stock 1. ✅ \*\*The price is      
    intentional\*\*: it is an original listing, not a 100× error. It must not sit in \`all\` beside $22 mugs.      
    Its slug has a typo (the catalogue says `gondoleu`) — cosmetic, and unfixable without archive +      
    recreate.
  - 1 archived duplicate of `the-martian-white-glossy-mug`, left by the `DELETE` probe.
  - **2 `HIDDEN`** — `austin-skyline-2019-white-glossy-mug` and      
    `austin-skyline-2019-comfort-colors-garment-dyed-heavyweight-t-shirt` ($34.00).

A point-in-time snapshot is at `.workbuddy-ai/backups/fourthwall-store-snapshot-2026-10-01.json`.

## 8. Taxonomy vs. reality

`lib/taxonomy.ts` declares **7** collection handles and is the **source of truth for the nav**:

`fine-art-originals` · `b2b-corporate-gifts` · `metal-litho` · `canvas-prints` · `desk-art` ·  
`kitsch-cpg` · `apparel`

**Measured: most of them have nothing behind them.**

| Handle               | Reality                                                                  |
| :------------------- | :----------------------------------------------------------------------- |
| `kitsch-cpg`         | ✅ real — 4 mug products                                                  |
| `fine-art-originals` | ⚠️ served from **local JSON fallback** — no Fourthwall collection exists |
| the other 5          | ❌ no matching Fourthwall collection, zero products                       |

`collections.test.ts:20-28` asserts all 7 handles resolve. **The test asserts the taxonomy, not the data** —  
which is why the taxonomy can describe a catalogue that does not exist.

### How a category actually starts showing products

1. Create the Fourthwall collection — its **slug derives from `name`**, and it is public immediately.
2. Create the design products (`POST /products`, correct template + regions + sizes).
3. `PUT /collections/{id}/products` with the full `offerIds` list.

**No code change is needed.** That is the mechanism the v0.2.0 plan relies on.

## 9. Caching

`revalidate = 3600` (ISR). Combined with dead webhook config, **content refreshes only on that timer.**


> ⚠️ **A "missing product" on the live site is a caching question first and a data question second.** Check
> with a cache-busting param before debugging the data.
