---
name: vercel-account-migration
description: "Move a Vercel project from one account/team to another — the env vars, the domains, the DNS, and the CI that still points at the old place. Use when a user says they created a new Vercel account, re-imported the repo to fix the Git connection, and now needs to finish the migration; when a freshly imported project builds but serves empty pages, 404s, or wrong URLs; when they ask what else is needed before moving a custom domain across accounts; or when a project has two Vercel homes and it is unclear which one is live."
version: 1.1.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Migrating a Vercel project between accounts

Re-importing a repo into a new Vercel account is the usual fix for a broken Git connection. It
almost always lands **half-done**: the code deploys, so the site looks alive, but every
externally-configured thing is still missing. Work this list in order.

## 1. Establish which project is actually live — before changing anything

Two Vercel homes for one repo is the normal mid-migration state, and it is easy to "fix" the wrong one.

```bash
# Where does the custom domain point right now?
curl -sS -o /dev/null -D - -L https://<domain>/ | grep -iE '^(HTTP/|server:|x-vercel)'
```

Then confirm the **new** project's Git link really works, using the GitHub commit status rather than
trusting the dashboard:

```bash
gh api repos/<owner>/<repo>/commits/main/status --jq '.statuses[] | "\(.context) | \(.state) | \(.target_url)"'
```

A `Vercel | success | https://vercel.com/<new-scope>/<new-project>/<id>` line proves push-to-deploy is
live on the new account. No such line means the integration is still broken.

## 2. The new project has no environment variables — this is the main event

Vercel does **not** carry env vars across accounts or projects. A project with zero vars still builds
and still serves anything that reads local files, so it looks healthy while everything API-backed is
dead. Prove it behaviourally rather than by reading the dashboard:

| Probe | Symptom when vars are missing |
| :--- | :--- |
| A page backed by the external API | empty / zero results |
| A detail page for a remote record | **404** |
| `/robots.txt` or `/sitemap.xml` | advertises a per-deployment `*.vercel.app` URL |
| Any nav built from a remote list | entries silently missing |

### You cannot copy the secrets by API — plan for it

- A token for account A **cannot read** account B's project.
- `vercel env pull` writes `[SENSITIVE]` placeholders for every secret-typed value. They are not
  recoverable from Vercel by anyone.
- Therefore: take the **pullable config values** from a pull of the old project, and the **real
  secret values** from the developer's local `.env.local` (or wherever they actually live). Merge
  with the local file winning.
- Write the target vars as `plain` if they are `NEXT_PUBLIC_*` / non-secret (so a future pull still
  works), and `encrypted` for genuine secrets. **Encrypted values can never be pulled back down** —
  say so, or the next person will lose them.

Use the Vercel API directly so no CLI scope juggling is needed:

```
POST  /v10/projects/{idOrName}/env     body: {key, value, type, target:[...]}
PATCH /v9/projects/{idOrName}/env/{id} body: {value, type, target:[...]}
GET   /v9/projects/{idOrName}/env?decrypt=false      # list, to make re-runs idempotent
```

Also copy over the **non-production targets**. A pull with no `--environment` fetches `development`
only, so a project that has vars in production+preview but not development will silently pull empty
for the next developer. Write all three.

### Before chasing a missing webhook secret, check a webhook exists

A `*_WEBHOOK_SECRET` that cannot be recovered looks like a blocker. It often is not:

```bash
curl -sS -u "$USER:$PASS" https://api.<vendor>.com/open-api/v1.0/webhooks
# {"results":[]}  -> no webhooks are configured, so the secret is dead config
```

If the list is empty, set a fresh random value and move on — and note that whatever the webhook was
supposed to trigger (cache invalidation, sync) is **not happening at all**.

## 3. Domains: the DNS move is usually NOT transparent

Resolve the record before assuming a re-point is free:

```bash
curl -sS -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=<sub>.<domain>&type=CNAME'
```

- Target `cname.vercel-dns.com` → generic; re-adding the domain elsewhere usually needs no DNS edit.
- Target **`<hash>.vercel-dns-017.com`** → **project-scoped**. Re-adding the domain to another
  project issues a *different* target, so the CNAME must be edited at the registrar. Always re-read
  the exact target Vercel displays after adding the domain.
- Check the nameservers too (`type=NS`). External nameservers (e.g. Porkbun, Cloudflare) mean records
  are editable by hand; Vercel-managed nameservers mean a different flow.
- When the apex is owned by the **other** account, expect a **TXT ownership verification** record to
  be required before the subdomain will attach.

**Move the narrowest name that solves the problem.** Moving an apex that serves a different site
drags that site into the migration.

## 4. `*.vercel.app` names do not move

`<project>.vercel.app` is bound to the project name. After a move the old name either stops resolving
or keeps serving the old project. Any env var holding it (commonly `NEXT_PUBLIC_VERCEL_URL`, used for
`robots.txt` / `sitemap.xml` / OG images) must be repointed — ideally at the real custom domain, not
at another `*.vercel.app` name.

## 5. Clean up the CI that existed to work around the broken connection

A repo often carries a `.github/workflows/deploy.yml` whose whole purpose was "deploy via CLI because
the Git integration is broken". Once the integration works it is obsolete, and if it holds the **old**
org/project IDs as repo variables it is an active footgun:

```bash
gh variable list -R <owner>/<repo>     # VERCEL_ORG_ID / VERCEL_PROJECT_ID pointing at the old home?
gh secret list -R <owner>/<repo>
```

Leaving it armed means flipping the enable flag deploys the **old** project. Delete the workflow and
the stale variables. Read the workflow's own header comment — it frequently says to delete it.

## 6. The cutover hazard nobody notices

While the custom domain still points at the **old** project, a push deploys the **new** one. So:

> **A green Vercel status does not mean the live domain updated.**

Reach the public site with a manual `vercel deploy --prod` against whichever project owns the domain
until the cutover is done. A local `.vercel/project.json` is also easy to forget — it keeps pointing
at the old project, so local CLI deploys go to the old home. Re-link after the move.

## 7. Verify after cutover, against the real domain

```
/robots.txt                      -> Host is the custom domain, not a deployment URL
<remote-backed page>             -> expected non-zero results
<remote detail page>             -> 200, not 404
checkout / external redirects    -> still point where they should
```

Then, and only then, delete the old project.

## 8. Prove local ↔ remote congruence — don't assume it

Two traps make "I copied the env vars" feel finished when it is not.

**`NEXT_PUBLIC_*` (and any build-time inlined var) are baked in at build time.** Writing the value into
Vercel changes nothing for the deployment that is already live — you must trigger a **new deployment**
before the change exists. Server-only vars do not have this problem, which is exactly why the gap is
easy to miss: the app looks fine, and only the client-side config is stale.

**Never take a value from the developer's paste — take it from the pull.** They will often quote the
*pre-migration* value from memory. Measured: a pasted `NEXT_PUBLIC_VERCEL_URL` was the old
`*.vercel.app` host while production actually held the custom domain, so writing the paste would have
*created* the mismatch it was meant to remove. Pull, then diff.

```bash
# 1. key-set diff: what does remote have that local lacks?
vercel env pull .env.pull.tmp --environment=production --yes
grep -o '^[A-Z_0-9]*=' .env.pull.tmp | tr -d '=' | sort > /tmp/remote.keys
grep -o '^[A-Z_0-9]*=' .env.local    | tr -d '=' | sort > /tmp/local.keys
comm -23 /tmp/remote.keys /tmp/local.keys      # in remote, missing locally

# 2. does a value actually work? source the file so the secret never hits the command line
set -a; . ./.env.local; set +a
curl -s -o /dev/null -w '%{http_code}\n' "<vendor API>?token=${THE_TOKEN}"   # expect 200
```

Then prove the **app** sees them, not just the shell:

- Run the dev server and watch the log for the app's own env-validation warning (many apps have a
  `validateEnvironmentVariables()`-style check). **Its disappearance is the strongest single signal.**
- Hit a route that renders a base URL — `/sitemap.xml` / `/robots.txt` — and confirm it shows the
  custom domain, not a `*.vercel.app` host.

**Also grep for *destructured* `process.env`.** A dotted-only grep (`process\.env\.[A-Z_]+`) silently
misses `const { A, B, C } = process.env;`, which is a common pattern for site metadata:

```bash
grep -rn "process\.env" --include=*.ts --include=*.tsx . | grep -v node_modules \
  | grep -vE "process\.env\.[A-Z_0-9]+"      # surfaces bare/destructured uses
```

Vars found this way are frequently set **nowhere** (not local, not Vercel) and still render
`undefined` in OG images and aria-labels — pre-existing, but worth reporting while you are in there.

**Expect benign noise to surface once the vars work.** Enabling the real config often reveals
pre-existing 404s and placeholder values that were previously masked (a `GTM-xxxxxxx` placeholder
overriding a working fallback, a configured collection handle the vendor does not have). Distinguish
"my change broke this" from "my change made this visible" before fixing anything.
