---
name: generated-doc-guard-integrity
description: "Make a generated/derived document's guard actually able to fail. Use when a repo has a generated doc (routes table, doc index, manifest, file inventory) with a --check mode, when a claims/registry file names an asserted_by check, when a generator regex-parses source, when adding a suite that verifies generated output, or when a document is suspected stale. Also use before trusting a green 'X is up to date' result, and when a test suite must verify a build artifact without spawning a child process."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Generated-Document Guard Integrity

A generated document (`routes.md`, `doc-map.md`, a file inventory, a manifest) is usually
protected by a generator that has a `--check` mode, plus a suite check that is *supposed* to
run it. Both halves fail silently in the same way, and the failure is invisible precisely
because everything stays green.

**Core rule: a guard that cannot fail is worse than no guard, because it is believed.**

## The two failure modes

### 1. `--check` cannot catch a generator bug — by construction

`--check` compares the document against **the generator's own output**. A generator that
misreads the tree agrees with itself perfectly.

Measured: a generator whose regex matched a *comment* instead of code emitted a document with
an **empty** table, and `--check` printed `"is up to date"` the whole time. The document was
committed. Nothing failed.

→ `--check` catches **drift** (someone edited the source without regenerating). It can never
catch **a parser bug**. You need both, and they are different checks.

### 2. The registry names a check that does not exist

A claims/registry file (e.g. `claims.json`) asserts `"asserted_by": "suite.mjs — 'routes.md is
current'"`. Measured: **that check did not exist.** The nearest one asserted that the
*generator file* contains the string `--check` and never ran any generator — so the registry
named a guard that could not see the document at all.

Its cost was already paid: the document had drifted (`ComponentsPage.tsx` 164 lines when the
file had 165) and nobody noticed.

```bash
# ALWAYS do this for every asserted_by you are about to trust
grep -rF "<the check name>" tests/ || echo "ABSENT — the registry is lying"
```

## Procedure

### 1. Audit the guards before adding anything
```bash
# every check name the suite actually registers
grep -nE '^\s*check\("' tests/*.mjs
# does each registry asserted_by name a real one?
grep -rF "<name from claims.json>" tests/
```
A registry entry is a claim. Verify it like any other.

### 2. A regex/line parser must strip comments first
A regex cannot tell code from a comment, and **source files document themselves** — a comment
that quotes a route tag, a glob, or a code sample is indistinguishable from the real thing.

```js
/**
 * Blank out comments. Blanked, not deleted: every character becomes a space and newlines are
 * kept, so a line number still points at the line a human would open.
 *
 * Block comments FIRST. Blanking line comments first swallows the terminator that closes a
 * block comment and leaves it unterminated.
 */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ")
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, pre) => pre + " ".repeat(m.length - pre.length))
}
```

⚠️ **Do not write `*/` inside a block comment**, including inside backticks. It terminates the
comment and the rest of the prose is parsed as code. Measured: a JSDoc line reading
"swallow the `` `*/` `` that closes a block comment" produced a cascade of syntax errors.
Describe it in words.

### 3. Make the generator REFUSE to emit a degenerate document
The generator's job is to print the tree. When it cannot read the tree it must **fail**, not
print a plausible-looking table.

```js
if (!publicRoutes.length) throw new Error("parsed 0 public routes — the parser is reading a comment")
const leaked = adminRoutes.filter((r) => isFromAnotherSection(r))
if (leaked.length) throw new Error(`wrong block boundary: ${leaked.map((r) => r.path).join(", ")}`)
const unresolved = routes.filter((r) => r.target === "?")
if (unresolved.length) throw new Error(`could not resolve: ${unresolved.map((r) => r.path).join(", ")}`)
```

A `?` in the output means "the parser gave up". That must never reach a document.

### 4. Negative-control EVERY guard — and DELETE any you cannot make fail
A guard that has only ever seen correct input is a claim, not a guard.

```bash
# Build a scratch copy that reads an env-selected source, so you never touch the real file
sed -e 's#path.join(ROOT, "src", "App.tsx")#path.join(ROOT, "src", process.env.NEGCTL_APP || "App.tsx")#' \
    -e 's#"routes.md"#"NEGCTL-routes.md"#' scripts/_gen.cjs > scripts/_negctl.cjs
# Perturb a COPY of the source, run, confirm the expected guard throws, then restore
```

Then reason about reachability. Measured: a guard "the block must contain its own parent route"
**could never fire** — the block's locating regex required that route's text to be present. It
was deleted. Keeping it would have been a fourth assertion nobody could falsify.

Pair every negative control with a **positive** one: a scanner returning `[]` for everything
also "passes". Assert an exact count.

### 5. Assert the ARTIFACT's content, not just the generator's self-consistency
Read the committed document and assert properties a parser bug would violate:

- the section is **non-empty** (the exact bug above);
- no cell is the parser's give-up marker (`?`);
- **cross-check against a different source**: every file path the document names exists, and
  any count it states equals the real count. The two halves of a row then come from different
  sources and can disagree — that is what makes the check independent of the parser.

### 6. Never spawn a child process from the suite
```js
spawnSync(process.execPath, [gen, "--check"])   // EBUSY in a sandbox
```
Measured: **both** generators returned `status === null` / `EBUSY`. `status === null` is a
**spawn failure**, not a stale document — but the check still *fails*, producing environmental
noise that gets a real check ignored.

Do not ship it with a silent skip either. Verify **in-process**: read the artifact and assert
its content (step 5), or require the generator and call its render function. If a suite is
genuinely unrunnable where it is read, say so in the check's comment and put the real assertion
elsewhere.

### 7. If you are measuring a build-artifact cost, get the baseline on the SAME tree
**Unwiring imports is not enough.** Build tools that scan source files by glob (Tailwind v4)
emit CSS for files that are merely *present*. Measured: removing the imports changed nothing
(identical CSS hash); moving the files **off disk** was required to see the real +4.29 kB.

State which baseline you measured. A "the bundle is unchanged" claim is usually a claim about
the wrong baseline.

### 8. When a test fails, decide which side is wrong — do not assume it is the code
Measured, on one suite's first run: four failures were one real bug, one real document defect,
and **two bugs in the test itself** (a boundary helper whose fallback swallowed the next
declaration; a scan that flagged a document for *mentioning* `javascript:` in a code span —
code spans do not escape `:`, so the scan must be attribute-scoped, never prose-wide).

Diagnose before "fixing". Print the actual rendered output, not the stripped version.

## Checklist

- [ ] Every `asserted_by` in the registry names a check that exists (`grep -rF`).
- [ ] The suite asserts the artifact's **content**, not only that `--check` exists.
- [ ] The parser strips comments before parsing; no `*/` inside a block comment.
- [ ] The generator throws on empty / unresolved / cross-section output.
- [ ] Every guard was negative-controlled, and unreachable guards were deleted.
- [ ] Every negative check is paired with a positive one asserting an exact count.
- [ ] No `spawnSync` in the suite; verification is in-process.
- [ ] Any build-cost claim states its baseline and was measured on the same tree.
- [ ] Any stated count was read from the run, never from a document.
