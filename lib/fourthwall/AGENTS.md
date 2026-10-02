# AGENTS.md — `lib/fourthwall/`

Scoped rules for the Fourthwall integration. **These add to the root [`/AGENTS.md`](../../AGENTS.md), and
win over it inside this directory.**

The API behaviour is documented in [`../../docs/agentic/stack/fourthwall.md`](../../docs/agentic/stack/fourthwall.md).
**Read that before changing anything here.** This file is the short list of things that will bite you.

---

## Non-negotiable in this directory

1. **Never send an unknown HTTP method to a live product or collection id.** A `DELETE` sent to test for an
   update endpoint soft-deleted a real product. It is still archived. See
   [`../../docs/agentic/protocols/destructive-actions.md`](../../docs/agentic/protocols/destructive-actions.md).
2. **Never resolve a product template by name.** The template list is **mutable** and changed mid-session.
   Pin ids in config and assert at apply time. → T07
3. **Never remove the local-catalogue fallback without removing the cart fallback too.** They are one
   defect, not two. → T01
4. **Never read `unitPrice.value` as cents.** It is a decimal **dollar** amount. → T09

## What this directory is

| File | Role |
| :--- | :--- |
| `index.ts` | The storefront read path. **Contains the fabricated-catalogue fallback** (see below). |
| `merch.ts` | Merch catalogue definitions. |
| `importer.ts` | Legacy import helpers. `formatArtworkForFourthwall()` matches no documented write endpoint. |
| `reshape.ts` | Maps API responses to the app's types. |
| `types.ts` | Types for the above. |
| `originals-data.json` | Local fallback data for the 15 originals. |
| `rory-artworks-data.json` | The 137-artwork source inventory. |
| `__tests__/` | `collections`, `importer`, `merch`. |

## ⚠️ The fallback that fabricates products

```
getCollectionProducts()   lib/fourthwall/index.ts:385-397   falls back to local JSON
getProduct()              lib/fourthwall/index.ts:451-465   falls back to local JSON
addItem()                 components/cart/actions.ts:22-36  fails at Fourthwall
cart fallback             lib/fourthwall/index.ts:481-484   in-process Map
```

Result: `/USD/collections/fine-art-originals` renders 15 originals at $5.5k–$28k **with no Fourthwall
product**, each with a working add-to-cart, and the cart is accepted into the **ungated** `/checkout/`.

**Nothing throws. Every page returns 200.** Removing the read fallback alone is not a fix — the cart
fallback makes the empty result look valid.

## Testing rules here

- **Run both gates.** `tsc --noEmit` **and** `vitest run`. `globals: true` is set at runtime only, so a test
  omitting its `describe`/`it`/`expect` imports passes vitest and fails `tsc` (`TS2582`). → T15
- **Baseline: 97 passed / 6 files.** A **drop** means a guard was deleted.
- `collections.test.ts:20-28` asserts all **7** taxonomy handles resolve. ⚠️ **That asserts the taxonomy,
  not the data** — most handles have no products behind them. Do not read a green run as "the catalogue
  works".
- **Cache-bust before asserting on a live read.** The CDN caches per exact URL, so a stale read looks
  identical to a failed write. → T11

## Read-path quick reference

| Need | Call |
| :--- | :--- |
| Prove a product exists | `GET /v1/products/{handle}` (Storefront) — **the detail endpoint works** |
| List products | ⚠️ `GET /v1/products` **404s**. Use `/v1/collections/{slug}/products`. |
| Collections | `GET /v1/collections` |
| Shop status | `GET /open-api/v1.0/shops/current` (Platform) |

Invalid token ⇒ **401**, not 404. → T10
