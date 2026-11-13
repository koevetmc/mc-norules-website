#!/usr/bin/env python3
"""Pull vanilla stats + Server Firsts into public/data.

2026-11-08: real players only (no sample rows). Reads a dump of
world/players/stats, usercache.json, and ServerFirst firsts-*.yml.
Does not include coordinates or vote counts. KoevetMC stays on
profiles/rankings and is omitted from legends.json to match the
in-game Hall exclude list.

Usage:
  python3 scripts/ingest_stats.py /tmp/norules-stats
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "data"
LEGEND_EXCLUDE = {"koevetmc"}

# Hall of Legends 24 cats — same keys/titles/formats as LegendsPlugin.
LEGEND_ORDER = [
    "kills", "deaths", "damage", "mobs", "crystals", "totems",
    "playtime", "life", "distance", "pearls", "mined", "placed",
    "jump", "fish", "trade", "elytra", "diamonds", "debris",
    "gapple", "chests", "breed", "bosses", "raids", "climb",
]

# Extra vanilla custom stats we actually saw in the live dump, plus sums.
# format: count | km | hours | hearts | life | ticks
CATALOG = [
    {"id": "kills", "title": "Player kills", "group": "combat", "format": "count", "unit": "kills", "legend": True},
    {"id": "deaths", "title": "Deaths", "group": "combat", "format": "count", "unit": "deaths", "legend": True},
    {"id": "damage", "title": "Damage dealt", "group": "combat", "format": "hearts", "unit": "hearts", "legend": True},
    {"id": "damage_taken", "title": "Damage taken", "group": "combat", "format": "hearts", "unit": "hearts"},
    {"id": "damage_blocked", "title": "Damage blocked (shield)", "group": "combat", "format": "hearts", "unit": "hearts"},
    {"id": "damage_absorbed", "title": "Damage absorbed", "group": "combat", "format": "hearts", "unit": "hearts"},
    {"id": "mobs", "title": "Mobs killed", "group": "combat", "format": "count", "unit": "mobs", "legend": True},
    {"id": "killed", "title": "Entities killed", "group": "combat", "format": "count", "unit": "kills"},
    {"id": "bosses", "title": "Bosses slain", "group": "combat", "format": "count", "unit": "bosses", "legend": True},
    {"id": "crystals", "title": "End crystals placed", "group": "combat", "format": "count", "unit": "crystals", "legend": True},
    {"id": "totems", "title": "Totems popped", "group": "combat", "format": "count", "unit": "totems", "legend": True},
    {"id": "pearls", "title": "Ender pearls thrown", "group": "combat", "format": "count", "unit": "pearls", "legend": True},
    {"id": "playtime", "title": "Play time", "group": "survival", "format": "hours", "unit": "hours", "legend": True},
    {"id": "world_time", "title": "Time in world", "group": "survival", "format": "hours", "unit": "hours"},
    {"id": "life", "title": "Time since death", "group": "survival", "format": "life", "unit": "", "legend": True},
    {"id": "time_since_rest", "title": "Time since rest", "group": "survival", "format": "life", "unit": ""},
    {"id": "leave_game", "title": "Sessions (leave game)", "group": "survival", "format": "count", "unit": "leaves"},
    {"id": "sleep_in_bed", "title": "Slept in a bed", "group": "survival", "format": "count", "unit": "nights"},
    {"id": "jump", "title": "Jumps", "group": "movement", "format": "count", "unit": "jumps", "legend": True},
    {"id": "sneak_time", "title": "Sneak time", "group": "movement", "format": "ticks", "unit": "ticks"},
    {"id": "distance", "title": "Distance traveled", "group": "movement", "format": "km", "unit": "km", "legend": True},
    {"id": "walk", "title": "Walked", "group": "movement", "format": "km", "unit": "km"},
    {"id": "sprint", "title": "Sprinted", "group": "movement", "format": "km", "unit": "km"},
    {"id": "crouch", "title": "Crouched", "group": "movement", "format": "km", "unit": "km"},
    {"id": "fly", "title": "Flown (creative/fall)", "group": "movement", "format": "km", "unit": "km"},
    {"id": "fall", "title": "Fallen", "group": "movement", "format": "km", "unit": "km"},
    {"id": "swim", "title": "Swum", "group": "movement", "format": "km", "unit": "km"},
    {"id": "walk_water", "title": "Walked on water", "group": "movement", "format": "km", "unit": "km"},
    {"id": "walk_underwater", "title": "Walked underwater", "group": "movement", "format": "km", "unit": "km"},
    {"id": "climb", "title": "Climbed", "group": "movement", "format": "km", "unit": "km", "legend": True},
    {"id": "elytra", "title": "Elytra flown", "group": "movement", "format": "km", "unit": "km", "legend": True},
    {"id": "boat", "title": "Boated", "group": "movement", "format": "km", "unit": "km"},
    {"id": "horse", "title": "Rode a horse", "group": "movement", "format": "km", "unit": "km"},
    {"id": "minecart", "title": "Minecart", "group": "movement", "format": "km", "unit": "km"},
    {"id": "strider", "title": "Rode a strider", "group": "movement", "format": "km", "unit": "km"},
    {"id": "mined", "title": "Blocks mined", "group": "gather", "format": "count", "unit": "blocks", "legend": True},
    {"id": "placed", "title": "Blocks placed", "group": "gather", "format": "count", "unit": "blocks", "legend": True},
    {"id": "diamonds", "title": "Diamond ore mined", "group": "gather", "format": "count", "unit": "ores", "legend": True},
    {"id": "debris", "title": "Ancient debris mined", "group": "gather", "format": "count", "unit": "debris", "legend": True},
    {"id": "crafted", "title": "Items crafted", "group": "gather", "format": "count", "unit": "items"},
    {"id": "picked_up", "title": "Items picked up", "group": "gather", "format": "count", "unit": "items"},
    {"id": "dropped", "title": "Items dropped (stats)", "group": "gather", "format": "count", "unit": "items"},
    {"id": "broken", "title": "Tools broken", "group": "gather", "format": "count", "unit": "tools"},
    {"id": "drop", "title": "Drop key presses", "group": "gather", "format": "count", "unit": "drops"},
    {"id": "chests", "title": "Chests opened", "group": "gather", "format": "count", "unit": "chests", "legend": True},
    {"id": "barrels", "title": "Barrels opened", "group": "gather", "format": "count", "unit": "barrels"},
    {"id": "enderchests", "title": "Ender chests opened", "group": "gather", "format": "count", "unit": "chests"},
    {"id": "shulkers", "title": "Shulker boxes opened", "group": "gather", "format": "count", "unit": "boxes"},
    {"id": "gapple", "title": "Golden apples eaten", "group": "gather", "format": "count", "unit": "eaten", "legend": True},
    {"id": "fish", "title": "Fish caught", "group": "gather", "format": "count", "unit": "fish", "legend": True},
    {"id": "breed", "title": "Animals bred", "group": "gather", "format": "count", "unit": "bred", "legend": True},
    {"id": "trade", "title": "Villager trades", "group": "gather", "format": "count", "unit": "trades", "legend": True},
    {"id": "talked_villager", "title": "Talked to villagers", "group": "gather", "format": "count", "unit": "talks"},
    {"id": "enchant", "title": "Items enchanted", "group": "gather", "format": "count", "unit": "enchants"},
    {"id": "bell", "title": "Bells rung", "group": "gather", "format": "count", "unit": "rings"},
    {"id": "raids", "title": "Raids won", "group": "gather", "format": "count", "unit": "raids", "legend": True},
    {"id": "raid_trigger", "title": "Raids triggered", "group": "gather", "format": "count", "unit": "raids"},
    {"id": "craft_table", "title": "Crafting table uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "furnace", "title": "Furnace uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "anvil", "title": "Anvil uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "smithing", "title": "Smithing table uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "brewing", "title": "Brewing stand uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "stonecutter", "title": "Stonecutter uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "grindstone", "title": "Grindstone uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "loom", "title": "Loom uses", "group": "gather", "format": "count", "unit": "uses"},
    {"id": "hopper_inspect", "title": "Hoppers inspected", "group": "gather", "format": "count", "unit": "inspects"},
    {"id": "dispenser_inspect", "title": "Dispensers inspected", "group": "gather", "format": "count", "unit": "inspects"},
    {"id": "pot_flower", "title": "Flowers potted", "group": "gather", "format": "count", "unit": "pots"},
]

LEGEND_META = {c["id"]: c for c in CATALOG if c.get("legend")}
LEGEND_TITLES = {
    "kills": "TOP KILLER", "deaths": "MOST DEATHS", "damage": "MOST DAMAGE DEALT",
    "mobs": "MOB SLAYER", "crystals": "CRYSTAL PVPER", "totems": "TOTEMS POPPED",
    "playtime": "MOST PLAYTIME", "life": "LONGEST ALIVE", "distance": "FARTHEST TRAVELED",
    "pearls": "PEARL SPAMMER", "mined": "MOST BLOCKS MINED", "placed": "MOST BLOCKS PLACED",
    "jump": "BUNNY HOPPER", "fish": "ANGLER", "trade": "VILLAGER TRADER",
    "elytra": "ELYTRA PILOT", "diamonds": "DIAMOND MINER", "debris": "ANCIENT DEBRIS",
    "gapple": "GOLDEN APPLES", "chests": "CHEST LOOTER", "breed": "ANIMAL BREEDER",
    "bosses": "BOSS SLAYER", "raids": "RAID WINNER", "climb": "CLIMBER",
}

FIRST_TITLES = {
    "diamond": "FIRST DIAMOND", "pvp": "FIRST BLOOD", "nether": "FIRST TO THE NETHER",
    "end": "FIRST TO THE END", "debris": "FIRST ANCIENT DEBRIS", "dragon": "DRAGON SLAYER",
    "netherite": "FIRST FULL NETHERITE", "elytra": "FIRST WINGS", "wither": "WITHER SLAYER",
    "totem": "FIRST TOTEM POP", "beacon": "FIRST BEACON", "warden": "WARDEN SLAYER",
    "death": "FIRST DEATH", "egg": "FIRST DRAGON EGG", "city": "FIRST END CITY",
    "raid": "FIRST RAID WON", "enchant": "FIRST ENCHANT",
}

NS = "minecraft:"


def g(stats: dict, cat: str, key: str) -> int:
    m = stats.get(NS + cat) or {}
    return int(m.get(NS + key, 0) or 0)


def sum_cat(stats: dict, cat: str) -> int:
    m = stats.get(NS + cat) or {}
    return int(sum(int(v or 0) for v in m.values()))


def cm(stats: dict, key: str) -> int:
    return g(stats, "custom", key)


def distance_cm(stats: dict) -> int:
    m = stats.get(NS + "custom") or {}
    return int(sum(int(v or 0) for k, v in m.items() if k.endswith("_one_cm")))


def placed_blocks(stats: dict, block_keys: set[str]) -> int:
    used = stats.get(NS + "used") or {}
    return int(sum(int(v or 0) for k, v in used.items() if k in block_keys))


def extract(stats: dict, block_keys: set[str]) -> dict:
    return {
        "kills": cm(stats, "player_kills"),
        "deaths": cm(stats, "deaths"),
        "damage": cm(stats, "damage_dealt"),
        "damage_taken": cm(stats, "damage_taken"),
        "damage_blocked": cm(stats, "damage_blocked_by_shield"),
        "damage_absorbed": cm(stats, "damage_absorbed"),
        "mobs": cm(stats, "mob_kills"),
        "killed": sum_cat(stats, "killed"),
        "bosses": g(stats, "killed", "wither") + g(stats, "killed", "ender_dragon")
        + g(stats, "killed", "elder_guardian") + g(stats, "killed", "warden"),
        "crystals": g(stats, "used", "end_crystal"),
        "totems": g(stats, "used", "totem_of_undying"),
        "pearls": g(stats, "used", "ender_pearl"),
        "playtime": cm(stats, "play_time"),
        "world_time": cm(stats, "total_world_time"),
        "life": cm(stats, "time_since_death"),
        "time_since_rest": cm(stats, "time_since_rest"),
        "leave_game": cm(stats, "leave_game"),
        "sleep_in_bed": cm(stats, "sleep_in_bed") + cm(stats, "sleep_in_straw_bed"),
        "jump": cm(stats, "jump"),
        "sneak_time": cm(stats, "sneak_time"),
        "distance": distance_cm(stats),
        "walk": cm(stats, "walk_one_cm"),
        "sprint": cm(stats, "sprint_one_cm"),
        "crouch": cm(stats, "crouch_one_cm"),
        "fly": cm(stats, "fly_one_cm"),
        "fall": cm(stats, "fall_one_cm"),
        "swim": cm(stats, "swim_one_cm"),
        "walk_water": cm(stats, "walk_on_water_one_cm"),
        "walk_underwater": cm(stats, "walk_under_water_one_cm"),
        "climb": cm(stats, "climb_one_cm"),
        "elytra": cm(stats, "aviate_one_cm"),
        "boat": cm(stats, "boat_one_cm"),
        "horse": cm(stats, "horse_one_cm"),
        "minecart": cm(stats, "minecart_one_cm"),
        "strider": cm(stats, "strider_one_cm"),
        "mined": sum_cat(stats, "mined"),
        "placed": placed_blocks(stats, block_keys),
        "diamonds": g(stats, "mined", "diamond_ore") + g(stats, "mined", "deepslate_diamond_ore"),
        "debris": g(stats, "mined", "ancient_debris"),
        "crafted": sum_cat(stats, "crafted"),
        "picked_up": sum_cat(stats, "picked_up"),
        "dropped": sum_cat(stats, "dropped"),
        "broken": sum_cat(stats, "broken"),
        "drop": cm(stats, "drop"),
        "chests": cm(stats, "open_chest"),
        "barrels": cm(stats, "open_barrel"),
        "enderchests": cm(stats, "open_enderchest"),
        "shulkers": cm(stats, "open_shulker_box"),
        "gapple": g(stats, "used", "golden_apple") + g(stats, "used", "enchanted_golden_apple"),
        "fish": cm(stats, "fish_caught"),
        "breed": cm(stats, "animals_bred"),
        "trade": cm(stats, "traded_with_villager"),
        "talked_villager": cm(stats, "talked_to_villager"),
        "enchant": cm(stats, "enchant_item"),
        "bell": cm(stats, "bell_ring"),
        "raids": cm(stats, "raid_win"),
        "raid_trigger": cm(stats, "raid_trigger"),
        "craft_table": cm(stats, "interact_with_crafting_table"),
        "furnace": cm(stats, "interact_with_furnace"),
        "anvil": cm(stats, "interact_with_anvil"),
        "smithing": cm(stats, "interact_with_smithing_table"),
        "brewing": cm(stats, "interact_with_brewingstand"),
        "stonecutter": cm(stats, "interact_with_stonecutter"),
        "grindstone": cm(stats, "interact_with_grindstone"),
        "loom": cm(stats, "interact_with_loom"),
        "hopper_inspect": cm(stats, "inspect_hopper"),
        "dispenser_inspect": cm(stats, "inspect_dispenser"),
        "pot_flower": cm(stats, "pot_flower"),
    }


def top_map(section: dict, n: int = 8) -> list[dict]:
    rows = []
    for k, v in section.items():
        name = k.split(":", 1)[-1]
        try:
            val = int(v or 0)
        except (TypeError, ValueError):
            continue
        if val > 0:
            rows.append({"id": name, "value": val})
    rows.sort(key=lambda r: -r["value"])
    return rows[:n]


def parse_firsts_yml(text: str) -> list[dict]:
    """Tiny YAML subset parser for ServerFirst claims files."""
    claims: dict[str, dict] = {}
    current = None
    in_claims = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if line == "claims:":
            in_claims = True
            continue
        if not in_claims:
            continue
        m = re.match(r"^  ([a-z0-9_]+):\s*$", line)
        if m:
            current = m.group(1)
            claims[current] = {}
            continue
        m = re.match(r"^    ([a-z]+):\s*(.*)$", line)
        if m and current:
            key, val = m.group(1), m.group(2).strip().strip("'\"")
            claims[current][key] = val
    out = []
    for key, c in claims.items():
        uuid = c.get("uuid", "")
        name = c.get("name", "")
        when = c.get("when", "")
        try:
            time_ms = int(c.get("time") or 0)
        except ValueError:
            time_ms = 0
        out.append({
            "key": key,
            "title": FIRST_TITLES.get(key, key.replace("_", " ").upper()),
            "name": name,
            "uuid": uuid,
            "when": when,
            "time": time_ms,
            "detail": c.get("detail", ""),
        })
    out.sort(key=lambda r: r["time"] or 0)
    return out


def main() -> None:
    import sys
    dump = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/norules-stats")
    stats_dir = dump / "world" / "players" / "stats"
    cache_path = dump / "usercache.json"
    if not stats_dir.is_dir():
        raise SystemExit(f"no stats dir at {stats_dir}")
    cache = json.loads(cache_path.read_text(encoding="utf-8"))
    by_uuid = {x["uuid"]: x["name"] for x in cache}

    files = list(stats_dir.glob("*.json"))
    all_stats = []
    block_keys: set[str] = set()
    for f in files:
        raw = json.loads(f.read_text(encoding="utf-8"))
        st = raw.get("stats") or {}
        mined = st.get(NS + "mined") or {}
        block_keys.update(mined.keys())
        all_stats.append((f, st))

    players = []
    for f, st in all_stats:
        uuid = f.stem
        name = by_uuid.get(uuid)
        if not name:
            continue
        stats = extract(st, block_keys)
        mined = st.get(NS + "mined") or {}
        killed = st.get(NS + "killed") or {}
        players.append({
            "name": name,
            "uuid": uuid,
            "bedrock": name.startswith("."),
            "stats": stats,
            "topMined": top_map(mined),
            "topKilled": top_map(killed),
        })
    players.sort(key=lambda p: (-p["stats"]["playtime"], p["name"].lower()))

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    players_doc = {
        "updated": now,
        "sample": False,
        "comment": "Real vanilla stats from world/players/stats. No coordinates, no vote fields. Re-run scripts/ingest_stats.py after copying a dump from den.",
        "players": players,
    }
    (PUBLIC / "players.json").write_text(json.dumps(players_doc, indent=2) + "\n", encoding="utf-8")

    catalog = {
        "comment": "Boards for /rankings.html and labels on /player/<Name>/. Raw values live on each player.stats[id].",
        "groups": [
            {"id": "combat", "title": "Combat"},
            {"id": "survival", "title": "Time"},
            {"id": "movement", "title": "Movement"},
            {"id": "gather", "title": "World"},
        ],
        "stats": CATALOG,
    }
    (PUBLIC / "stats-catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")

    categories = {}
    for key in LEGEND_ORDER:
        meta = LEGEND_META[key]
        rows = []
        for p in players:
            if p["name"].lower() in LEGEND_EXCLUDE:
                continue
            val = int(p["stats"].get(key) or 0)
            if val <= 0:
                continue
            rows.append({"name": p["name"], "value": val})
        rows.sort(key=lambda r: -r["value"])
        categories[key] = {
            "title": LEGEND_TITLES[key],
            "unit": meta.get("unit") or "",
            "format": meta["format"],
            "entries": rows[:10],
        }
    legends_doc = {
        "updated": now,
        "sample": False,
        "comment": "Top 10 per Hall of Legends category from live vanilla stats. KoevetMC excluded to match plugins/Legends/config.yml.",
        "order": LEGEND_ORDER,
        "categories": categories,
    }
    (PUBLIC / "legends.json").write_text(json.dumps(legends_doc, indent=2) + "\n", encoding="utf-8")

    firsts_files = list((dump / "plugins" / "ServerFirst").glob("firsts-*.yml"))
    claims = []
    if firsts_files:
        claims = parse_firsts_yml(firsts_files[0].read_text(encoding="utf-8"))
        for c in claims:
            resolved = by_uuid.get(c["uuid"])
            if resolved:
                c["name"] = resolved
    firsts_doc = {
        "updated": now,
        "sample": False,
        "comment": "Server Firsts (/firsts) from plugins/ServerFirst. KoevetMC is excluded in-game so they will not appear here unless the yml already has a claim.",
        "claims": claims,
    }
    (PUBLIC / "firsts.json").write_text(json.dumps(firsts_doc, indent=2) + "\n", encoding="utf-8")

    print(f"wrote {len(players)} players, {len(LEGEND_ORDER)} legend boards, {len(claims)} firsts")


if __name__ == "__main__":
    main()
