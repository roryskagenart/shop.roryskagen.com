# DRAFT — PR plan: GitHub OAuth for the `/import` admin gate

| | |
| :--- | :--- |
| **Status** | DRAFT — not approved, not started |
| **Author** | Buddy (agent) |
| **Created** | 2026-10-01 |
| **Supersedes** | nothing |
| **Depends on** | PR #1 (`release/v0.1.0`) merged, or branched from it |
| **Scope** | Replace HTTP Basic on `/import` + `/api/import/fourthwall` with GitHub OAuth + allowlist |

> This is a **draft**. It is written before any implementation so the design can be reviewed and
> rejected cheaply. Nothing here is implemented.

---

## 1. Why

PR #1 gated the import surface with HTTP Basic auth (`middleware.ts`) because it was publicly
reachable. That gate works, but it has three limitations:

1. **A shared password is not an identity.** It cannot say *who* logged in, only that they knew the
   password. There is no per-person revocation.
2. **Rotation is all-or-nothing.** Changing the password locks everyone out at once.
3. **Credentials are typed by hand into a browser dialog**, which trains people to paste secrets into
   prompts.

Jaden asked whether the gate could instead key off an existing login (Fourthwall, Vercel, or GitHub).

## 2. What was ruled out, and why

| Option | Verdict | Reason |
| :--- | :--- | :--- |
| Reuse `FOURTHWALL_API_USERNAME` / `_PASSWORD` | **Rejected** | Fourthwall's API key grants "full access to your own shop". HTTP Basic resends it on every request and the browser caches it. One secret doing two jobs; rotating it for a human breaks the server integration. |
| Check for a fourthwall.com session | **Impossible** | The browser will not let `shop.roryskagenart.com` read `fourthwall.com` cookies. Third-party cookie blocking makes the naive version a non-starter. |
| Fourthwall Platform API OAuth | **Rejected** | It authorizes an **app** to act on a shop, not a **person** — there is no user-identity endpoint. Access tokens expire "within a few minutes", so it needs a refresh-token store. Docs scope it to *multi-shop apps*. |
| Vercel Deployment Protection | **Rejected** | Protects the **entire deployment**, including the public shop. Wrong shape for a route-level gate. |
| **GitHub OAuth + username allowlist** | **Chosen** | Yields a real identity (username, org membership) to allowlist, which is exactly what Basic auth cannot provide. |

## 3. Goal

A visitor to `/import` who is not an allowlisted GitHub user cannot reach the page or the API.
An allowlisted user authenticates once via GitHub and holds a session.

### Non-goals

- Not replacing the customer-facing site's auth. Only `/import` and `/api/import/fourthwall` are gated.
- Not building a general user system, roles, or permissions.
- Not touching the Fourthwall integration.

## 4. Design

### Flow

1. Unauthenticated request to `/import` → middleware sees no valid session → redirect to
   `/api/auth/github`.
2. `/api/auth/github` sets a short-lived signed `state` cookie (CSRF nonce) and 302s to
   `https://github.com/login/oauth/authorize?client_id=…&redirect_uri=…&scope=read:user&state=…`.
3. GitHub authenticates the user and redirects to `/api/auth/github/callback?code=…&state=…`.
4. Callback validates `state` against the cookie, exchanges `code` at
   `https://github.com/login/oauth/access_token`, then calls `GET https://api.github.com/user`.
5. If the returned `login` is in `ALLOWED_GITHUB_LOGINS`, set a signed HttpOnly session cookie
   (short TTL, e.g. 8h) and redirect to `/import`. Otherwise 403.
6. Middleware verifies the session cookie signature and expiry instead of comparing Basic credentials.

### New environment variables

| Name | Type | Environments |
| :--- | :--- | :--- |
| `GITHUB_OAUTH_CLIENT_ID` | Config | Production, Preview, Development |
| `GITHUB_OAUTH_CLIENT_SECRET` | **Secret** | Production, Preview, Development |
| `AUTH_SESSION_SECRET` | **Secret** | Production, Preview, Development |
| `ALLOWED_GITHUB_LOGINS` | Config | Production, Preview, Development |

`IMPORT_ADMIN_USER` / `IMPORT_ADMIN_PASSWORD` become unused once this lands. **Do not remove them in
the same change** — keep Basic auth as a fallback behind a flag for one release, so a broken OAuth
rollout cannot lock the studio out of its own admin page.

### Session cookie

Signed with HMAC-SHA256 via Web Crypto (available in the Edge runtime), payload
`{ login, exp }`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.

## 5. Known constraints and risks

| # | Risk | Severity | Mitigation |
| :--- | :--- | :--- | :--- |
| R1 | **GitHub OAuth Apps allow exactly ONE callback URL.** Preview deployments get different hostnames, so previews cannot complete the flow. | High | Either register a GitHub **App** (up to 10 callback URLs) instead of an OAuth App, or accept that previews use Basic auth and only production uses OAuth. |
| R2 | If the OAuth App is owned by `roryskagenart` and that account is renamed/removed, the app breaks. | Medium | Decide ownership deliberately — see OQ1. |
| R3 | A lockout: bad `AUTH_SESSION_SECRET` or a GitHub outage blocks the studio from `/import`. | High | Keep Basic auth as a fallback for one release (see §4). |
| R4 | Session cookie forgery if `AUTH_SESSION_SECRET` leaks or is weak. | High | 32-byte random secret; constant-time signature compare; short TTL. |
| R5 | Open redirect if `redirect_uri` or the post-login target is attacker-controlled. | Medium | Hard-code the post-login path; never accept a `next` param from the query string. |
| R6 | `read:user` is requested but a broader scope is accidentally added later. | Low | Request the minimum scope; assert it in a test. |

## 6. Open questions (with recommendations)

**OQ1 — Whose GitHub account owns the OAuth App?**
`roryskagenart` is a **User** account, not an Organization, so creating an app under it requires being
signed in as that account.
*Recommendation:* create it under `jadenblack`. **App ownership does not determine who can log in** —
access is controlled by `ALLOWED_GITHUB_LOGINS`. This removes a dependency on Rory's credentials and
survives a rename of his account. Revisit if the client wants to own it at handover.

**OQ2 — OAuth App or GitHub App?**
*Recommendation:* GitHub App if preview deployments must be able to log in (R1); otherwise OAuth App,
which is simpler.

**OQ3 — Keep Basic auth as a fallback?**
*Recommendation:* yes, for one release, behind a flag. The cost is a little dead code; the benefit is
not being locked out of your own admin surface by a bad deploy.

**OQ4 — Session lifetime?**
*Recommendation:* 8 hours. Long enough for a working session, short enough that a stolen cookie decays.

## 7. Evidence appendix

Every claim above that is checkable, with its source:

| Claim | Source |
| :--- | :--- |
| The API key grants full access to your own shop; OAuth is for multi-shop apps | `docs.fourthwall.com/guides/overview` |
| Fourthwall OAuth is an authorization-code flow; authorize URL is `my-shop.fourthwall.com/admin/platform-apps/<client_id>/connect` | `docs.fourthwall.com/guides/oauth` |
| Fourthwall access tokens expire "within a few minutes"; refresh via `grant_type=refresh_token` | `docs.fourthwall.com/guides/oauth` |
| The Storefront API exposes no customer/member session to third parties | `docs.fourthwall.com/storefront/overview` |
| Vercel Authentication protects whole deployments, including public ones | `vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication` |
| `roryskagenart` is a **User** account, not an Organization | `gh api users/roryskagenart --jq .type` → `"User"` |
| `/import` and the API are currently behind Basic auth | `middleware.ts`; runtime 401 verified 2026-10-01 |
| `IMPORT_ADMIN_USER` / `IMPORT_ADMIN_PASSWORD` were absent from Vercel in every environment | `vercel env ls`, 2026-10-01 |
| The repo has no CI prior to PR #1 | `.github/workflows/` absent, 2026-10-01 |

## 8. Test plan

Extend `middleware.test.ts` and add `app/api/auth/github/__tests__/`:

- No session cookie → redirect to `/api/auth/github` (not 401, so the browser flow works).
- Valid session cookie → passthrough.
- Expired session cookie → redirect.
- Tampered signature → redirect.
- `login` not in `ALLOWED_GITHUB_LOGINS` → 403, and **no** session cookie set.
- `state` mismatch on callback → 400, no token exchange.
- Requested scope is exactly `read:user`.
- `ALLOWED_GITHUB_LOGINS` parsing: whitespace, case-insensitivity, empty string.

CI (`.github/workflows/ci.yml`) already runs `tsc --noEmit` + `vitest`, so these are enforced
automatically.

## 9. Rollout

1. Land PR #1 first; this branches from it.
2. Register the app; put the four variables in Vercel (Production + Preview + Development).
3. Deploy **preview** and complete a real login before touching production.
4. Verify `/import` is reachable by an allowlisted login and 403 for a non-allowlisted one.
5. Remove Basic auth in a **follow-up** release, not this one.

## 10. Estimated size

~250–350 lines including tests: 2 route handlers, session sign/verify helper, middleware change,
allowlist parsing, tests, plus `.env.example` and docs updates.
