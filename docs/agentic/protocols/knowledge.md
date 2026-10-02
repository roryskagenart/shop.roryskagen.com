# Protocol — Knowledge

How a fact gets into this KB, and how it leaves.

**Core rule: a fact belongs in exactly one place.** Duplication is the failure mode that kills a knowledge
base — two copies drift, and a reader cannot tell which one is true.

---

## 1. Routing — where does this fact go?

| The fact is… | It goes to | Test |
| :--- | :--- | :--- |
| A rule that must never be broken | [`/AGENTS.md`](../../../AGENTS.md) | "If this is violated, we lose data or money." |
| A measured behaviour of an external system | `stack/` | "I can re-measure this with a command." |
| Something that bit us | `traps/register.md` | "It cost time, and it will again." |
| A repeatable procedure | `skills/<name>/SKILL.md` | "I would want to follow steps next time." |
| What happened on a date | `sessions/YYYY-MM-DD.md` | "This is a record, not a rule." |
| A transient observation | **nowhere durable** | "This will be false next week." |

If it fits two rows, pick the more durable one and **link** from the other.

## 2. Trap entry format

Every entry in [`../traps/register.md`](../traps/register.md) carries all six fields:

```
### T<n> — <one-line claim>
**Status:** OPEN | MITIGATED | RESOLVED (since <date>, by <commit>)
**Bites:** <what goes wrong, and how loudly>
**Evidence:** <the command, or file:line, that proved it>
**Do instead:** <the correct action>
**Source:** <session date, or the PR that introduced it>
```

- **No evidence, no entry.** An unverified trap is worse than no trap, because someone acts on it.
- **Status is mandatory.** `RESOLVED` entries are kept, not deleted — they are regression tests waiting to
  be written.
- **`Bites` must describe the failure mode**, not the mechanism. "Nothing throws; every page returns 200"
  is a bites line. "The fallback is at line 385" is not.

## 3. Skills

Ported procedures live at `skills/<name>/SKILL.md` with portable frontmatter:

```yaml
---
name: <kebab-case>
description: "<when to use it — a trigger, not a summary>"
version: <semver>
x-origin: <where it came from>
x-migrated: <date>
---
```

Rules:

- The `description` is a **trigger**, written for someone deciding whether to open the file. It should
  describe *situations*, not *contents*.
- The body is **tool-agnostic**. Reference `git`, `curl`, `gh`, `npm` — real CLIs. Do not reference agent
  runtime tools by name.
- A skill must be **runnable by a human**. If it needs a specific agent to execute, it is not a skill.
- `scripts/normalize-skill-frontmatter.py` enforces the frontmatter shape and is idempotent.

## 4. Session records

`sessions/YYYY-MM-DD.md` — one file per working day, **append-only**.

A session record is a **distillation**, not a transcript. It captures:

- what was decided, and why;
- what was measured, with numbers;
- what was left open, and who owns it;
- what turned out to be wrong (including the agent's own earlier claims).

It does **not** capture: command-by-command narration, tool output, or anything already promoted into
`stack/` or `traps/`. Promote first, then record.

> ⚠️ **Correct your own earlier claims in the record.** A session record that quietly drops a
> previously-asserted wrong fact is actively harmful — the wrong fact survives in whatever document quoted
> it. Write "corrected: the earlier claim that X was too strong; measured Y."

## 5. Retirement

- **Superseded** → delete the weaker copy, keep a link, note it in `CHANGELOG.md`.
- **Resolved** → mark `RESOLVED`, keep the entry.
- **Never silently renumber, rename, or overwrite someone else's decision.** Surface it, recommend, wait.
- **Version the KB.** `VERSION` + `CHANGELOG.md`, per [`README.md`](../README.md#4-bump-version-and-write-a-changelogmd-entry).
  MAJOR for a rule change in `/AGENTS.md`, MINOR for new content, PATCH for corrections.

## 6. Review cadence

- **Every session:** did anything I learned belong in `traps/` or `stack/`? Promote it now — you will not
  remember next session.
- **Every release:** does the release invalidate any documented behaviour? Mark it.
- **Quarterly:** re-measure the dated claims in `stack/`. Vendors change; a 2026-10-01 measurement of a
  third-party API is a hypothesis, not a fact, by the next quarter.
