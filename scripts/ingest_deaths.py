#!/usr/bin/env python3
"""Build public/data/deaths.json from Paper 'System chat:' log lines.

2026-11-08: real death messages only. Newest first. No coordinates.
Skips joins, leaves, rcon, teleports, GrimAC bans, vote triggers.

Usage:
  python3 scripts/ingest_deaths.py /tmp/norules-system-chat.txt
The dump is FILE <name> then raw log lines (see den: gzip -dc + grep).
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "deaths.json"

NAME = re.compile(r"^(\.?[A-Za-z0-9_]{1,16})\s+(.+)$")
TIME = re.compile(r"^\[(\d{2}):(\d{2}):(\d{2})\]")
FILE_GZ = re.compile(r"^(\d{4}-\d{2}-\d{2})")
CHAT = re.compile(r"System chat: (.+)$")

# Vanilla death-message verbs. Anything else (commands, bans, chunk marks) is dropped.
# Prefix match — death chat continues after the verb ("was slain by Zombie").
DEATH = re.compile(
    r"^(was |fell |hit the ground|tried to swim|burned to death|drowned|"
    r"suffocated|experienced kinetic|starved|withered|went up in flames|"
    r"walked into|discovered the floor|didn't want to live|left the confines|"
    r"froze to death|was struck by lightning|died)",
    re.I,
)


def iso(day: str, h: str, m: str, s: str) -> str:
    return f"{day}T{h}:{m}:{s}Z"


def main() -> None:
    import sys
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/norules-system-chat.txt")
    latest_day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day = latest_day
    items = []
    for raw in src.read_text(encoding="utf-8", errors="replace").splitlines():
        if raw.startswith("FILE "):
            name = raw[5:].strip()
            if name == "latest.log":
                day = latest_day
            else:
                m = FILE_GZ.match(name)
                day = m.group(1) if m else latest_day
            continue
        cm = CHAT.search(raw)
        tm = TIME.match(raw)
        if not cm or not tm:
            continue
        msg = cm.group(1).strip()
        if msg.startswith("[") or msg.startswith("Banned ") or msg.startswith("Unmarked ") or msg.startswith("Set "):
            continue
        if msg.endswith("joined the game") or msg.endswith("left the game"):
            continue
        nm = NAME.match(msg)
        if not nm:
            continue
        player, rest = nm.group(1), nm.group(2)
        if not DEATH.search(rest):
            continue
        # Never copy numeric coordinate blobs if a death line ever grew one.
        if re.search(r"-?\d+\.\d{3,}", rest):
            continue
        items.append({
            "name": player,
            "message": rest,
            "at": iso(day, tm.group(1), tm.group(2), tm.group(3)),
        })

    items.sort(key=lambda x: x["at"], reverse=True)
    # Map reset 2026-10-29 ~22:55 UTC — this world's deaths only.
    items = [x for x in items if x["at"] >= "2026-10-29T23:00:00Z"]
    # Keep a long but finite public feed.
    items = items[:200]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {
        "updated": now,
        "sample": False,
        "comment": "Death messages from Paper logs (System chat). Newest first. No coordinates, no live player list.",
        "items": items,
    }
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(items)} deaths -> {OUT}")


if __name__ == "__main__":
    main()
