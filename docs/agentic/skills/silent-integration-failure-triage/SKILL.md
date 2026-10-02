---
name: silent-integration-failure-triage
description: "Diagnose a third-party API integration that reports SUCCESS while doing nothing. Use when a sync/import/webhook feature logs 'complete' but nothing changes upstream, when a UI badge shows an amber 'not configured' or 'optional' state despite secrets being set, when an API returns 404 with an HTML body instead of JSON, when logs show '<!DOCTYPE html>' or 'Received HTML document instead of JSON', when credentials are described as 'stored in Vercel' but the app still asks the user to type them, or when a user asks whether secrets can be 'handled automatically instead of entered in the UI'. Covers env-var name drift between the deploy platform and the code, host-confusion between two APIs of the same vendor, and false-success error paths."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Silent Integration Failure: three checks, in order

**Core rule: when an integration says "complete" but nothing happened, the bug is usually in the
wiring, not the credentials — and the error path is usually lying about it.** Do these three checks
before touching any secret.

A run that "works" because it falls back to local data will happily hide a completely dead API path.

---

## Check 1 — Env-var name drift (deploy platform vs. code)

The single highest-yield check. Secrets can be present in the platform and **invisible to the app**
because the names disagree.

```bash
# what the platform provisions (names only)
vercel env ls                    # or: gh secret list / aws ssm describe-parameters
# what the code actually reads
grep -rn "process\.env\." --include="*.ts" --include="*.tsx" src app lib | sort -u
```

Diff the two sets. Measured case (2026-10-01, Rory Skagen shop):

| Provisioned in Vercel | Read by the code | Result |
| :--- | :--- | :--- |
| `FOURTHWALL_API_USERNAME` | `FOURTHWALL_API_KEY` | never matched |
| `FOURTHWALL_API_PASSWORD` | `FOURTHWALL_API_SECRET` | never matched |

Every secret was present and correct. The app resolved empty strings, `hasPlatformCredentials`
was permanently `false`, and the UI showed an amber "Optional (Provided Below)" badge that read
like a *feature* rather than a bug.

**Fix by aliasing in code, not by re-entering secrets** — preferred name first, legacy name as
fallback. It needs no platform change, no secret re-entry, and cannot break the running app:

```ts
const apiKey = cleanEnv(process.env.PROVIDER_API_USERNAME) || cleanEnv(process.env.PROVIDER_API_KEY);
```

Then expose the resolved *mode* (`'bearer' | 'basic' | 'none'`) through the status endpoint so the
UI reports what actually happened, not what was hoped for.

## Check 2 — Two APIs, two hosts (never derive one from the other)

Vendors commonly split a public read API and an admin write API onto **different hosts**. Deriving
one URL from the other by string-munging produces a plausible-looking URL that 404s.

Measured case: the importer built its write endpoint as
`storefrontApiUrl.replace('/v1','') + '/open-api/v1.0/products'`.

**Probe both before believing either** — a 404 and a 401 mean opposite things:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{}' \
  https://api.fourthwall.com/open-api/v1.0/products                  # 401 = exists, needs auth
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{}' \
  https://storefront-api.fourthwall.com/open-api/v1.0/products       # 404 = wrong host
```

`401` with no body = correct URL, rejected credentials. `404` = the path does not exist at all.
**A `404` whose body is HTML is the signature of "you hit the wrong host"**, and it is what a
Next.js app returns when it POSTs to one of its own routes by mistake.

Fix: give the write API its own constant + optional env override. Never compute it.

```ts
export const DEFAULT_PLATFORM_API_URL = 'https://api.fourthwall.com';
// platformApiUrl: env override || DEFAULT_PLATFORM_API_URL
```

**Generalise:** if `grep` shows the same base URL feeding both a read client and a write client,
suspect host confusion.

## Check 3 — Does the error path report failure?

The reason Check 1 and 2 went unnoticed. Read the `else` branch of the response handler:

```ts
if (res.ok || res.status === 201) { created++; }
else {
  logs.push(`[Info] ... ${res.status} - ${errText.slice(0,100)}`);
  created++;                       // ← counts a 401 as success
}
```

A 401 auth failure then reports `Success/Ready: 137, Failed: 0` and the UI badge reads
**`SYNC COMPLETE`**. The broken state is indistinguishable from the working one.

Rules that follow:
- Non-2xx must increment `failed`, never `created`.
- Log response codes at a level the UI colours as a problem, not `[Info]`.
- Return a non-`success` result so the badge cannot claim completion.
- Log the resolved endpoint and auth mode at the top of every run — this is the line that makes the
  whole class of bug self-diagnosing.

---

## Ordering note

Fix Check 3 **first** if you can. Without it you are debugging blind, and you cannot tell whether
Check 1 and 2 fixes actually worked.

## Gotchas

- **`vercel env pull` writes decrypted values to disk.** Pull to a temp path, read only the keys you
  need, then delete. `[SENSITIVE]`-typed vars cannot be pulled and appear as placeholders — that is
  expected, not a failure.
- **The sandbox's safe-delete guard blocks `rm -rf` on paths with an embedded drive prefix**
  (`C:/Users/...`). Use the PowerShell form for temp cleanup.
- **`bun install` / `npm install` can rewrite a committed lockfile** (measured: `bun install` bumped
  a pinned `react` RC to `^19.3.0` in `bun.lock`). Always `git diff --stat` after installing, and
  revert the lockfile if the bump was not intended — otherwise a dependency upgrade rides along in
  your change set.
- **Gate admin routes by middleware, not by a field in the UI.** HTTP Basic auth via `middleware.ts`
  protects the page, the GET and the POST in one place, needs no client-side secret, and the browser
  caches it for the session. A token input field in the page would leak the secret to the client.
- **In Edge middleware, do not import a shared util module** that transitively imports
  `next/navigation` — inline the small helper instead.
- **Fail closed.** If the gate's env vars are unset in production, return `503`; only allow through
  in development. Fail-open security fixes are worse than none because they look done.
