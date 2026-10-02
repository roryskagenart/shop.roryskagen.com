# Release plans

Forward-looking plan documents. One file per proposed release or programme.

**A plan is a proposal, not a rule.** It is expected to change, and it is superseded the moment the work
executes. For what the system actually *is*, read [`../../agentic/`](../../agentic/README.md).

---

## The idiom

| | |
| :--- | :--- |
| **Naming** | `pr-<slug>_DRAFT.md` — the `_DRAFT` suffix is load-bearing; it signals an open document |
| **Branch** | `docs/<slug>` for the document; `feat/<slug>` or `fix/<slug>` for the implementation |
| **PR state** | Opened as a **draft** while any open question is unanswered |
| **Open questions** | `OQ1…`, **each with a recommendation attached**. A question without a recommendation is a stall, not a question |
| **Evidence** | Every claim in the body appears in an *Appendix A — Claim → evidence* table with a command or `file:line` |

Full convention: [`../../agentic/protocols/documentation.md`](../../agentic/protocols/documentation.md).

## ⚠️ Register every plan here

**A plan that is not registered is a plan nobody will find.** Add a row to the table below in the same PR
that creates the document — not afterwards.

**And commit the document, do not just leave it on disk.** A brand-new plan file is the most fragile
artifact in a session: untracked, so a `git checkout` or a stray cleanup deletes it silently and without a
trace. Commit (not push) before doing anything else.

## Index

| Document | Status | Branch / PR | Blocking on |
| :--- | :--- | :--- | :--- |
| [`pr-gh-oauth_DRAFT.md`](https://github.com/roryskagenart/shop.roryskagen.com/blob/docs/gh-oauth-plan/docs/releases/plans/pr-gh-oauth_DRAFT.md) — GitHub OAuth for the `/import` admin gate | **DRAFT**, open PR | `docs/gh-oauth-plan` · **PR #2** (draft, unmerged) | **OQ1–OQ4** — whose GitHub account owns the OAuth App; OAuth App vs GitHub App; whether to keep Basic auth as a fallback; session lifetime |
| [`pr-merch-catalog-v0.2.0_DRAFT.md`](pr-merch-catalog-v0.2.0_DRAFT.md) — **v0.2.0 "Sellable Storefront"** | **DRAFT**, not started | `docs/agentic-ops-kb` (this document only) | **OQ1–OQ8** — version-scheme reconciliation first; see the document's open-questions table |

> ⚠️ The `pr-gh-oauth` document lives on the **unmerged** `docs/gh-oauth-plan` branch, so it is linked to
> its GitHub blob rather than a relative path — it does not exist on `main`.

## What v0.2.0 actually requires

Recorded here because the plan document is long and the state is easy to misread. **The tooling is merged;
the release is not executed.**

| Requirement | State |
| :--- | :--- |
| Merch importer with `--force`, dry-run by default | ✅ merged (`8373ef1`, PR #6) |
| `lib/fourthwall/merch.ts` + tests | ✅ merged |
| Remove the fabricated-catalogue fallback | ❌ **still live** — `lib/fourthwall/index.ts:385` and `:451` return local JSON with no Fourthwall call. See [T01](../../agentic/traps/register.md#t01) |
| 4 sellable collections replacing 7 taxonomy handles | ❌ `lib/taxonomy.ts` still declares **7** |
| 10 artworks published, ~40 products | ❌ not published |
| Rebuild the 4 mugs at 15oz/20oz | ❌ still `White, 11oz` only — see [T06](../../agentic/traps/register.md#t06) |

## ⚠️ Before naming any release

Two version spaces disagree in this repo, and a release name chosen from the wrong one produces two
contradictory plans. **Check [`../../agentic/stack/overview.md#versions`](../../agentic/stack/overview.md#versions)
first.** Current state: only **`v0.1.0`** is tagged, while `lib/brand-config.ts:66-101` claims `v1.1.0` is
the current release.

## Relationship to the other document types

| Directory | Answers | Written |
| :--- | :--- | :--- |
| `docs/releases/plans/` | *What are we about to build?* | **Before** the work |
| [`../../agentic/sessions/`](../../agentic/sessions/) | *What happened on this date?* | During/after a session |
| [`../../reports/`](../../reports/README.md) | *Is the way we work actually working?* | Periodically |
