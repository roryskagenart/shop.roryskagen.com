# Dev reports

Retrospective, analysis-shaped documents about **how this project is being developed** — read by a human
who wants to know whether the process is working, not by an agent that needs to change code.

---

## How this differs from the other document types

| Directory | Answers | Audience | Written |
| :--- | :--- | :--- | :--- |
| `docs/releases/plans/` | *What are we about to build?* | Implementer | **Before** the work |
| `docs/agentic/sessions/` | *What happened on this date?* | Next agent | **During/after** a session |
| `docs/reports/` | *Is the way we work actually working?* | A human reviewing the process | **Periodically**, over a span |

A report is the only one of the three that is allowed to draw conclusions about the *process* rather than
the product. If it is restating what a session record already says, it does not belong here.

---

## Naming

```
docs/reports/YYYY-MM-DD-<slug>.md
```

The date is the date the report was **generated**, not the period it covers. State the covered period in
the body — reports are usually retrospective over a range, and a filename cannot express a range without
becoming unreadable.

## Required sections

Every report carries all five. The first two are what stop a report from being an unfalsifiable narrative.

| Section | Contents |
| :--- | :--- |
| **Provenance** | Source artifact, generator, byte size, generation date, and **any rendering or completeness defect** in the source. |
| **Scope** | What the report covers, and — explicitly — **what data it contains that is out of scope for this repo**. |
| **Findings** | The observations, with numbers. |
| **Recommendations** | Concrete, checkable next actions. |
| **Verification status** | For each headline number: re-derived locally, or merely **reported by the generator and not verified**. |

### Rules

1. **A number you did not re-derive is labelled as reported, not verified.** This repo has a documented
   history of stale figures (a test count of 67 when the real count was 127). A report that launders a
   generator's arithmetic into a repo fact is worse than no report.
2. **State the scope of the data.** A usage report generated on this machine will contain other projects'
   work. That is a fact about the source, not a licence to publish it.
3. **Never include secrets.** Same rule as everywhere else in this repo.
4. **Reports are append-only in spirit.** If a later report contradicts an earlier one, write a new entry
   and say what changed. Do not quietly rewrite history — the disagreement is the useful part.
5. **Do not delete a report whose recommendations were rejected.** Record the decision instead.

## ⚠️ Cross-project data

Reports generated from machine-wide telemetry (agent usage, tooling metrics) will describe **other
projects and other clients**. This repository is **public**.

Before committing a report, check it for:

- other clients' or projects' names;
- another project's architecture, versions, or incidents;
- personal or process commentary that is fine locally and not fine published.

**Either scope the report to this project, or do not commit it.** Record the decision either way — see
the first entry's Scope section for the pattern.

## Index

| Date | Report | Covers | Status |
| :--- | :--- | :--- | :--- |
| 2026-10-02 | [Agent usage insights](2026-10-02-agent-usage-insights.md) | 2026-09-14 → 2026-10-02, **all projects on this machine** | ⚠️ Cross-project data — commit decision pending |

## Template

```markdown
# <Title>

## Provenance
- Source: <path or command>
- Generated: <date> by <generator>
- Rendering/completeness defects in the source: <or "none">

## Scope
- Covers: <period, subject>
- ⚠️ Out of scope for this repo: <other projects, other clients — or "none">

## Findings
<Observations, with numbers. Mark each as verified or reported.>

## Recommendations
<Concrete, checkable actions.>

## Verification status
| Figure | Value | Verified? |
| :--- | :--- | :--- |
```

## Relationship to the KB

The knowledge base at [`../agentic/`](../agentic/README.md) is the maintained reference. **A report is not
a KB document** — it is dated, it may be superseded, and it should not be cited as a rule. When a report
produces a durable fact, promote it into `../agentic/` and link back.
