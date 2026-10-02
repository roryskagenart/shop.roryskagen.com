#!/usr/bin/env python3
"""Normalize migrated SKILL.md frontmatter to a tool-agnostic shape.

The skills under `docs/agentic/skills/` were migrated out of an agent-specific
runtime. That runtime's frontmatter carries keys other runners ignore
(`agent_created`, `visibility`, `display_name`, `description_zh`, `description_en`).
This rewrites each file's frontmatter to the portable subset plus provenance.

Portable keys kept: `name`, `description`, `version`.
Added: `x-origin`, `x-migrated`.

Idempotent: running it twice produces the same bytes.

Usage:
    python normalize-skill-frontmatter.py [skills_root]
"""

from __future__ import annotations

import pathlib
import re
import sys

MIGRATED = "2026-10-02"
ORIGIN = "workbuddy-ai/skills"
KEEP = ("name", "description", "version")
FIELD = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s?(.*)$")


def unquote(value: str) -> str:
    """Undo one layer of double-quote wrapping, including escapes.

    Without this the render step wraps an already-quoted value a second time
    and the file is no longer idempotent.
    """
    if len(value) >= 2 and value.startswith('"') and value.endswith('"'):
        inner = value[1:-1]
        return inner.replace('\\"', '"').replace("\\\\", "\\")
    return value


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        raise ValueError("no leading frontmatter block")
    end = text.index("\n---", 3)
    raw = text[4:end]
    body = text[end + 4 :].lstrip("\n")
    fields: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = FIELD.match(line)
        if m:
            fields[m.group(1)] = unquote(m.group(2).strip())
    return fields, body


def render(fields: dict[str, str], body: str) -> str:
    lines = ["---"]
    for key in KEEP:
        value = fields.get(key)
        if value is None:
            raise ValueError(f"missing required key {key!r}")
        if key == "description":
            # Descriptions are long and contain colons/commas; keep them quoted
            # and on one line so every YAML parser reads them the same way.
            escaped = value.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'{key}: "{escaped}"')
        else:
            lines.append(f"{key}: {value}")
    lines.append(f"x-origin: {ORIGIN}")
    lines.append(f"x-migrated: {MIGRATED}")
    lines.append("---")
    return "\n".join(lines) + "\n\n" + body.rstrip("\n") + "\n"


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "docs/agentic/skills")
    targets = sorted(root.glob("*/SKILL.md"))
    if not targets:
        print(f"no SKILL.md found under {root}", file=sys.stderr)
        return 1
    for path in targets:
        original = path.read_text(encoding="utf-8")
        fields, body = parse_frontmatter(original)
        updated = render(fields, body)
        if updated == original:
            print(f"unchanged  {path}")
            continue
        path.write_text(updated, encoding="utf-8")
        print(f"normalized {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
