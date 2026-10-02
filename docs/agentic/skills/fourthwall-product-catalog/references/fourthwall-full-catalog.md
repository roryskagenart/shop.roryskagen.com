# Fourthwall Full Template Catalog & Admin-Gallery Facets (measured 2026-10-02)

**Correction to the earlier `fourthwall-product-schema.md`:** the sellable catalog is **605 templates**, not
25. `GET /product-templates` returns **25 per page** and is **path-paginated** (`/product-templates/page/{n}`,
1-indexed, 25 pages for 605). The `total` field is the real count; the API reference confirms it is "List
available product templates. Returns 25 results." My first probe read page 1 and mislabelled it as
"25 for this shop". **All 605 are reachable without login** (the endpoint is public; shop auth returns the
same 605 — auth only matters for create).

Raw data: `catalog_list.json` (605 summaries), `catalog_details.json` (605 details), `catalog_full.csv`
(every template with all attributes), `catalog_summary.json`.

---

## 0. How the admin "create product" gallery maps to the API

| Admin facet | API source | In API? | Notes |
| :-- | :-- | :-- | :-- |
| **Categories** (Apparel, Accessories, Drinkware, Home & Living) | `category` (top-level, before `/`) | ✅ | Exact match — Apparel 421 · Accessories 126 · Drinkware 30 · Home & Living 28 |
| **Sub-categories** (T-Shirts, Hoodies, Mugs, …) | `category` (after `/`) | ✅ | 47 sub-categories |
| **Production method** (DTG, DTFX, SUBLIMATION, EMBROIDERY, ALL_OVER_PRINT, UV, PRINTED, STICKER, KNITTING, LASER_ETCHED) | `productionMethod` | ✅ | 10 methods |
| **Brands** (Champion, Adidas, Stanley/Stella, …) | `brand` | ✅ | 47 brands; "Champion" in your list is a **brand** (10 templates), not a collection |
| **Colors** | `colorVariants[].color.name` (detail) | ✅ | 544 distinct colors; 441/605 templates have >1 |
| **Base price** | `basePrice.amount` (list) / `priceFrom`–`priceTo` (detail) | ✅ | min $1.21 · max $70.50 · avg $23.98 |
| **Print regions** | `customizableAreas[].regionId` (detail) | ✅ | 91 distinct region ids (`front`, `back`, `label_inside`, `embroidery_chest_left`, `sleeve_*`, month-names for calendars, …) |
| **Min. orders required** | `minimumOrdersNumber` (detail) | ⚠️ | **All 605 = 0** — non-discriminating in this catalog |
| **Collections** (All-Over Prints, Budget friendly, Champion, Eco-Friendly, Fall/Summer/Winter Essentials, Gaming, Kids' Clothing, Knitwear, Signature, Streetwear, Wellness) | *partial* | ⚠️ | Some are derivable (All-Over Prints = `ALL_OVER_PRINT` 60; Gaming = sub-cat 1; Kids' Clothing = sub-cat 48; Knitwear = `KNITTING` 4; Champion = brand 10). The rest (**Budget friendly, Eco-Friendly, Signature, Streetwear, Seasonal, Wellness**) are **curated merchandising labels with no API field** |
| **Special features** | — | ❌ | Curated tags (eco-friendly, etc.) — not in the API |
| **How quickly can I sell it?** | — | ❌ | Fulfilment-speed tier — not a raw field (loosely tracks `productionMethod`) |
| **Ships from** | — | ❌ | Not exposed anywhere in the template object |

**Bottom line:** every *filter* in the gallery except "Special features", "How quickly", and "Ships from" is
backed by a real template attribute. The **curated Collections** (Eco-Friendly, Budget friendly, Signature,
Streetwear, Seasonal, Wellness) are Fourthwall's UI groupings and are **not queryable** — they're a display
layer on top of the raw attributes.

---

## 1. Category breakdown (top-level `category`)

| Category | Templates |
| :-- | --: |
| Apparel | 421 |
| Accessories | 126 |
| Drinkware | 30 |
| Home & Living | 28 |

Notable sub-categories: T-Shirts 102 · Hoodies 78 · Sweatshirts 53 · Kids Clothing 48 · Hats 45 ·
Bottoms 33 · Long Sleeve Tees 30 · Bags 24 · Tank Tops 15 · Polo Shirts 15 · Crop Tops 14 · Tumblers 12 ·
Swimwear 12 · Shoes 11 · **Wall Art 5** · Pillows 4 · Blankets 2 · Towels 2 · Candles 1 · Yoga Mats 1 ·
Stickers 5 · Magnets 1 · Pins 1 · Patches 1.

> **Wall Art (5) now exists** in the catalog (posters/canvas) — unlike the 25-subset snapshot. So
> `canvas-prints`/`metal-litho` are *no longer* structurally impossible at the template level; whether this
> shop can fulfil them still depends on the POD partner, but the templates are present.

## 2. Production methods (10)

EMBROIDERY 170 · DTG 135 · SUBLIMATION 102 · DTFX 94 · ALL_OVER_PRINT 60 · UV 21 · PRINTED 13 · STICKER 4 ·
KNITTING 4 · LASER_ETCHED 2.

## 3. Price envelope

Base cost ranges **$1.21 → $70.50** (avg $23.98). At create time you don't set price — you set
`profitMargin` (USD added on top of base). See `fourthwall-product-schema.md` §4.

## 4. Colors & print regions

- **Colors:** 544 distinct (Black 388, White 373, Navy 142, Red 98, Heather Grey 59, French Navy 57…).
  441/605 templates expose multiple color variants.
- **Print regions** (`customizableAreas[].regionId`): 91 distinct. Apparel uses many
  (`front`, `back`, `sleeve_left/right`, `label_inside/outside`, `embroidery_chest_left/center`,
  `embroidery_wrist_*`, `front_large`, `back_large`, `_dtf` variants…). Mugs/bottles use a single area
  `default`. Calendars expose 12 month-named regions. At create, `regions[].region` must equal one of these
  ids — **not** a placement id (`leftChest`, `largeCenter`, `centerChest`, `fullSize`, …).

## 5. What you actually configure at create vs what's read-only

The gallery is for *browsing*. To *sell* one, you call `POST /products` `type:"design"` with
`productTemplateId` (from this catalog) + `regions[{region, imageId, placementStrategy}]` + optional
`colors`, `sizes`, `profitMargin`, `publishOnCreate`. **You cannot set** `slug`, `sku`, `unitPrice`,
`stock`, `unitCost`, `customsInformation`, or the gallery's `basePrice` — those are derived or fixed by the
template. Full create schema: `fourthwall-product-schema.md` §4.

---

## 6. On "open it in your browser"

The full 605-template catalog + every filterable attribute above was pulled **via the public API with no
login** (same data the admin gallery renders). The only things the API does **not** expose are Fourthwall's
curated UI labels — *Eco-Friendly, Budget friendly, Signature, Streetwear, Seasonal (Fall/Summer/Winter
Essentials), Special features, "How quickly can I sell it?", Ships from*. If you want those captured
**verbatim from the admin UI**, I can drive a browser to `admin.fourthwall.com/store/roryskagenart/catalog/products/all`,
but it sits behind your Fourthwall login (which you offered to do). Tell me and I'll take it from the login
screen.
