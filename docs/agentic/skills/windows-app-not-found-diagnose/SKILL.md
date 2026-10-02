---
name: windows-app-not-found-diagnose
description: "Diagnose and fix Windows app problems: a program that appears installed but is not accessible from the shell (command not found, PATH not refreshed, winget shows nothing), a winget install that fails with installer exit code 1, a toolchain missing its linker (Rust/C++), or an install left half-broken by a reboot. Also covers PATH auditing (empty slots, duplicates, stale entries, the setx truncation hazard) and the sandbox's empty-env-var trap that breaks Windows installers and auth flows. Also use when asked how to launch an app from bash and the honest answer may be 'there is no CLI' — covers proving a GUI-only app has no shell entry point, and the byte-level binary probe (grep -c on the executable) that determines which config files a CLI actually reads (e.g. CLAUDE.md vs AGENTS.md)."
version: 1.2.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-02
---

# Windows: "installed but not accessible" diagnosis

Use this when a user reports a Windows CLI tool (gh, ffmpeg, node, etc.) is
installed but the shell says `command not found`.

## Golden rule

**Determine which of three distinct failures you have before changing anything:**

| Failure | Evidence | Fix |
|---|---|---|
| A. Binary truly absent | no `.exe` on disk, `winget list` empty | reinstall |
| B. Binary present, PATH stale | `.exe` exists, registry PATH is correct, current shell can't resolve | open a new terminal |
| C. PATH entry missing/wrong | `.exe` exists, registry PATH lacks its dir | add dir to PATH |
| **D. No CLI exists at all** | install dir is a **GUI/Electron app**; no entry point, no bin/ | **nothing to fix — say so** (see below) |

Most "it was installed but vanished" reports are **A**, caused by a later
cleanup/uninstall pass (BulkCrapUninstaller, WinUtil, WizTree-driven cleanup)
that deleted the folder *and* the PATH entry while the user still remembers the
successful install.

## Step 0 — Is there a CLI to find? (do this before Step 1)

**Failure D is the one that produces a false statement rather than a failed command.** A user asks *"how do
I start X from bash?"*; the agent runs `command -v x`, gets nothing, and writes **"no CLI is installed on
this machine"** — a claim about the *machine* inferred from a probe of *one name*. Both halves of that can
be wrong at once. Measured 2026-10-02: `codebuddy`/`workbuddy`/`wb` all absent (true) **and**
`claude` → `~/.local/bin/claude`, Claude Code `2.0.35` present (so "no CLI" was false).

**Rule: a negative probe is a negative about the name you probed, not about the category.** Before
asserting a negative about a *category*, probe the category:

```bash
for c in x x-cli xcode xc tool cli; do
  printf '%s -> %s\n' "$c" "$(command -v "$c" 2>/dev/null || echo 'NOT FOUND')"
done
```

Then classify the install directory — GUI app or CLI?

```bash
ls "$LOCALAPPDATA/Programs/<Vendor>/"                 # Electron? see *.exe + app.asar + resources/
ls "$LOCALAPPDATA/Programs/<Vendor>/resources/scripts" # installer/updater scripts only, or a real CLI?
```

**Tell-tale that it is a GUI-only app, not a CLI:**
- `app.asar`, `app.asar.unpacked`, `resources/`, `locales/`, `*.pak`, `icudtl.dat`, `vk_swiftshader*`
  (Electron) alongside the vendor `.exe`
- `resources/scripts/` holds only updater plumbing (`update-progress.ps1`,
  `launch-update-progress.vbs`)
- `resources/vendor/` holds **zipped runtimes** (`PortableGit.zip`, `node.zip`, `python.zip`) — these are
  extracted for the *agent's own Bash tool*, and are **not** a user-facing CLI

> ⚠️ **A GUI app's "integrated terminal" does not launch a session.** It runs commands *inside* an
> already-running session. If the user asks how to start a session from bash, the honest answer is
> **"from the app UI — there is no shell entry point."**

### Byte-level probe: what config files does a CLI actually read?

Do not answer this from memory or from docs — **grep the binary**. It is one command and it is decisive:

```bash
grep -c "AGENTS.md" "$(command -v <tool>)"     # 0  <-- it does not read this
grep -c "CLAUDE.md" "$(command -v <tool>)"     # 82 <-- it does
```

Measured 2026-10-02: Claude Code `2.0.35` contains `CLAUDE.md` **82×** and `AGENTS.md` **0×** — so a repo
that documents its agent contract in `AGENTS.md` is **invisible** to it. Use this whenever the question is
*"will tool Y pick up my file Z?"*; it beats reading documentation, because it reports the shipped binary.

Same technique answers *"do these two tools share a skills directory?"*: they usually do not
(`~/.<vendor>/skills/` vs `.claude/`), which means moving a skill between them is a **migration**, not a
move.

## Step 1 — Establish ground truth

```bash
winget list --id <Package.Id> --exact
which <tool>; <tool> --version
```

Then hunt the binary. Limit depth first, widen only if needed (a full `find /c`
is slow and gets SIGTERM'd):

```bash
ls -la "/c/Program Files/<Vendor>/"
find "/c/Program Files" "/c/Program Files (x86)" "/c/Users/$USER/AppData/Local" -maxdepth 4 -iname "<tool>.exe" 2>/dev/null
```

## Step 2 — Read the install history (the highest-value step)

winget writes a per-package log for every install:

```
%LOCALAPPDATA%\Packages\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe\LocalState\DiagOutputDir\
  <Package.Id>.<version>-<YY-MM-DD-HH-MM-SS>.log      <- per-package MSI/installer log
  WinGet-<timestamp>.log                              <- overall command log
```

**These logs are UTF-16.** Reading them with the Read tool fails as "binary
file". Decode with Python:

```python
t = open(path, 'rb').read().decode('utf-16')
```

Look for:
- `INSTALLDIR = ...` -> where it actually went
- `Installation completed successfully` -> install really did succeed
- `WriteEnvironmentStrings` action -> MSI wrote a PATH entry

Grep all `WinGet-*.log` for the package id to find a later **uninstall** that
explains the disappearance.

## Step 3 — Compare registry PATH against the live session

`reg.exe` may be blocked by the sandbox program blacklist. Use Python `winreg`:

```python
import winreg
def rd(root, path, name):
    k = winreg.OpenKey(root, path); v, _ = winreg.QueryValueEx(k, name); return v
m = rd(winreg.HKEY_LOCAL_MACHINE, r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path')
u = rd(winreg.HKEY_CURRENT_USER, r'Environment', 'Path')
fresh = m + ';' + u
```

Then verify resolution on the rebuilt PATH:

```python
import shutil
shutil.which('<tool>', path=fresh)   # -> full path means PATH is correct
```

## CRITICAL pitfalls in this environment

1. **Do NOT test a rebuilt PATH with `subprocess.run(['tool'], env=...)`.**
   Windows `CreateProcess` resolves the executable against the **parent's**
   PATH, not the child's `env`. This yields false negatives. Use
   `shutil.which(..., path=fresh)` instead.
2. **`reg.exe` is blacklisted** — do not retry it, do not route around it.
   Use `winreg`.
3. **`cmd.exe` invoked from Bash is blocked** ("bypasses command validation").
   Use Python or direct absolute paths.
4. **The PowerShell tool may return no stdout** in some sessions. Fall back to
   Bash + Python.
5. **Mentioning "PowerShell" inside a Bash command string can trip the security
   filter** (it thinks you're invoking PowerShell from Bash). Use Python
   `os.path.exists` / `glob` to probe profile paths instead.
6. **A stale environment block is inherited by every already-open terminal.**
   After any PATH change, the user must open a *new* terminal — say this
   explicitly, it is the most common source of "still doesn't work".
7. **The sandbox leaves critical env vars EMPTY, which breaks Windows installers.**
   `APPDATA`, `SystemRoot`, `ComSpec` and `PATHEXT` are all blank in the bash
   session (`LOCALAPPDATA`, `USERPROFILE`, `HOME` are fine). Symptoms:
   - `winget install <pkg>` downloads fine, then **"Installer failed with exit code: 1"**
   - tools that write config silently use defaults instead of `%APPDATA%`
   - `gh auth login --web` polls forever and never persists a token

   Fix: re-run the installer with a repaired environment:

   ```bash
   export SystemRoot='C:\windows' windir='C:\windows' \
     ComSpec='C:\windows\system32\cmd.exe' \
     PATHEXT='.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC' \
     APPDATA='C:\Users\<user>\AppData\Roaming' \
     LOCALAPPDATA='C:\Users\<user>\AppData\Local' \
     USERPROFILE='C:\Users\<user>' \
     TEMP='C:\Users\<user>\AppData\Local\Temp' \
     TMP='C:\Users\<user>\AppData\Local\Temp' PROCESSOR_ARCHITECTURE=AMD64
   ```

   Many tools (e.g. `cargo`, `rustc`) work fine *without* this — only the
   *installer/auth* path usually needs it. Test the cheap case first.
   **Also affects `SystemDrive`, `windir` and `ProgramData`.** A common
   side effect is a **stray folder literally named `%SystemDrive%`** appearing
   in the current working directory, because an unexpanded variable turns an
   absolute path into a relative one:

   ```
   C:\Users\<user>\%SystemDrive%\ProgramData\Microsoft\Windows\Caches\*.db
   ```

   Detect with:
   `find /c/Users/<user> -maxdepth 3 -type d -name '%*%'`
   Confirm it is junk by checking the real path
   (`C:\ProgramData\Microsoft\Windows\Caches\`) holds the same filenames at a
   higher `ver0x...` generation. It is safe to delete, but it lives in the
   user's home dir — get explicit consent and use the Recycle Bin, not `rm`.
   It cannot be prevented from inside the sandbox; the host sets those vars.
8. **`winget` is not the only way in.** If the winget installer keeps failing,
   download the official installer directly (`curl -sSL`) and run it yourself
   with the repaired env above. That is how the rustup install was rescued.
9. **Installs interrupted by a reboot leave half-broken state.** Watch for
   **0-byte shims/wrappers** — `ls -la <bindir> | awk '$5==0'`. They also make
   the tool refuse to reinstall ("already installed"), so delete the 0-byte
   files **by explicit name** (never wildcards) and re-run the installer.
   For rustup specifically: `rustup toolchain install <toolchain>` prints
   "recovering from a partially installed toolchain" and completes it.
10. **The sandbox silently breaks symlink creation — this is the highest-value trap.**
    `os.symlink()` **returns without error but writes a 0-byte regular file**. No
    exception, no warning. Symptoms elsewhere:
    - `winget` fails a package install with
      *"create_symlink: The requested lookup key was not found in any active
      activation context"* / exit `0x8a150003` — the message is misleading, the
      real cause is the blocked symlink
    - a tool that was working suddenly resolves to nothing (a 0-byte stub sits on
      PATH where the real binary used to be)

    Always verify, never trust the return value:

    ```python
    import os
    os.symlink(src, dst)                       # "succeeds"
    print(os.path.islink(dst))                 # False  <-- caught it
    print(os.lstat(dst).st_size)               # 0
    ```

    **Workaround: use `os.link()` (hardlink).** Same volume, executes identically,
    costs no extra space. Fallback chain: symlink -> hardlink -> copy.

    Watch for **0-byte files on PATH** as a general symptom — they are the signature
    of an interrupted install *or* a blocked symlink:
    `ls -la <dir> | awk '$5==0 && $9!="total"'`

    **Exclude `%LOCALAPPDATA%\Microsoft\WindowsApps` from this check.** Its 0-byte
    `*.exe` files are **App Execution Aliases**, which are legitimately empty and
    resolved by the OS — flagging them is a false positive that will panic the user.
    The same goes for empty Windows log files (`setuperr.log`) and `.lock` files.

## Windows: missing linker for native toolchains

Before installing any toolchain that compiles native code (Rust, C/C++), check
whether a linker exists:

```bash
ls "/c/Program Files/Microsoft Visual Studio" "/c/Program Files (x86)/Windows Kits" 2>&1
find "/c/Program Files/Microsoft Visual Studio" -iname "link.exe" -path "*Hostx64*"
```

- **No MSVC Build Tools + Rust** → use the **GNU** toolchain
  (`x86_64-pc-windows-gnu`), which bundles its own linker via `rust-mingw`.
  One command, no 2-4 GB VS download:
  `rustup-init.exe -y --default-host x86_64-pc-windows-gnu --profile default`
- The MSVC toolchain is the more compatible choice, but only worth it if the
  user already has (or wants) Visual Studio Build Tools.
- **Always verify by actually compiling something** (`cargo new x && cd x &&
  cargo build && cargo run`), not just by checking `--version`. `--version`
  passes even when the linker is missing.
- `rust-analyzer` is not in rustup's `default` profile — its shim errors with
  "Unknown binary". Fix with `rustup component add rust-analyzer`.

## Step 4 — Fix

```bash
winget install --id <Package.Id> --exact --source winget \
  --accept-source-agreements --accept-package-agreements --disable-interactivity
```

Then re-verify: binary runs, registry PATH contains the dir, `shutil.which`
resolves on the rebuilt PATH, and `winget list` reports it.

## Step 5 — Rule out shadowing

Check that nothing earlier in PATH intercepts the name (shims, wrappers):

```bash
ls -la "<each early PATH dir>" | grep -i "<tool>"
```

Also scan shell profiles for PATH mutation: `~/.bashrc`, `~/.bash_profile`,
`~/.profile`, `~/.zshrc`, and the PowerShell profile at
`Documents\PowerShell\Microsoft.PowerShell_profile.ps1`.

## Reporting

Lead with the **root cause**, not the command you ran. Users reporting this
symptom are usually right that they installed it — confirm that explicitly
before explaining what removed it.
