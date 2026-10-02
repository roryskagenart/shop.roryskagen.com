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
| [`pr-merch-catalog-v0.2.0_DRAFT.md`](pr-merch-catalog-v0.2.0_DRAFT.md) — **v0.2.0 "Staged Catalogue"** (re-scoped 2026-10-02 from "Sellable Storefront") | **DRAFT**, not started | `docs/merch-catalog-staged` (planned) | **OQ1–OQ8** — `beat-bop`'s dead image (T18) blocks the build outright; then the 1500px gate and `apparel` viability; see the document's open-questions table |

> ⚠️ The `pr-gh-oauth` document lives on the **unmerged** `docs/gh-oauth-plan` branch, so it is linked to
> its GitHub blob rather than a relative path — it does not exist on `main`.

## What v0.2.0 actually requires

Recorded here because the plan document is long and the state is easy to misread. **The tooling is merged;
the release is not executed.**

**Re-scoped 2026-10-02.** v0.2.0 now **constructs the catalogue only**. Publication, the front-end
refactor, and the removal of the fabricated-catalogue fallback are **Phase B** — a separate PRD. The
catalogue is built non-public and stays that way.

| Requirement | State |
| :--- | :--- |
| Merch importer with `--force`, dry-run by default | ✅ merged (`8373ef1`, PR #6) |
| `lib/fourthwall/merch.ts` + tests | ✅ merged |
| A committed catalogue manifest (10 artworks, 4 collections, 6 pinned template ids) | ❌ does not exist |
| Per-region eligibility check replacing the 1500px gate | ❌ still `FOURTHWALL_MIN_ACCEPTED_PX` |
| The build iterates all 6 templates in one run | ❌ one template per invocation |
| Collection create + `PUT /collections/{id}/products` in the build | ❌ not implemented |
| `--verify` mode asserting every product reads `HIDDEN` | ❌ does not exist |
| The catalogue built and staged non-public | ❌ not started |
| **Phase B** — publish, un-gate, remove the fabricated-catalogue fallback | ❌ separate PRD |

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
