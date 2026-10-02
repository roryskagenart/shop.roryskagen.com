---
name: blocked-deploy-author-gate
description: "Diagnose and fix a deploy that is BLOCKED because of the commit AUTHOR, not the code — and diagnose any CI/deploy status without the `gh` CLI. Use when a push succeeds but the site does not update, when a commit status reads 'Deployment was blocked' or 'Git author … must have access to the project/team on Vercel', when a private repo under a free/Hobby plan refuses to deploy, when only some commits deploy while others on the same branch do not, or when the user assumes a GitHub PAT or a GitHub plan upgrade will unblock a deploy. Also use to read commit statuses, check runs and deployments for a SHA using `git credential fill` when `gh` is not logged in."
version: 1.0.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Blocked Deploys: the Author Gate

**Core rule: when a push succeeds but nothing deploys, the gate is usually WHO authored the commit,
not what is in it.** The token used to push is almost never the lever.

## Read the status before theorising

Never guess at a deploy failure from the UI. The commit status API carries the provider's own
diagnosis, including a URL that usually names the fix. Do this first:

```bash
# `gh` is often NOT logged in even when `git` works — they use different credential stores.
# Recover the token `git` already has, and pipe it in. Never echo it.
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status"
```

Read **all** of: `state`, each `statuses[].context`, `.description`, and especially
`.target_url`. Then compare several commits — the discriminating signal is a *difference* between
commits, so pull the last 6–8 and tabulate `author` against `state`.

```bash
for sha in $(git log --format=%h -8); do
  printf '%s | %s | ' "$sha" "$(git log -1 --format='%an <%ae>' $sha)"
  curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$OWNER/$REPO/commits/$sha/status" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.state+' | '+((j.statuses[0]||{}).description||'-'))})"
done
```

## ⚠️ The error names the symptom; `target_url` names the party

`"Git author ventureio must have access to the project on Vercel to create deployments."` reads like
"fix the author email" — and that reading is wrong often enough to be dangerous. In the worked case
the *same* author email deployed successfully on an older commit, so the email alone could not be
the rule. The `target_url` was the actual answer — a team-invite link:

```
vercel.com/teams/invite?gitUserLogin=<OUTSIDER>&teamId=<TEAM_ID>&teamName=<TEAM>&...
```

**Extract `gitUserLogin` and `teamName` from that URL. That identifies both the blocked party and
the team whose ownership is required.** Also note `gitUserId` — it disambiguates from the commit
`user.name`, which is free text and frequently differs from the GitHub login.

## The Vercel Hobby + private repo rule

From Vercel's own docs (`/docs/deployments/troubleshoot-project-collaboration`), verbatim:

> *"The Hobby Plan does not support collaboration for private repositories. If you need
> collaboration, upgrade to the Pro Plan."*
> *"To deploy commits under a Hobby team, the commit author must be the **owner of the Hobby team**
> containing the Vercel project connected to the Git repository. This is verified by comparing the
> Login Connections Hobby team's owner with the commit author."*

So on Hobby + private, **only the team owner's commits deploy.** Everyone else is blocked, no matter
which credential they push with.

### Fixes, cheapest first

1. **Re-author the commit as the team owner** (free, immediate). Identify the owner empirically: it
   is the author of the one commit that *did* deploy. Usually the team-namesake address.
   ```bash
   GIT_COMMITTER_NAME="Owner Name" GIT_COMMITTER_EMAIL="owner@example.com" \
     git commit --amend --no-edit --author="Owner Name <owner@example.com>"
   git push --force-with-lease=<branch>:<expected-old-sha> origin <branch>
   ```
   Set **both** author and committer. Use `--force-with-lease=<ref>:<sha>` (not `--force`) so it
   aborts if the remote moved. **Before amending, record the old SHA and prove the tree is
   unchanged** with `git diff <old-sha> HEAD --stat` (empty = only authorship changed).
2. **Make the repo public** — Vercel: *"Collaboration is free for public repositories."* Free, but
   exposes source. Rarely acceptable for client work.
3. **Upgrade the Vercel team to Pro**, then invite the blocked user. Paid.

**A GitHub PAT does not help. A GitHub plan upgrade does not help.** The plan that gates this is
**Vercel's**. Say so plainly — it is the most common wrong assumption and it costs the user money.

### Durable form

Amending fixes one commit. To stop it recurring, set the repo-local identity so future commits are
authored correctly: `git config user.name … && git config user.email …`. Flag that this means every
commit appears under that identity — a convention change the user should agree to.

## Verify the deploy actually shipped the code

A `success` status is not proof the change is live. Fetch the deployed artifact and compare against
the local build:

- **Bundle sizes are a strong fingerprint.** A production build's `index-<hash>.js` byte count
  should equal the locally measured one exactly.
- For an SPA the served HTML is only a shell — grep the **JS bundle**, not the HTML, for content
  markers. Minification renames identifiers, so marker-search for *string literals* and *class
  names* (e.g. a hex colour, a custom class, a copy string), not function names.
- Confirm which hostname actually serves the project. A custom domain may belong to a **different**
  project — check for a different framework's fingerprints (`/_next/static/` for Next.js, etc.)
  before telling the user "the site is updated".

## Pitfalls

- ⚠️ **`curl -o /dev/null -w '%{size_download}'` silently reports `0` on Git Bash/Windows** while
  still printing `http=200` — which reads exactly like an empty response. It can also exit 23 and
  break an `&&` chain. **When a byte count is evidence, fetch to a real file and `stat -c%s` it.**
- ⚠️ **Do not use one asset's hex (or one file's marker) as the fingerprint for a whole family.**
  Grep the family: a sibling asset may use a different but equally superseded value, so a
  single-value probe reads as "clean" when the old branding is still there.
- ⚠️ **A local `origin/<branch>` ref can be stale.** Verify with `git ls-remote origin <ref>`.
- ⚠️ **`git push --dry-run origin <branch>` printing "Everything up-to-date" proves nothing** about
  write access. Probe a throwaway ref instead:
  `git push --dry-run origin HEAD:refs/heads/__write-probe__` → `* [new branch]` = writable.
- ⚠️ **A user-supplied PAT pasted into chat is compromised.** Use it via an env var, write it to no
  file, and tell them to rotate it.
- ⚠️ **Do not assume a documented PR/CI flow is the real one.** Check for `.github/workflows`; an
  absent one means the only gate is the deploy provider's status.
