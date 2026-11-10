#!/usr/bin/env python3
"""2026-11-03: emit /player/<Name>/index.html for every name in players.json.

Simplest static approach: one shared player.html that reads the name from the
path (or ?name=). This script copies that file into each player folder so
Cloudflare Workers static assets can serve /player/DirtHog/ without a Worker
script. Re-run after regenerating players.json.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
# 2026-11-08: leading '.' is a Geyser/floodgate Bedrock name, not a path escape.
SAFE = re.compile(r"^\.?[A-Za-z0-9_]{1,16}$")


def main() -> None:
    template = (PUBLIC / "player.html").read_text(encoding="utf-8")
    data = json.loads((PUBLIC / "data" / "players.json").read_text(encoding="utf-8"))
    names = []
    for p in data.get("players", []):
        name = p.get("name", "")
        if not SAFE.match(name):
            raise SystemExit(f"unsafe player name {name!r} — Minecraft names are [A-Za-z0-9_]{{1,16}}")
        dest = PUBLIC / "player" / name / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        page = template.replace(
            "<title>Player · NO RULES SURVIVAL</title>",
            f"<title>{name} · NO RULES SURVIVAL</title>",
        ).replace(
            '<h1 id="profile-title">Player</h1>',
            f'<h1 id="profile-title">{name}</h1>',
        )
        dest.write_text(page, encoding="utf-8")
        names.append(name)

    index = PUBLIC / "player" / "index.html"
    index.write_text(
        """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/players.html">
<link rel="canonical" href="/players.html">
<title>Players</title>
</head><body><p><a href="/players.html">Player list</a></p></body></html>
""",
        encoding="utf-8",
    )
    print(f"wrote {len(names)} player pages")


if __name__ == "__main__":
    main()
