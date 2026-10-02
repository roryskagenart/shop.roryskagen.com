# AGENTS.md — `scripts/`

Scoped rules for one-shot scripts. **These add to the root [`/AGENTS.md`](../AGENTS.md), and win over it
inside this directory.**

⚠️ **Everything in this directory writes to a live production system.** There is no staging Fourthwall shop.
Treat every script here as a production change.

---

## Before running anything here

1. **Read the script.** These are not idempotent by accident — check whether it is.
2. **Dry-run first.** `publish-merch-to-fourthwall.ts` is **dry-run by default**; the flag to actually write
   is explicit. Do not add a way to skip that.
3. **Confirm the target.** Two Fourthwall APIs, two hosts. Confirm which one the script calls before it
   runs. → [`../docs/agentic/stack/fourthwall.md`](../docs/agentic/stack/fourthwall.md#1-two-apis-two-hosts)
4. **Know the blast radius.** There is **no update endpoint** — a mistake means archive + recreate, which
   leaves an archived duplicate permanently. → T03
5. **Never run a write script against a live product id to "test" it.** That is exactly how a live product
   was archived. → T02

## The scripts

| Script | Writes? | Notes |
| :--- | :--- | :--- |
| `publish-merch-to-fourthwall.ts` | **Yes** — Platform API | Dry-run by default. Has **`--force`** to rebuild a product whose name is already taken — needed because an archived product keeps its name, so name-dedupe would silently skip it. |
| `import-artworks-to-fourthwall.ts` | **Yes** — Platform API | ⚠️ The originals **cannot** be created by this API (T12). Do not assume a successful run means the catalogue is correct. |
| `migrate-env-to-new-project.mjs` | **Yes** — Vercel env | Keeps an existing env var's **type** when migrating; a type cannot be changed once set. Confirm with `vercel env ls` and **count**. → T20 |

## Non-negotiables

- **Do not resolve a template by name.** The list is mutable and changed mid-session. Pin ids. → T07
- **Resolve the design region from the template's `customizableAreas`, per template.** A hardcoded
  `"front"` works for a tee and is rejected for a mug. → T08
- **Pass `sizes` explicitly.** Omitting them creates exactly one variant — the bug is live in production on
  four mugs. → T06
- **Verify by re-`GET`, not by the script's own log.** A script reported `Success/Ready: 137, Failed: 0` on a
  **401**. → T28
- **Cache-bust before concluding a write failed.** → T11
- **Never `taskkill /PID $!`** in Git Bash — `$!` is an MSYS pid and `taskkill` resolves it as a Windows pid,
  hitting an unrelated process. It has killed the calling shell. → T18
- **Never wipe `node_modules` and then install in the background.** → T19

## Testing

Changes to anything these scripts import (`lib/fourthwall/**`) are covered by the three test files under
`lib/fourthwall/__tests__/`. Run **both** gates — `tsc --noEmit` and `vitest run`. Baseline: **97 passed /
6 files**. → T15
