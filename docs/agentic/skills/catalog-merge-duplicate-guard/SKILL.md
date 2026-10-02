---
name: catalog-merge-duplicate-guard
description: "Prove that merging a legacy CMS export (WordPress, Drupal, Squarespace, a scrape, a backup) into a live catalog CANNOT create duplicate records — before anything is written. Use when reconciling an old site's content against an existing database, when planning a data migration or ingest, when a similarity/fuzzy matcher is being trusted to detect duplicates, or when a source and a target describe the same records under different identifiers. Also use when a migration report claims a match rate — verify the matcher's recall against the duplicates you already know about before believing its output."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Catalog Merge Duplicate Guard

**Core rule: never trust a similarity threshold to detect duplicates. Score the duplicates you
already know about, and if the matcher cannot see them, the threshold is not your detector.**

A merge into a live catalog fails in two directions, and they are not symmetric:

- **A missed duplicate** creates a second row for one record. Visible, fixable, annoying.
- **A false merge** silently welds two different records together. Invisible, and it destroys data.

So the goal is not "maximise matching". It is **certainty about which merges are facts**, a review
queue for everything else, and a hard block on writing anything unresolved.

---

## Step 1 — Establish the ground truth before writing any matcher code

List the duplicates you **already know** to exist, from documentation, from the PRD, from the person
who ran the old site. These are your test cases.

Then score them with the matcher you intend to use, and **print the numbers**. This is the step that
is skipped, and it is the only step that matters.

Worked example — two pairs documented as duplicates, scored by a Dice-bigram matcher with a 0.85 gate:

```
austin-postcard-mural   →  austin-postcard        0.7895   BELOW gate
marcia-ball-cd-cover    →  marcia-ball            0.6667   BELOW gate
max score across all 62 source records            0.833    → 0 records clear the gate
```

The matcher is **blind to 100% of the known duplicates**, and it would have reported both as new.
Two duplicate rows, straight into the live catalog.

⚠️ **A match rate on its own proves nothing.** "127 of 197 matched" reads like success and can hide
that every *duplicate* was missed, because duplicates are a tiny fraction of the corpus and the
matcher is optimised for the easy majority.

## Step 2 — Do not fix this by lowering the threshold

Lowering the gate converts a bounded, visible failure (missed duplicates) into an unbounded,
invisible one (false merges). Add **independent signals** instead, and let each carry its own
confidence:

| Signal | Confidence | Why |
| :--- | :--- | :--- |
| Explicit documented pair | **certain** | A human already decided. Apply it directly; never re-derive it through the matcher. |
| Identifier alias (an old slug that is now a live slug) | **certain** | A rename is a fact, not a resemblance. |
| Sub-threshold similarity | **question** | Report it. Never act on it automatically. |
| Intra-corpus resemblance | **question** | The case a source-vs-target matcher structurally cannot see. |
| Shared media | **corroborating only** | Two records legitimately share a logo or a hero crop. |

## Step 3 — Apply certain merges explicitly, and feed the verdict back

Two failures live here, and both are silent:

1. **Deriving a known pair through the matcher.** It scores below the gate, so you lose knowledge you
   already had. Resolve the pair's counterpart by *exact* identifier and attach it.
2. **Detecting a duplicate and inserting it anyway.** ⚠️ This is the trap. A merge verdict that is not
   written back into the reconciled records is **inert**: the report says "merged" while the database
   gains a second row. Worse, a record classified as new often uploads its media **unlinked**, because
   link-trust is gated on the match kind. Add an explicit `known-dedupe` match kind, mark it trusted,
   and rewrite the record to merge-into-target.

## Step 4 — Normalise identifiers before you key on them

Path- or slug-keyed merges break on encoding, and the break looks like a genuine difference:

```
source:  motorcycle-mural-%e2%80%94-california-dreamin
target:  motorcycle-mural-—-california-dreamin          ← identical after percent-decoding
```

Left unnormalised the diff reports **"one lost, one added"** and a path-keyed merge creates a
duplicate. ⚠️ **Similarity scoring can never catch this** — the strings are not similar, they are
identical modulo encoding. Normalise first:

- Percent-decode slugs and paths (guard the decoder — malformed input must not abort the run).
- Case-fold, collapse whitespace, and decide one separator convention.
- Strip CMS upload-duplication suffixes: `foo-copy`, `copy_2_foo`, `foo-1`, `foo_2`. ⚠️ These matter
  more than they look: two records referencing *the same photographs* uploaded twice will score **0 of
  4** on exact basenames, because the filenames differ by a trailing digit.

## Step 5 — Check whether your identifiers are actually unique

⚠️ **A key that maps to more than one record cannot identify a record.** Before using any field as a
join key, count its distinct values:

```
image_url basenames:  7 basenames cover 46 records
                      r.jpg alone is the image_url of 27 records
```

A first-wins index over that field means a source record matches **whichever target happened to come
first in the snapshot** — deterministic per run, therefore invisible in a diff, and wrong. Index only
values that are unique; refuse the ambiguous ones as identity keys.

The same applies to a *declared* link on the other side: if a media/attachment row says "I belong to
record X" but record X does not reference that media, the declaration is unverifiable. Do not let it
produce a match.

## Step 6 — Report before/after, and separate certainty from questions

Emit three artifacts:

1. **A diff report** — per record, what the new source adds over the old one, and what the old source
   has that the new one lacks. ⚠️ **Report "0 lost" explicitly.** A merge that silently drops records
   looks exactly like a successful one.
2. **A machine-readable extraction** — records with their resolved classification.
3. **A dedupe queue** — every candidate, its kind, its score, and its evidence.

⚠️ **Report the classification before AND after the certain merges.** The matcher's own tally is
computed before they are applied, so printing it alone puts `NEW: 62` next to a records array
containing 2 merges — the number and the artifact disagree, and the number is what gets read.

⚠️ **Collapse repetitive warnings.** If 57 of 62 records emit the same warning, print it once with a
count and list the members in a collapsed block. A wall of identical lines hides the three warnings
that need a decision.

## Step 7 — Verify the merge is duplicate-free, then verify you changed nothing else

- Assert the known-duplicate set is **blocked from insert**. That is the R-01-style guard, and it
  should be a test, not a report line.
- Recompute the registry/collision check against the **live** key space — not a snapshot, not the
  offline index — so a collision surfaces while the merge is still being planned rather than on the run
  that writes. ⚠️ If the write stage **refuses**, that is the guard working: treat the refusal as a
  finding to diagnose, never as an obstacle to route around. The bug it exposes is usually upstream.
- ⚠️ **After touching shared matching code, re-run the existing pipeline and diff the artifacts.** If
  the previous corpus's output changed, you did not make a no-op change — you changed a live result.
  The cheapest acceptable evidence is: diff = **exactly one line** (a timestamp), or **empty**.

---

## Traps

- ⚠️ **Never let two stages derive the same plan independently.** If stage A computes a plan and
  stage B recomputes it "from the same records", B will silently drop every input that is not in the
  records. Measured instance: a render stage rebuilt the media plan from records alone, losing the
  *how many media rows does this record already own* map, so one image was planned under the bare
  slug — the `public_id` a **live** row already holds. First-wins registry generation would have given
  a live record's key to a different photograph. **Fix: make the plan a single artifact** — stage A
  writes it, stage B prefers it and falls back to recomputation only for inputs that carry none.
  ⚠️ **A pre-flight that validates the plan against the live system is what catches this class of bug**
  — keep it, and treat its refusal as a finding, not an obstacle. When a stage is given a second
  source, prefer the embedded plan and keep the fallback branch exercised by the original source.
- ⚠️ **A gitignored directory is still type-checked.** If the language toolchain has no
  `include`/`exclude` config, it walks everything on disk — a large ignored export full of vendored
  third-party source can break the build outright. Ignore files do not affect compilers. ⚠️ Adding an
  `exclude` **overrides** the default, so `node_modules` and build output must be re-listed.
- ⚠️ **Measure the media plan in objects, not bytes.** A 17 MB source set is trivial in bytes and can
  still be a 5× increase in object count — and object count is what object-store limits and per-object
  backup tooling care about.
- ⚠️ **Read counts out of the artifact, not out of the brief.** Briefs and PRDs are written before the
  data is measured. Re-derive every count and flag each disagreement; a wrong number in a planning
  document propagates into every decision made from it.
- ⚠️ **Keep the matcher and the planner pure.** No filesystem, no database, no env in the matching
  layer — then a fixture test can pin the exact scores, and a corpus test can run in CI against a
  committed artifact. Stamp filesystem facts (does the file exist?) in a separate pass.
- ⚠️ **Reuse the existing matcher verbatim when adding a second source.** Project the new corpus onto
  the shape the matcher already understands, so a difference in output is a difference in *data*,
  never in *code*. That is what makes the two reports comparable row for row.
- ⚠️ **An `*/` inside a doc comment silently closes the block comment.** Globs in prose
  (`uploads/**_**/`, `prefix-*/`) break the build in a confusing way. Write `<stamp>` instead.
- ⚠️ **A shell heredoc with `<<'EOF'` can still mangle `${…}`.** Write probe/scratch files with a file
  tool rather than a heredoc when they contain template syntax.
