# Session records

One file per working day: `YYYY-MM-DD.md`. **Append-only.**

## What belongs here

A session record is a **distillation**, not a transcript. It exists so that a later reader can reconstruct
*why* the repo is the way it is.

Include:

- **Decisions taken**, with the rationale and who took them.
- **Measurements**, with numbers and the command that produced them.
- **What was left open**, and who owns it.
- **What turned out to be wrong** — including corrections to the agent's own earlier claims.
- **Release facts**: branch, commit, tag, PR, CI result.

Exclude:

- Command-by-command narration and raw tool output.
- Anything already promoted into [`../stack/`](../stack/) or [`../traps/register.md`](../traps/register.md).
  **Promote first, then record.**
- Speculation presented as finding.

## ⚠️ Correct your own claims

A session record that quietly drops a previously-asserted wrong fact is actively harmful, because the wrong
fact survives in whatever document quoted it. Write the correction explicitly:

> **Corrected:** the earlier claim that *X* was too strong. Measured *Y* on `<date>`.

## Index

| Date | Summary |
| :--- | :--- |
| [2026-10-01](2026-10-01.md) | First full working day: repo↔GitHub verification, importer repair, v0.1.0 released, Vercel account migration, first live Fourthwall writes, v0.2.0 plan drafted |

> Earlier work exists only as git history. It is **not** reconstructed here — a session record written from
> hindsight is a hypothesis, not a record. Future sessions should be appended as they happen.
