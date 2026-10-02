# Protocol — Destructive actions and live probes

**Core rule: a probe must not be able to destroy the thing it is probing.** If you cannot prove that in
advance, do not send the request.

This protocol exists because of a specific incident. An agent wanted to know whether
`PATCH`/`PUT /products/{id}` existed on the Fourthwall Platform API. It sent `DELETE /products/{id}` to a
**real, live product id** to see what would happen. The API returned `204` — a **soft delete** — and a
customer-visible product was archived. The agent then had to recreate it, which left an archived duplicate
in the catalogue permanently.

Nothing crashed. No test failed. That is exactly why this rule is written down.

---

## Before any write to a live system

1. **Read the docs first.** If a documented endpoint answers the question, no probe is needed. The
   Fourthwall API's `405` for update methods is documented; the `DELETE` probe was avoidable.
2. **If a probe is genuinely necessary, probe a scratch record.** Create a throwaway object, probe against
   *that*, then delete the throwaway. Never probe against production data.
3. **State the blast radius before sending.** "If this works, X changes. If it fails, Y changes. Is either
   acceptable?" If you cannot answer, you are not ready to send it.
4. **Prefer a read.** Where a read can answer the question, a write is never justified.

## Known-destructive operations in this project

| Operation | Effect | Notes |
| :--- | :--- | :--- |
| `DELETE /open-api/v1.0/products/{id}` | **Soft delete** — `state: SOLD_OUT`, `access: ARCHIVED` | Reversible **only via the dashboard**. Also **releases the slug**. |
| `PUT /products/{id}/availability` `{available:true}` | 200, but **does not reverse an archive** | Do not use it to try to undo a `DELETE`. |
| `POST /collections` | Collection is **immediately PUBLIC** | Its slug derives from `name`; you cannot rename it afterwards. |
| `PUT /collections/{id}/products` | **Replaces the full product list** | Declarative — it is not an append. Omitting an id removes it. |
| `npm install` after deleting `node_modules` | Can leave the tree unusable | Never combine a wipe with a *background* install. |
| Any `git push` to `main` | **Deploys production** | Requires explicit per-release approval. |

Full API surface: [`../stack/fourthwall.md`](../stack/fourthwall.md).

---

## Local destructive actions

- **Never `taskkill /PID $!`.** In Git Bash `$!` is an MSYS pid, not a Windows pid — `taskkill` resolves
  the number as a Windows PID and hits an unrelated process. Measured: it killed the calling shell. Use
  bash's builtin `kill "$PID"`, or take a real Windows pid from
  `netstat -ano | grep LISTENING | grep ":3300 "`.
- **Sweep the listener, not the wrapper.** `npm run dev &` leaves the real server alive after you kill the
  npm wrapper; the port stays held and the next start fails with a misleading `Port … is already in use`.
- **Do not delete `node_modules` as a troubleshooting step** without a plan to restore it in the
  foreground, and never while a background task depends on it.

---

## Personal-file operations

If a task touches files outside the repository — Desktop, Downloads, Documents, home — the rules tighten:
scan is read-only, nothing is moved or deleted without an explicit per-file confirmation, and deletion goes
through the OS trash rather than `rm`. This repository's work does not normally require it. If a request
would, stop and ask rather than inferring permission from the original phrasing.

---

## Undo

Before a destructive action, know the undo. If there isn't one, that is the signal to not do it. For
Fourthwall specifically, most "undo" paths are **dashboard-only** — there is no API to unarchive a product
or to rename a collection.
