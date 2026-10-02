---
name: headless-react-verification
description: "Build a zero-new-dependency verification suite for a React/TypeScript app that asserts on RENDERED output instead of source text — bundle the real components with the esbuild already inside vite, render them with react-dom/server, and check the resulting HTML. Use when asked to 'test all functionality', 'verify the build', 'add tests' to a Vite/React project, when a repo has docs describing a test plan that was never implemented, when you need CI-runnable checks with no browser, or when you must prove that links, ids, ARIA targets, images and copy are correct rather than merely present in the source. Also use when a repo's own rules are normative ('a release gate, not a guideline') and need a test instead of a reviewer's memory. Also use before editing a shared layout/chrome component that is composed by string replacement, or that some pages inline rather than import — a seam whose needle stops matching fails silently, and a change made in the seam reaches only the pages that use it. Also use when the claim is CSS-dependent — paint order, stacking, overflow clipping, what a badge reads against, responsive hiding — which headless rendering CANNOT see: covers escalating to a real browser via an isolated playwright-core workspace, boot/shoot/teardown in one invocation, the Windows/Chromium gotchas, pixel-measurement rules that stop nonsense results, proving a probe can fail, and using the deployed build as a free control. Also use when a layout 'wrap' or 'jump' needs diagnosing — comparing rects gives false positives on baseline-aligned inline-blocks, so delete the suspect node and re-measure instead."
version: 1.2.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Headless React Verification

Build a test suite that renders the real components and asserts on the output — with no
new dependencies, no browser, and no test framework.

**Core rule: assert on rendered output, never on source text.** "The file contains an
anchor" and "the component renders an anchor" are different claims, and only the second
one is what a user experiences. This distinction is what catches dead affordances —
elements that render, look interactive, and do nothing.

---

## When this applies

- A Vite + React + TypeScript project (or any project where `vite` is a dependency).
- You need CI-runnable verification and cannot rely on a browser.
- The repo has normative rules (component provenance, import boundaries, route counts)
  that currently live only in a reviewer's memory or a PRD.
- You are asked to "complete and test all functionality" and need to *prove* completion.

If the project already has a test runner and installed framework, use that instead — the
value here is specifically the zero-install path.

---

## Step 1 — Confirm esbuild is available

`vite` bundles `esbuild`. Verify rather than assume:

```bash
node -e "console.log(require('esbuild/package.json').version)"
```

If that resolves, you need no `package.json` change at all. Add only scripts:

```json
"test": "npm run build && node tests/run.mjs",
"test:only": "node tests/run.mjs"
```

`npm test` builds first so the suite can also assert against compiled CSS — that is how
you catch classes that exist in markup but were never emitted by the stylesheet.

---

## Step 2 — The loader

Bundle each module to ESM on the fly and import it. **Leave React external**, or the
rendered tree and the renderer end up with two React copies and you get
`Invalid hook call` — which reads as a test failure and is not one.

```js
import { build } from "esbuild"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const ROOT = path.resolve(import.meta.dirname, "..")
const TMP = path.join(ROOT, "tests", ".tmp")

const loaded = new Map()

export async function load(relativePath, name) {
  if (loaded.has(name)) return loaded.get(name)
  mkdirSync(TMP, { recursive: true })
  const outfile = path.join(TMP, `${name}.mjs`)

  await build({
    entryPoints: [path.join(ROOT, relativePath)],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    jsx: "automatic",
    tsconfig: path.join(ROOT, "tsconfig.app.json"), // for the @/* alias
    external: ["react", "react-dom", "react-dom/server", "react/jsx-runtime"],
    define: { "process.env.NODE_ENV": '"test"' },
    logLevel: "silent",
  })

  const mod = await import(pathToFileURL(outfile).href)
  loaded.set(name, mod)
  return mod
}

export async function render(relativePath, name) {
  const mod = await load(relativePath, name)
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { createElement } = await import("react")
  return renderToStaticMarkup(createElement(mod.default))
}
```

**Do not use `packages: "external"`** — it also externalises the `@/*` path alias. Name
React explicitly; that is all that must be a single shared instance.

Add `tests/.tmp/` to `.gitignore`.

---

## Step 3 — Five traps, all of which produce FALSE FAILURES

Every one of these was measured. They are the reason the helpers exist.

### Trap 1 — scanning HTML comments

Explanatory comments in markup strings often *document* the very thing you are checking,
including example markup like `<a href="#terms">`. Scanning raw HTML finds them and
reports links no visitor can reach. **Measured: 3 phantom dead anchors.**

```js
export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, " ")
}
```

Run every structural scan through this first. Do not skip it for "just this one check".

### Trap 2 — unanchored attribute matching

`aria-invalid="false"` matches a naive `id\s*=\s*"([^"]*)"` and reads as `id="false"`.
**Measured: 6 phantom duplicate ids on one page.**

```js
export function attr(html, name) {
  const re = new RegExp(`(?<![\\w-])${name}\\s*=\\s*"([^"]*)"`, "g")
  const out = []
  let m
  while ((m = re.exec(html)) !== null) out.push(m[1])
  return out
}
```

### Trap 3 — lazy element extraction

`/<div[^>]*id="x"[\s\S]*?<\/div>/` stops at the **first nested child**, silently
truncating everything inside — so a dialog appears to be missing its contents. Walk the
tag depth instead:

```js
export function element(html, openPattern) {
  const m = new RegExp(`<([a-z]+)\\b[^>]*${openPattern}[^>]*>`, "i").exec(html)
  if (!m) return null
  const tag = m[1]
  const scan = new RegExp(`<${tag}\\b|</${tag}>`, "gi")
  scan.lastIndex = m.index + m[0].length
  let depth = 1, step
  while ((step = scan.exec(html)) !== null) {
    if (step[0][1] === "/") {
      depth -= 1
      if (depth === 0) return html.slice(m.index, step.index + step[0].length)
    } else depth += 1
  }
  return html.slice(m.index)
}
```

### Trap 4 — Tailwind selector escaping

To check "is this class actually emitted by the stylesheet", you must reconstruct the
selector Tailwind writes, and two details silently lose real classes:

- A **leading digit becomes a hex escape**: `.2xl\:gap-4` is emitted as `.\32xl\:gap-4`,
  because a CSS identifier cannot start with a digit.
- **Only ASCII is escaped**: `before:content-['✓']` keeps its ✓ raw.

Also, a naive selector parse reads the decimal point of `.3` followed by `2xl\:gap` as
the single token `32xl:gap`. Prefer a boundary-checked substring search over a parse:

```js
export function cssSelector(token) {
  const esc = (s) => s.replace(/[\x00-\x7F]/g, (c) => (/[A-Za-z0-9_-]/.test(c) ? c : `\\${c}`))
  if (/^\d/.test(token)) return `.\\3${token[0]}${esc(token.slice(1))}`
  return `.${esc(token)}`
}

export function hasClass(css, token) {
  const needle = cssSelector(token)
  let from = 0
  for (;;) {
    const at = css.indexOf(needle, from)
    if (at === -1) return false
    const next = css[at + needle.length]
    if (next === undefined || !/[A-Za-z0-9_\\-]/.test(next)) return true // boundary
    from = at + 1
  }
}
```

---

### Trap 5 — nested `<footer>` (and any element legal inside `<blockquote>`)

`<footer>` is legal inside `<blockquote>`, and a testimonials section commonly uses it
for the attribution line. So **neither** obvious regex works:

```js
/<footer[\s\S]*<\/footer>/    // greedy: first testimonial -> end of document
/<footer[\s\S]*?<\/footer>/   // lazy: stops at that same testimonial
```

Both report "the footers differ between pages" when they are byte-identical. Take the
**last** opening tag:

```js
export function siteFooter(html) {
  const clean = stripComments(html)
  const start = clean.lastIndexOf("<footer")
  if (start === -1) return null
  const end = clean.indexOf("</footer>", start)
  return end === -1 ? clean.slice(start) : clean.slice(start, end + "</footer>".length)
}
```

Generalise: before writing a `first`/`last`-sensitive matcher, ask whether the element
can legitimately appear more than once.

---

## Injection seams: verify the OUTPUT, and check who actually uses the seam

A repo that generates markup then post-processes it with string `.replace()` has a
failure mode that no type checker or linter catches: **a needle that stops matching
changes nothing and raises nothing.** The page renders — just with the old content.

Two rules:

**1. Assert the output, not the seam.** Never test that the transform function contains
a `.replace()`. Render the page and assert the removed string is absent and the
replacement is present. Then **negative-control it** by loading the *raw* pre-transform
module and confirming the removed strings are still there — that proves the check has
teeth:

```js
const raw = await load("src/chrome-markup.ts", "chrome-markup")   // pre-transform
console.log(raw.FOOTER_HTML.includes("string that should be gone"))  // must be true
```

**2. Find out which pages actually use the seam.** This is the expensive one. A shared
"chrome" or "layout" module is very often *not* shared by every page — pages ported
from a static prototype frequently carry their own inline copy of the header, footer
and modals. A change made only in the seam then reaches one page out of four, and
every test you wrote against that one page passes.

Before touching a shared component, grep for who imports it:

```bash
grep -rn "SiteChrome\|headerHtml\|FOOTER_HTML" src/pages/
```

If some pages render `<SharedChrome>` and others carry inline copies, **the change must
be made twice**, and the suite must assert it across **every route**, not a sample. A
per-route loop with a column per property makes the gap visible at a glance:

```
/             ok    ok    ok    ok
/residential  FAIL  FAIL  FAIL  FAIL     <- the seam reached only /contact
```

That single rendered table is what caught it.

---

## Step 4 — Design the suites

Split by *what kind of claim* is being made, not by file. A workable split:

| Suite | Reads | Proves |
|---|---|---|
| Policy | source tree, `package.json`, config | The repo's normative rules (import boundaries, provenance, route counts, stack wiring) |
| Unit | a pure module | Non-trivial logic, boundaries, edge cases |
| Rendered markup | `render()` output | Routes render; ids, ARIA targets, images, anchors, forms are valid |
| Stylesheet | `render()` + built CSS | Every class in the markup was emitted |
| Copy hygiene | `render()` output, text flattened | No scaffolding language, doubled words, contradictory facts, verbatim repeats |

**When logic is hard to test, extract it — do not weaken the test.** Pull the decision
into a pure module and let the DOM-bound code merely call it. This turns "needs a browser"
into seven assertions in seconds, and it is almost always a better design anyway.

---

## Step 5 — Negative-control every check that parses something

A check that parses a file can pass because the parser found nothing. Prove it can fail:

```bash
node -e '
const scan = (s) => [...s.matchAll(/npm (?:run )?([a-z][\w:-]*)/g)].map(m => m[1]);
console.log("real  ->", scan(require("fs").readFileSync("README.md","utf8")));
console.log("bogus ->", scan("npm run ghost-script"));
'
```

If `bogus` does not produce the failure you expect, the check is decorative. **A hardcoded
allow-list is not a check** — parse the real artifact so it catches drift added later.

### Writing the probe script

Probe scripts are code with backslashes, `${}`, `&` and quotes in them, and a shell
heredoc will silently mangle all four — `\[` becomes `/`, `${x}` triggers a
"Bad substitution" error, `&` gets reinterpreted. Measured: two probes corrupted before
switching approach.

**Write probe files with the file-write tool, not `cat > probe.mjs <<EOF`.** Name them
with a leading dot and delete them afterwards. If you must use a heredoc, quote the
delimiter (`<<'EOF'`) and still expect trouble with `\[` and `${}`.

### After scripted edits, always lint

When a batch of replacements is applied by a script, one mistyped escape in the script
becomes a syntax or lint error in the source — a `\"` inside a raw Python string lands a
literal backslash-quote in a JSX `class` attribute. `eslint` caught exactly that via
`no-useless-escape`. Run the linter after any scripted edit pass; do not trust the
script's own "applied N edits" line.

Also assert the **match count** for every replacement and fail loudly on zero. A pattern
that silently stops matching produces a no-op that looks like success.

---

## Step 6 — Make the output usable

A check should return an **array of problem strings**, so one check reports every failure
it finds rather than stopping at the first. When something breaks broadly, a single
"✗ failed" tells you nothing.

```js
export function check(text, fn) {
  state.checks += 1
  let problems = []
  try {
    const result = fn()
    if (Array.isArray(result)) problems = result.filter(Boolean)
    else if (result === false) problems = ["assertion returned false"]
  } catch (err) {
    problems = [`threw: ${err?.message ?? String(err)}`]   // a throw IS a failure
  }
  // ✓ / ✗, print up to 12 problems, collect into state.failures
}
```

Always wrap `fn()` in try/catch — a check that throws must fail, not abort the run.

---

## Step 7 — Document what it cannot cover

State the gap explicitly in the suite's README, with numbers. Say which thresholds are
**not** automated and why. An unstated gap is read as coverage.

Things that genuinely need a browser: layout/pixel diffs, `IntersectionObserver`
animations, console output, computed styles, horizontal overflow.

If a repo has pixel thresholds in its spec, say plainly that they were not re-measured
and name what can move (absolutely-positioned overlays are the usual culprit when copy
length changes).

---

## Step 8 — When the artifact is CSS-dependent, render it in a real browser

`renderToStaticMarkup` has no layout engine. Anything where the answer is *"which element
paints on top of which"* is invisible to the suite, and a suite can be green while the
page is visibly broken. Escalate to a browser when the claim is about:

- paint order, stacking, negative margins, `overflow` clipping
- whether a badge/icon actually reads against what is *behind it*
- responsive behaviour (what is hidden at which breakpoint)

**Keep the browser out of the repo's dependencies.** Install `playwright-core` into an
isolated workspace (`~/.workbuddy-ai/binaries/node/workspace/node_modules`) and point
`executablePath` at the cached Chromium. Set `NODE_PATH` when running. `package.json`
stays clean, which matters when the suite's whole selling point is "no new dependencies".

### Boot, shoot and tear down in ONE invocation

A long-lived background dev server does not survive a session reconnect, and a half-dead
server leaves the next run talking to nothing. Write a wrapper script that starts vite,
polls for a real `200`, runs the capture, and tears down on an `EXIT` trap — all in a
single call.

Four gotchas, each of which reads like a different problem:

| symptom | cause | fix |
|---|---|---|
| probe never sees the server, though the log says "ready" | vite's default `localhost` binds `::1` only on Windows | `vite --host 127.0.0.1` |
| `curl` reports **502 for localhost** | a proxy env var | `curl --noproxy '*'` |
| `Clipped area is either empty or outside the resulting image` | `page.screenshot({clip})` clips against the **viewport**, and the target is below the fold | `scrollIntoViewIfNeeded()` then re-read `boundingBox()` |
| capture comes back blank | a `.reveal`-style `opacity:0` waiting on an `IntersectionObserver` | `reducedMotion:'reduce'` **plus** injected `*{transition:none!important;animation:none!important}` and `.reveal{opacity:1!important}` |

### Measuring pixels: three rules that stop nonsense results

1. **Decide a visual variant by rendering every candidate into ONE contact sheet**, then
   look. Do not argue from the design system — measure. A documented "invert on dark
   surfaces" rule was *wrong* for a badge that sat 75% over a photo rather than over the
   band; only the render showed it.
2. **Restrict the scan to the element's own column/box.** A whole-card colour scan catches
   the same colour elsewhere in the card and reports impossible numbers (measured: "98px"
   of a colour on a 62px element).
3. **Count a ROW, not an AREA, when the element contains a contrasting glyph.** A chip with
   a white icon inside is only ~91% its own background colour, so an area threshold flags a
   perfectly healthy element as broken. The load-bearing measurement is usually *"where is
   the first row of the colour"* — `3px` from the top is healthy, `32px` means something is
   painting over it.

### Diagnosing a layout wrap: delete the suspect node, never compare geometry

When something "wraps" or "jumps", the tempting probe is geometric — read two rects and
compare them. **That is unreliable, and it fails in the direction that looks like success.**

Measured: a hero headline's rotating word was reported as wrapping. A probe compared the
trailing text node's rect `top` against the span's `top` and reported **"wrapped" on every
row** — including rows whose element height never changed. The span was an `inline-block`,
which is **baseline-aligned**, so its box top is not the line top. The probe was measuring
an alignment artifact, and it appeared to confirm the hypothesis that was already believed.

The probe that settles it removes the ambiguity instead of interpreting it:

```js
// measure with the suspect present, DELETE it, measure again, put it back
const withNode = measure()
node.remove()
const without = measure()
parent.insertBefore(node, el.nextSibling)
```

If the metric becomes **constant** once the node is gone, that node is the whole cause. Here:
with the trailing period the element had **two** distinct heights at every breakpoint,
without it **one** — and the delta was *exactly one `line-height`*, which is what identified
it as an orphaned line rather than a sizing problem.

Three transferable points from that bug:

- **The reported symptom named the wrong element.** "The word wraps" was false — the word
  always fitted (603px into 610px). The **period after it** was the overflow, because it was
  a *sibling* text node and so did not shrink when the span was scaled down. When a
  fit/scale routine measures "the thing", check whether the line it is fitting contains
  something it is **not** measuring.
- **Check which axis a crop/focus option can even move.** Asking for `north`/`centre`/`south`
  on a landscape→portrait crop produced three *identical* tiles per candidate, because
  covering a portrait consumes the source's whole height. Only `west`/`centre`/`east` differ.
  A sheet of identical tiles is not "the options don't matter" — it is the wrong axis.
- **Commit a wrong probe SUPERSEDED, with a header saying why** rather than deleting it. The
  wrong method *looked* like confirmation, which is exactly the trap the next person falls
  into. Say which probe supersedes it.

### The deployed build is a free control

Production lags your working tree until you push, so measuring the same page **locally and
against the deployed URL** isolates your change from everything else — no stashing, no
`git worktree`. Measured this way: a hero's resting height moved `+0..2px` while the `119px`
jump it replaced was gone, which is a claim a single-build measurement cannot make.

Two cautions. A selector keyed on something only the *new* build has (a new `id`, a renamed
file) will silently walk to a **different element** on the old one — compare only columns
that exist in both, and say so when one does not. And a **mid-deploy state can report values
from neither build**; a surprising number is worth re-measuring before it is believed.

### Prove the probe can fail before trusting it

A probe that cannot fail proves nothing, and its green result is worse than no result. Add
a sensitivity mode that **breaks the thing on purpose in the live DOM** and re-measures:
strip the fix class, re-read the same pixel, and assert the number moves. If it does not
move, the probe is not observing what you think it is.

### A new element can silently break an existing check

Adding a badge took two existing lockup checks from 3 discs to 4 and from 1 glyph path to
2 — the new element matched the old check's selector. **Fix by tightening the old check to
a signature unique to its target**, never by loosening it further. In that case the
discriminator was `shrink-0 rounded-full` (every chrome lockup disc) versus a bare
`rounded-full bg-white`, which also matched a *button* whose arrow sits in its own circle.

The general shape: a **container** that shares a class with your target is not your target.
Anchor on the class that only the target carries.

---

## Before you write any check, ask what the artifact actually is

Cheap verification that prevents expensive wrong work:

- A hash link like `#terms` may be **translated by a hook** to a different id
  (`legal-terms`) — it is not dead. Read the hook before reporting it.
- Apparent id mismatches may be **entity-escaped attributes** (see Trap 2).
- A class may be absent from the stylesheet **and** absent from the original design
  system — then it is vestigial and removing it cannot shift layout. Confirm against
  the compiled CSS *and* the source of truth before calling it a bug.
- Sub-page navigation may legitimately use **top-level routes** where the home page uses
  section anchors. Render and compare; do not infer from a template.

**When a test fails, suspect the test first.** In one session three assertions were wrong
and the code was right (raw href comparison across routes, per-page vs per-nav counting,
a route regex counting top-level routes as nested). Deleting a wrong assertion is
progress; bending code to satisfy one is a regression.
