#!/usr/bin/env python3
"""Validate the KB's internal links and anchors.

A knowledge base whose links rot is worse than no knowledge base, because the
reader trusts a link that goes nowhere. This is the guard for that.

Checks, in order of severity:

  MISSING  a relative link target does not exist on disk        -> failure
  ANCHOR   a link target exists but the #anchor does not        -> failure
  EXTERNAL http(s) links are reported but never fetched          -> info

Only relative links are checked. Absolute URLs are not fetched: a link checker
that needs the network is a link checker that gets disabled.

Usage:
    python check-links.py [--root <repo-root>]

Exit code: 0 if clean, 1 if any MISSING or ANCHOR problem was found.
"""

from __future__ import annotations

import pathlib
import re
import sys

LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
HEADING = re.compile(r"^(#{1,6})\s+(.*)$")
EXPLICIT_ANCHOR = re.compile(r"<a\s+(?:id|name)=\"([^\"]+)\"", re.IGNORECASE)

# Directories that are not part of the KB.
SKIP_DIRS = {".git", "node_modules", ".next", ".vercel", ".workbuddy-ai"}


def slugify(text: str) -> str:
    """Approximate GitHub's heading-anchor slug."""
    text = re.sub(r"`([^`]*)`", r"\1", text)          # inline code
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links -> text
    text = re.sub(r"[*_]{1,3}", "", text)              # emphasis
    text = text.strip().lower()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    return re.sub(r"\s+", "-", text).strip("-")


def normalize(anchor: str) -> str:
    """Loose comparison key: keep only alphanumerics and hyphens.

    Emoji and punctuation survive GitHub's slugger inconsistently, so a strict
    comparison produces false failures. This keeps the check useful.
    """
    anchor = anchor.strip().lower()
    anchor = re.sub(r"[^a-z0-9-]", "", anchor)
    return re.sub(r"-+", "-", anchor).strip("-")


def anchors_of(path: pathlib.Path) -> set[str]:
    found: set[str] = set()
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return found
    for raw in text.splitlines():
        m = HEADING.match(raw)
        if m:
            found.add(normalize(slugify(m.group(2))))
        for explicit in EXPLICIT_ANCHOR.findall(raw):
            found.add(normalize(explicit))
    return found


def markdown_files(root: pathlib.Path) -> list[pathlib.Path]:
    out = []
    for path in root.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        out.append(path)
    return sorted(out)


def main() -> int:
    argv = sys.argv[1:]
    if "--root" in argv:
        root = pathlib.Path(argv[argv.index("--root") + 1]).resolve()
    else:
        root = pathlib.Path(__file__).resolve().parents[3]

    targets = markdown_files(root)
    if not targets:
        print(f"no markdown found under {root}", file=sys.stderr)
        return 1

    anchor_cache: dict[pathlib.Path, set[str]] = {}
    missing: list[tuple[pathlib.Path, str]] = []
    bad_anchor: list[tuple[pathlib.Path, str]] = []
    external: set[str] = set()
    checked = 0

    for path in targets:
        text = path.read_text(encoding="utf-8")
        for raw_target in LINK.findall(text):
            if raw_target.startswith(("http://", "https://", "mailto:")):
                external.add(raw_target)
                continue
            if raw_target.startswith("#"):
                target_file = path
                anchor = raw_target[1:]
            else:
                file_part, _, anchor = raw_target.partition("#")
                if not file_part:
                    continue
                target_file = (path.parent / file_part).resolve()
                if not target_file.exists():
                    missing.append((path, raw_target))
                    continue
                if target_file.is_dir():
                    continue
            checked += 1
            if not anchor:
                continue
            if target_file.suffix.lower() != ".md":
                continue
            if target_file not in anchor_cache:
                anchor_cache[target_file] = anchors_of(target_file)
            if normalize(anchor) not in anchor_cache[target_file]:
                bad_anchor.append((path, raw_target))

    def rel(p: pathlib.Path) -> str:
        try:
            return str(p.relative_to(root))
        except ValueError:
            return str(p)

    if missing:
        print("MISSING link targets:")
        for src, target in missing:
            print(f"  {rel(src)}  ->  {target}")
    if bad_anchor:
        print("ANCHOR not found in target:")
        for src, target in bad_anchor:
            print(f"  {rel(src)}  ->  {target}")

    print(
        f"\n{len(targets)} file(s), {checked} relative link(s) resolved, "
        f"{len(external)} external link(s) not fetched."
    )
    if missing or bad_anchor:
        print(f"FAILED: {len(missing)} missing, {len(bad_anchor)} bad anchor(s).")
        return 1
    print("OK: every relative link and anchor resolves.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
