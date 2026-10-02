# Skills

Reusable procedures, ported out of an agent runtime's skill directory into this repo so they are
**reviewable, versionable, and runnable by a human**.

A skill here is a Markdown procedure. It is not code, and it is not tied to any agent framework.

---

## Contract

| Rule | |
| :--- | :--- |
| **Frontmatter** | `name`, `description`, `version` are required. `x-origin` / `x-migrated` record provenance. |
| **`description` is a trigger** | Write it for someone deciding *whether to open the file*. Describe **situations**, not contents. |
| **Body is tool-agnostic** | Reference real CLIs (`git`, `curl`, `gh`, `npm`, `vercel`). **Never reference agent runtime tools by name.** |
| **Runnable by a human** | If it needs a specific agent to execute, it is not a skill. |
| **Idempotent tooling** | [`../scripts/normalize-skill-frontmatter.py`](../scripts/normalize-skill-frontmatter.py) enforces the frontmatter shape and produces identical bytes on a second run. |

Adding a skill: create `skills/<kebab-name>/SKILL.md`, then run the normalizer. Do **not** hand-format the
frontmatter.

---

## Index

### Release and planning

| Skill | Use when |
| :--- | :--- |
| [`repo-grounded-release-planning`](repo-grounded-release-planning/SKILL.md) | Asked to plan a release, sequence a feature programme, or slot a new programme beside an existing plan. **Checks the version number first** — this repo has already spent a version twice. |
| [`docs-reconciliation-release`](docs-reconciliation-release/SKILL.md) | Docs are suspected stale, or a docs-only release is wanted. Reconciles documentation against real git state before cutting it. |

### Integration and failure triage

| Skill | Use when |
| :--- | :--- |
| [`silent-integration-failure-triage`](silent-integration-failure-triage/SKILL.md) | **A sync/import/webhook reports success while nothing changes.** Covers env-var name drift, host confusion between two APIs of one vendor, and false-success error paths. **Directly applicable to this repo** — see [`../traps/register.md`](../traps/register.md#t01) and `#t28`. |
| [`blocked-deploy-author-gate`](blocked-deploy-author-gate/SKILL.md) | A push succeeds but the site does not update; a commit status reads "Deployment was blocked". Also diagnoses CI/deploy status **without** the `gh` CLI. |
| [`vercel-account-migration`](vercel-account-migration/SKILL.md) | A Vercel project moved between accounts, or a freshly imported project builds but serves empty pages. **This repo completed that migration** — see [`../stack/environments.md`](../stack/environments.md). |
| [`sandbox-vs-machine-anomaly`](sandbox-vs-machine-anomaly/SKILL.md) | A filesystem or git anomaly needs triage: real machine defect, sandbox artifact, or damage the agent's own tooling just caused? **Decide before diagnosing or changing config.** |

### Verification

| Skill | Use when |
| :--- | :--- |
| [`headless-react-verification`](headless-react-verification/SKILL.md) | A React/TypeScript app needs tests that assert on **rendered output**, not source text, with zero new dependencies. Relevant here: `next build` is not usable locally (T16), so rendered-output checks matter more. |
| [`generated-doc-guard-integrity`](generated-doc-guard-integrity/SKILL.md) | A generated document has a `--check` mode. **Makes the guard actually able to fail.** |

### Repository hygiene

| Skill | Use when |
| :--- | :--- |
| [`concurrent-tree-isolation`](concurrent-tree-isolation/SKILL.md) | `git status` lists files you never touched, or files you wrote revert mid-session. Move the session onto its own branch and worktree. |
| [`catalog-merge-duplicate-guard`](catalog-merge-duplicate-guard/SKILL.md) | Merging a legacy CMS export into a live catalogue, and you must prove it **cannot** create duplicates. Relevant if `roryskagenart.com` content is ever merged in. |
| [`windows-app-not-found-diagnose`](windows-app-not-found-diagnose/SKILL.md) | A Windows program appears installed but is not reachable from the shell — `command not found`, stale PATH, winget oddities. **This is a Windows dev machine.** Also covers the case where the honest answer is *"there is no CLI"*: how to prove a GUI-only app has no shell entry point, and the byte-level binary probe that shows which config files a CLI actually reads. |

---

## Not migrated

Deliberately excluded — recorded here so the omission is explicit rather than an oversight.

| Excluded | Why |
| :--- | :--- |
| `airbnb`, `obsidian`, `github`, `github-ai-trends` | Vendored from a third-party marketplace. Not ours to redistribute, and not relevant to this project. |
| `static-prototype-page-duplication` | No static prototype exists in this repo. |
| `github-docs-mirror-readonly` | No docs-mirror surface exists in this repo. |

Re-add any of these if the project grows the surface they serve.
