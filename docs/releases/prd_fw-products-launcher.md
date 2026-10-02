# PRD — Fourthwall Products Launcher

**Status:** Draft (open question: build surface — see §9 Q1)
**Owner decision needed:** yes — do not implement until Q1/Q2 are answered.
**Created:** 2026-10-02
**Depends on skill:** [`docs/agentic/skills/fourthwall-product-catalog`](../agentic/skills/fourthwall-product-catalog/SKILL.md)

---

## 0. What this document is, and is not

This is a **product requirements doc** for a *Products Launcher*: a tool that turns any of Fourthwall's
**605 sellable templates** into a live, sellable product in `roryskagenart`'s store, with artwork and
pricing attached. It is **not** a release plan (no version is assigned) and **not** a schema doc (that is
`fourthwall-product-schema.md` + the skill above).

The launcher's catalog data is validated against three measured artifacts (§4). Those artifacts are the
acceptance gate, not just reference material.

---

## 1. Verified starting state

Measured 2026-10-02 via the **public Platform API** (no login), 25-page pull, 0 failures.

- **Sellable catalog = 605 templates.** `GET /product-templates` is path-paginated (25/page), `total=605`.
  The storefront only shows *published* products; the 605-template set is the real menu.
- **4 top categories:** Apparel 421 · Accessories 126 · Drinkware 30 · Home & Living 28.
- **47 sub-categories** (T-Shirts 102, Hoodies 78, Sweatshirts 53, Kids Clothing 48, Hats 45, …,
  **Wall Art 5**).
- **10 production methods:** EMBROIDERY 170 · DTG 135 · SUBLIMATION 102 · DTFX 94 · ALL_OVER_PRINT 60 ·
  UV 21 · PRINTED 13 · STICKER 4 · KNITTING 4 · LASER_ETCHED 2.
- **47 brands**, **544 distinct colors**, **91 print-region ids**, **17 placement ids**.
- **Price envelope:** base $1.21 → $70.50, avg $23.98. `minimumOrdersNumber` = 0 for all 605.
- **Create path already exists** as a script: `scripts/publish-merch-to-fourthwall.ts` (DRY RUN by
  default, `--apply` to create, `--target-price` → `profitMargin`). The launcher reuses its machinery
  (`buildDesignProductRequest`, `profitMarginForTarget`) rather than reinventing it.

**Admin-gallery → API mapping** (full table in the skill's `fourthwall-full-catalog.md` §0): every filter
except *Collections (Eco-Friendly/Budget friendly/Signature/Streetwear/Seasonal/Wellness)*, *Special
features*, *How quickly*, and *Ships from* maps to a real template attribute. The four exceptions are
Fourthwall's curated UI labels — **not queryable**.

---

## 2. The product, decomposed

A launcher that moves an operator from "I want a mug with this art" to "it's live (or staged) on
Fourthwall" with guardrails baked in.

| # | Capability | Notes |
| :-- | :--- | :--- |
| C1 | **Catalog browse & filter** | Ingest `catalog_full.csv` as the catalog source of truth. Filter by top category, sub-category, brand, production method, base-price band, color availability, print region. |
| C2 | **Template select (pinned id)** | Operator picks a template; the launcher stores `productTemplateId` (the CSV `productId`). Never resolve by name. |
| C3 | **Artwork attach + validate** | Upload → `POST /media/upload-url` → PUT to GCS → `POST /media/images` → `imageId`. Enforce `FOURTHWALL_MIN_ACCEPTED_PX=1500`; require transparency for DTG/DTFX/EMBROIDERY. |
| C4 | **Region mapping** | Present the template's `customizableAreas[].regionId` list; operator maps art to **regionId** (not placementId). Default `placementStrategy: AUTO`. |
| C5 | **Pricing** | Operator enters a **target retail price**; launcher computes `profitMargin` via `profitMarginForTarget`. Do not expose raw `profitMargin` maths to the operator. |
| C6 | **Color/size subset** | Optional: limit to a subset of the template's `colorVariants`/`sizeVariants`. |
| C7 | **Publish control** | `publishOnCreate` default **false** — products are created hidden; explicit publish step required. |
| C8 | **Dry-run-first** | Every create is a DRY RUN unless an explicit `--apply`/publish action is taken. Mirrors the existing script. |
| C9 | **Artifact validation** | On catalog ingest, regenerate the three artifacts (§4) and assert they match the checked-in snapshot. Fails the build if they drift. |

---

## 3. Design decisions

| Decision | Alternatives rejected | Why |
| :--- | :--- | :--- |
| Reuse `scripts/publish-merch-to-fourthwall.ts` + `lib/fourthwall/merch.ts` | New API client from scratch | Machinery (region validation, profit calc, DRY RUN) already exists and is tested. |
| Catalog source of truth = measured `catalog_full.csv`, not a live API call per request | Call Platform API at runtime | 605 templates rarely change; a checked-in snapshot is reviewable, testable, and offline. Live call stays available for refresh (the skill). |
| `publishOnCreate` default false | Default true | Avoids accidental public products; matches `merch.ts` default. |
| Collections derived client-side (where derivable) or omitted | Query Fourthwall for Collections | No API field exists; UI labels are curated. Derive All-Over Prints / Gaming / Knitwear / Champion from attributes; drop the rest or treat as manual tags. |
| Region selection uses `regionId` | Use `placementId` | Create fails otherwise (`merch.ts:171`). This trap already burned a real product once. |

---

## 4. Artifact output validation (acceptance gate)

These three artifacts are **deliverables and the validation set** for C1/C9. They live in the skill's
`references/` and are regenerated by `analyze_catalog.py`:

| Artifact | Validates |
| :--- | :--- |
| `docs/agentic/skills/fourthwall-product-catalog/references/catalog_full.csv` | **All 605 templates × every attribute** — catalog ingest completeness (606 lines = header + 605). |
| `docs/agentic/skills/fourthwall-product-catalog/references/catalog_summary.json` | Facet roll-ups (categories, methods, brands, price envelope, 544 colors, 91 regions) — facet correctness. |
| `docs/agentic/skills/fourthwall-product-catalog/references/fourthwall-full-catalog.md` | Human-readable facet map + admin→API mapping — operator-facing correctness. |

**Acceptance test:** a CI step runs the pull + `analyze_catalog.py` against a fresh pull and `diff`s the
three artifacts against the checked-in versions. **Any difference fails CI** (template count moved, a
facet re-bucketed, a field dropped). This is the "generated artifact ⇒ sync test" obligation from the
planning skill — a stale catalog is a confident lie.

---

## 5. Release plan

### Release A — Catalog + dry-run launch (minimal)

Build surface TBD (§9 Q1). Scope:

- C1 (browse/filter over the CSV), C2, C3 (upload+validate), C4, C5, C7, C8.
- Reuses `buildDesignProductRequest`; creates hidden products only.
- **NOT in scope:** live publish toggle wiring to storefront, collections UI, multi-art variant batches.

**Exit criteria (commands):**

- `npm run lint` green and `npm test` green (97 baseline).
- A DRY RUN against a real `productTemplateId` prints the exact `DesignProductRequest` and creates
  **nothing** (`scripts/publish-merch-to-fourthwall.ts` with no `--apply`).
- Region validation rejects a `placementId` with the message at `merch.ts:205`.

### Release B — Publish + artifact sync test

- C6, C7 publish step, C9 CI sync test.
- **NOT in scope:** bulk launch, collections derivation UI.

---

## 6. Task inventory

| Task | Capability | Release | Blocked by |
| :--- | :--- | :--- | :--- |
| Ingest `catalog_full.csv` into launcher | C1 | A | — |
| Filter UI over facets | C1 | A | ingest |
| Pin `productTemplateId` on select | C2 | A | — |
| Media upload + px/transparency validation | C3 | A | — |
| Region→`regionId` mapping UI | C4 | A | template detail |
| Target-price → `profitMargin` | C5 | A | `profitMarginForTarget` |
| `publishOnCreate=false` default + explicit publish | C7 | A/B | — |
| DRY RUN default | C8 | A | existing script |
| CI artifact sync test | C9 | B | artifacts exist |
| Enforce transparency gate (DTG/DTFX/EMBROIDERY) | C3 | A | `merch.ts:38` |
| Local-master image source + dead-URL skip | C3 | A | T18 / R13 |
| Multi-region image mapping | C4 | A/B | template detail |
| CSV-backed catalog loader + facet filter | C1 | A | `catalog_full.csv` |
| `--colors` / `--sizes` flags | C6 | B | `merch.ts:159` |
| Collection attach (post-create `PUT`) | C7 | B | `fourthwall.md:54` |
| Rate-limit pacing + resume | C8 | A | FW 5/min |
| Promote step (HIDDEN→PUBLIC; note PRIVATE gap) | C7 | B | `fourthwall.md:135` |
| Investigate Fourthwall product-tag support | — | A | `merch.ts:153` |

---

## 7. Risk register

| ID | Risk | Impact | Mitigation | Status |
| :-- | :--- | :--- | :--- | :--- |
| R1 | Catalog count drifts (605 → N) | Sync test false-fails or stale launcher | Re-pull via skill; treat `total` as expiry-dated | open |
| R2 | `regionId`/`placementId` confusion | Create 4xx / silent wrong placement | C4 enforces regionId; test at `merch.ts:205` | mitigated |
| R3 | Accidental live publish | Public product with bad art | `publishOnCreate` false + DRY RUN default | mitigated |
| R4 | Stray write to live resource | Soft-deleted product (has happened) | Never probe unknown HTTP method; scratch-only | standing rule |
| R5 | Transparency missing on DTG/DTFX/EMBROIDERY | Rejected/bad print | C3 validation via `FOURTHWALL_TRANSPARENCY_REQUIRED_METHODS` | mitigated |
| R6 | Tags unsupported by create schema | Tag-driven storefront filtering impossible via API | Investigate FW tag support; dashboard fallback | open |
| R7 | `access:HIDDEN` still purchasable by URL | "Staged" products exposed before launch | Document; only dashboard PRIVATE is truly safe | open |

---

## 8. Do not do yet

- **No bulk/multi-template launch.** One product at a time until R2/R3 are proven in production.
- **No Collections UI.** Derive only the four derivable ones; defer the curated-label problem.
- **No storefront display changes.** Launcher is an operator tool; storefront rendering is out of scope.

---

## 9. Open questions for the owner (each with a recommendation)

- **Q1 — Build surface:** admin route inside this Next.js app, or extend the existing
  `scripts/publish-merch-to-fourthwall.ts` CLI? **DECIDED 2026-10-02: CLI-first** (recommended option
  adopted). Reuses tested machinery (`buildDesignProductRequest`, `profitMarginForTarget`, the GCS media
  flow), adds no new auth surface, and needs no deploy to iterate. An admin UI is deferred unless Rory
  needs self-serve. **§10 enumerates what the CLI still lacks.**
- **Q2 — Collections:** derive the 4 derivable ones client-side, or omit entirely for v1?
  **Recommend:** derive the 4; omit the rest; do not invent a server query that doesn't exist.
- **Q3 — Catalog freshness:** how often to re-pull? **Recommend:** on a schedule + on launcher
  startup warning if snapshot age > 30 days.

---

## 10. Gap analysis — missing pieces to implement CLI-first

**Decision (Q1): CLI-first**, reusing `scripts/publish-merch-to-fourthwall.ts` + `lib/fourthwall/merch.ts`.
Below is what that machinery does **not** yet do for a launcher over the 605-template catalog. Each item:
the missing piece, why it matters, and where it lives / what to add. Severity drives the task order in §6.

### 10.1 Tags — not in the create schema at all

- `DesignProductRequest` (`merch.ts:153`) has **no `tags` field**, and `lib/fourthwall/types.ts` models
  **no** product tags. The `tags` on `RoryArtwork` (`importer.ts:15`) and the export
  `tags: [...artwork.tags, series, medium, year]` (`importer.ts:259`) are **local storefront metadata**
  — they feed the site's local JSON, they are **never sent to Fourthwall**.
- **Implication:** there is currently **no way to set a Fourthwall product tag** through the launcher.
  If tags are required (storefront filtering, merchandising), one of: (a) confirm Fourthwall supports tags
  on **design** products and add a `tags?` field + a post-create `PATCH`/`PUT`; or (b) accept that tagging
  happens in the dashboard. **Verify against Fourthwall's docs before promising tags — do not assume.**
  This is the biggest open "etc." in the brief, and the answer changes the data model.

### 10.2 Images — four concrete holes

1. **Transparency gate unenforced.** `FOURTHWALL_TRANSPARENCY_REQUIRED_METHODS = ['DTG','DTFX','EMBROIDERY']`
   (`merch.ts:38`) is defined but **never referenced** in `evaluateArtworkForMerch` (`merch.ts:67`). A JPEG
   (no alpha) against a DTG template passes the gate and fails at create. Add an alpha-channel check scoped
   to those three methods.
2. **Source is the re-encoded CDN copy, not the master.** The script does `fetch(artwork.image.url)`
   (`publish-merch-to-fourthwall.ts:405`) — Cloudinary **q85** — so every product inherits a re-encode.
   9 artworks have local **q98** masters. Add a `--source <path>` / local-master resolver.
3. **Dead image URLs.** 9 catalogue records return **404** (placeholder `/v1/` upload segments; includes
   chosen artwork `beat-bop`). The script throws. Add a pre-flight liveness check + skip, and prefer a local
   master when one exists (T18 / R13).
4. **One region, one image.** `regions` is an **array** (`merch.ts:158`) but the script sends exactly one
   (`publish-merch-to-fourthwall.ts:415`). Multi-area templates (front+back, sleeve labels) cannot be fully
   rendered. Add multi-region mapping.

### 10.3 Collections — attach post-create, never via create

- `DesignProductRequest` carries **no** collection ids. Products are attached **after** creation via
  `PUT /collections/{id}/products` with the full `offerIds` list (`fourthwall.md:54` — replaces, does not
  append; scope `offer_write`).
- **Staging conflict:** `POST /collections` is **public immediately** (`fourthwall.md:53`), and a
  collection's name/visibility cannot be changed via API — only its product list. So per the v0.2.0
  findings, **create collections in the dashboard (Hidden default) and attach via API**. The launcher needs
  an "attach to collection" step; it is not part of create.

### 10.4 Catalog ingest — the script only sees 25 templates

- `fetchTemplates()` calls `GET /product-templates` with **no pagination** (`publish-merch-to-fourthwall.ts:177`),
  so it returns 25. `--template <id|name>` matches against that truncated list
  (`publish-merch-to-fourthwall.ts:293`). For a launcher over the 605 catalog, add a **CSV-backed loader**
  (`catalog_full.csv` in the skill `references/`) + facet filters, or a paginated full pull. Pin
  `productTemplateId` from the CSV; never resolve by name.

### 10.5 Colors / sizes subset — supported in schema, not exposed

- `DesignProductRequest.colors?` / `sizes?` (`merch.ts:159-160`) exist but the script exposes no flags.
  Add `--colors` / `--sizes` (resolved against the template's valid strings from the CSV / detail).

### 10.6 Pacing + resume — required for any bulk

- Create is **5 requests/minute** and `/media/upload-url` **20/min** (v0.2.0 finding, from FW docs). The
  script loops with no pacing or resume (`publish-merch-to-fourthwall.ts:378`). A 40-product build is ~8 min
  and must be paced + resumable. Note `--force` currently defeats the name-dedup that would let a re-run
  skip already-created products — reconcile.

### 10.7 Publish / staging — `HIDDEN` ≠ private

- `publishOnCreate` default false creates **HIDDEN**. But `access: HIDDEN` is **still purchasable by direct
  URL** (`fourthwall.md:135` + v0.2.0), and **PRIVATE** (truly unreachable) is **dashboard-only** — the
  Platform API cannot set it (`update-product-state` reaches PUBLIC/HIDDEN only). For a "publish only when
  launch-ready" model, the launcher needs an explicit promote step and must understand that API-created
  products cannot be made truly private. Add a `promote`/`publish` subcommand using the state endpoint.

### 10.8 Catalog freshness (Q3)

- The skill provides `pull-catalog.sh` + `analyze_catalog.py`; wire the artifact sync-test (§4) into CI so a
  drift fails the build.

### 10.9 Gap summary

| Gap | Area | Severity | Where |
| :--- | :--- | :-- | :--- |
| Tags not in create schema | tags | **High** (blocks tag-driven filtering) | `merch.ts:153`, `types.ts` |
| Transparency gate unenforced | images | **High** (create failures) | `merch.ts:38` vs `:67` |
| CDN re-encode vs master | images | Med (quality) | `publish-merch-to-fourthwall.ts:405` |
| Dead image URLs | images | **High** (throws) | T18 / R13 |
| Single region/image | images | Med | `publish-merch-to-fourthwall.ts:415` |
| 25-template truncation | catalog | **High** (launcher scope) | `publish-merch-to-fourthwall.ts:177` |
| No collections attach | collections | Med | `fourthwall.md:54` |
| Colors/sizes flags | pricing | Low | `merch.ts:159` |
| No pacing/resume | bulk | **High** | `publish-merch-to-fourthwall.ts:378` |
| `HIDDEN`≠private, no promote | staging | **High** | `fourthwall.md:135` |
| Freshness sync-test unwired | ops | Low | §4 / skill |

## 11. Release mechanics

- **No deploy.** This is an operator tool; if it becomes an admin route, it still does not trigger a
  production deploy without explicit approval (AGENTS.md #1).
- **No push without per-release approval** (AGENTS.md #2). `main` is git-connected; a push is a deploy.
- **Never probe an unknown HTTP method against a live product/collection id** (AGENTS.md #5). Use
  scratch records.
- **Secrets stay in `.env.local`.** Copy variable *names*, never values (AGENTS.md #6).
- Write the daily memory note + durable traps; do **not** edit `CHANGELOG.md`/deployment log until the
  work executes.

---

## Appendix A — Claim → evidence

| Claim | Evidence |
| :--- | :--- |
| Catalog = 605, path-paginated 25/page | `fourthwall-full-catalog.md` §0; `catalog_summary.json` `total:605` |
| 4 top categories 421/126/30/28 | `catalog_summary.json` `top_categories` |
| 10 production methods | `catalog_summary.json` `production_methods` |
| 544 colors, 91 region ids, 17 placement ids | `catalog_summary.json` `distinct_colors`, `region_ids`, `placements` |
| `regionId` ≠ `placementId`; create wants region | `lib/fourthwall/merch.ts:171` |
| `profitMargin` = USD over base, not % | `lib/fourthwall/merch.ts:190`, `:232` |
| `publishOnCreate` default false | `lib/fourthwall/merch.ts:185`, `:216` |
| Min px 1500; transparency for DTG/DTFX/EMBROIDERY | `lib/fourthwall/merch.ts:27`, `:38` |
| DRY RUN default; `--apply` to create | `scripts/publish-merch-to-fourthwall.ts:23`, `:276` |
| `unitPrice` is dollars not cents | `lib/fourthwall/AGENTS.md:20` |
| CDN caches per exact URL | `lib/fourthwall/AGENTS.md:58` |

## Appendix B — Documentation to update

| Document | Change | When |
| :--- | :--- | :--- |
| `docs/agentic/stack/fourthwall.md` | Fold the 605-catalog + facet map in; retire any "25 templates" claim | with Release A |
| `lib/fourthwall/AGENTS.md` | Add the launcher's regionId/DRY-RUN guard notes | with Release A |
| This PRD | Re-baseline the 605 count after first re-pull | when catalog drifts |
