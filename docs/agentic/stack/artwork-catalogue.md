# Stack — artwork catalogue

**Measured 2026-10-01.** Source: `lib/fourthwall/rory-artworks-data.json`.

This is the constraint that shapes every merch decision. **The bottleneck is the source artwork — not the
code, and not the API.**

---

## Inventory

| Metric | Value |
| :--- | :--- |
| Total entries | **137** |
| `Available` | **42** |
| `Sold` | 82 |
| `Archived` | 13 |
| File format | **JPEG — all 137** |

The JSON's `width`/`height` fields are the true stored dimensions. There is no separate master copy.

## ⚠️ Transparency cannot be manufactured

Every source is JPEG. JPEG has no alpha channel, so **PNG transparency cannot be recovered from these
files** — it would have to be re-exported from the original artwork.

## The 1500px gate

A **local project rule**: source art should be ≥1500px on the short side for print. **The API does not
enforce this** — real products were created from a 2100×1467 source and the mockups looked good. So the
gate is a quality heuristic, not a hard constraint.

**Only 4 of the 42 `Available` works clear it:**

| Slug | Dimensions |
| :--- | :--- |
| `today` | 2697×3851 |
| `odoroita-sakana` | 2100×1571 |
| `the-martian-2` | 2100×1526 |
| `the-martian` | 2100×1519 |

## ⚠️ Do not cite a "median 624px" figure

It does not reproduce, and it circulated in earlier notes. The measurements that do reproduce:

| Population | Median shortest side |
| :--- | :--- |
| All 137 | **528 px** |
| The 42 `Available` | **734 px** |

## The "Austin Iconic" problem

- **`greetings-from-austin` — the studio's most famous mural — is `Sold` and only 576×376.**
- Of the 6 `Available` works in the *Austin Iconic & Texas Pop* series, only **`austin-2019`
  (2100×1467)** exceeds 800px.

**⇒ The "Austin Iconic" merchandising promise is currently unfulfillable.** That is a sourcing problem, not
an engineering one, and it should be stated as such rather than worked around in code.

## Series distribution

`ART_SERIES_TAXONOMY` (`lib/taxonomy.ts:42-67`) declares four series with a total `piecesCount` of 137:

| Series | Pieces declared |
| :--- | :--- |
| Pop Surrealism & Folklore | 87 |
| Monsters & Kaiju | 34 |
| Austin Iconic & Texas Pop | 11 |
| Atomic Pop & Sci-Fi | 5 |

> Note the mismatch worth watching: the series declares **11** Austin Iconic pieces, but the artwork JSON's
> series field is what actually governs the "6 `Available`" figure above. If you are counting, say which
> source you counted.

## What this means for a release

- **Ten sellable artworks is the realistic ceiling for a first catalogue** — and only if the 4 above-1500px
  works plus the already-merchandised 5 are the core.
- **Merch quality is capped by source resolution.** No amount of pipeline work changes that.
- **The fix is 300 DPI PNG masters from Rory.** Anything else is a workaround, and should be labelled one.

See [`fourthwall.md`](fourthwall.md#4-the-design-pipeline-and-what-it-will-not-do) for why wall art
(canvas, metal) is additionally impossible through this API.
