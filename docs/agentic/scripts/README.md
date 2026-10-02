# Scripts

Runnable, agent-agnostic helpers. Plain `bash` and Python — no framework, no runtime dependency.

| Script | Does | Mutates anything? |
| :--- | :--- | :--- |
| [`preflight.sh`](preflight.sh) | Session-start checks: git state, working-tree pollution, version collisions, gate baseline | **No.** Read-only. |
| [`verify.sh`](verify.sh) | Runs the gate sequence and reports exact counts | **No.** Read-only. |
| [`check-links.py`](check-links.py) | Validates every relative Markdown link **and `#anchor`** across the repo | **No.** Read-only. |
| [`normalize-skill-frontmatter.py`](normalize-skill-frontmatter.py) | Rewrites `skills/*/SKILL.md` frontmatter to the portable shape | **Yes** — but only `docs/agentic/skills/**`, and it is idempotent. |

---

## Usage

```bash
bash docs/agentic/scripts/preflight.sh          # read-only checks
bash docs/agentic/scripts/verify.sh             # run the gates
python docs/agentic/scripts/check-links.py --root .

# the frontmatter normalizer needs a Python 3 interpreter
python docs/agentic/scripts/normalize-skill-frontmatter.py docs/agentic/skills
```

## The link guard is known to fail correctly

`check-links.py` was observed failing — **5 missing targets and 8 broken anchors** — on the first run
against this KB, and then passing after the fixes. That red-then-green is the point: a guard nobody has
watched fail is not a guard.

Anchor comparison is deliberately **loose** (alphanumerics and hyphens only). GitHub's slugger treats emoji
and punctuation inconsistently, so a strict comparison produces false failures — and a guard that cries
wolf gets disabled. Explicit `<a id="…"></a>` anchors are honoured, which is why the trap register carries
one per entry.

## Conventions these scripts follow

- **Read-only by default.** A diagnostic that changes state is not a diagnostic. The one script that writes
  is named for what it writes.
- **Never destructive.** No `rm`, no `git checkout`, no `git reset`. `preflight.sh` *reports* a polluted
  working tree; it does not clean it, because cleaning it could discard a real change.
- **No credential values.** Scripts print variable **names** and presence, never values.
- **Fail visibly, not silently.** Every check prints `ok` / `WARN` / `FAIL` and the script exits non-zero if
  anything failed — so it can be used as a gate.
- **Windows-safe.** These run under Git Bash on this machine. That means:
  - no `taskkill /PID $!` (an MSYS pid is not a Windows pid — see
    [`../traps/register.md`](../traps/register.md#t18));
  - no reliance on `grep -c` exit status inside `&&` chains (`grep -c` exits 1 on a zero count);
  - no CRLF-sensitive parsing.

## Adding a script

1. **Justify it.** A script that saves one command is not worth the maintenance.
2. **Make it idempotent or make it read-only.**
3. **Print the evidence**, not just a verdict. The output should be quotable in a plan's evidence appendix.
4. **Document it in the table above.**
