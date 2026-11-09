# NO RULES SURVIVAL — website

Static site for the **NO RULES SURVIVAL** Minecraft anarchy server. Vanilla HTML/CSS/JS, no framework, no database. Built for a **Cloudflare Worker with static assets** (not Pages).

Java IP: `76.176.218.251:25565`  
Bedrock: `76.176.218.251` port `19132`  
Difficulty: Hard. Optional pack: `/pack low|medium|high|off` (v1.2, no join popup). Practice arena at the south spawn gate.

## Deploy (Cloudflare Worker)

```bash
npx wrangler deploy
```

`wrangler.toml` points `[assets].directory` at `./public` and uses `not_found_handling = "404-page"`. There is **no Worker script** — omit `main` / `binding`. After the first deploy, wrangler prints a `*.workers.dev` URL. Paste that origin into `public/js/config.js` (`NR.origin`) if you want absolute Open Graph URLs, then redeploy.

Local preview without wrangler:

```bash
python3 -m http.server 8788 --directory public
```

Then open http://127.0.0.1:8788/

## Player pages

Profiles are static files at `/player/<Name>/`. After you change `public/data/players.json`:

```bash
python3 scripts/build_players.py
```

The shared template is `public/player.html` (`?name=` also works). `scripts/render_pages.py` restamps header/footer on every page if you edit chrome.

Minecraft names only: `[A-Za-z0-9_]{1,16}`.

## JSON schemas (for a later cron)

All files live in `public/data/`. The site reads them client-side. Replace the sample payloads whenever you like — keep the keys.

### `legends.json`

Mirrors `/legends` and the statue hall. **24 categories**, same keys as `plugins/Legends` (`kills` … `climb`). Server Firsts (`/firsts`) are a separate in-game board in the same hall — not extra legends keys. `value` is the **raw vanilla stat** the plugin reads (ticks, centimetres, damage points). The page formats it.

```json
{
  "updated": "2026-11-03T19:00:00Z",
  "sample": false,
  "order": ["kills", "deaths"],
  "categories": {
    "kills": {
      "title": "TOP KILLER",
      "unit": "kills",
      "format": "count",
      "entries": [{ "name": "Player", "value": 142 }]
    }
  }
}
```

`format`: `count` | `km` | `hours` | `hearts` | `life`  
Empty `entries` → **unclaimed — be the first**.

Cron sketch: parse `world/players/stats/*.json` the same way LegendsPlugin does, skip the exclude list (`KoevetMC`), write top 10 per key.

### `players.json`

One object per player who has ever joined. **Never coordinates, never dimension, never live location.**

```json
{
  "updated": "…",
  "players": [{
    "name": "Player",
    "firstSeen": "2026-10-29",
    "lastSeen": "2026-11-03",
    "stats": {
      "kills": 10, "deaths": 4, "playtimeHours": 12.5,
      "distanceKm": 40.0, "mined": 1000, "placed": 200,
      "totems": 1, "crystals": 0
    }
  }]
}
```

### `votetop.json`

Public list-site vote counts. Support only — **not** a loot/reward board.

```json
{ "updated": "…", "entries": [{ "name": "Player", "votes": 40 }] }
```

### `changelog.json`

`tags` is one or more of `PLUGIN`, `SERVER`, `WEBSITE`, `FIX`.

### `deaths.json`

Homepage death strip. Paper `System chat:` death lines from den logs. `{name, message, at}` — **no coordinates**. JSON is newest-first; the homepage paints a compact UTC-day axis (ticks + heads, hover for how they died). Rebuild with `python3 scripts/ingest_deaths.py /tmp/norules-system-chat.txt`. This map only (after 2026-10-29 23:00 UTC).

### `gallery.json` / `clips.json`

Drop media in `/gallery/` or `/clips/`, append `{file, caption, date, author}` or `{file, title, killer, victim, date, poster}`. Clips are **after-the-fact** Flashback exports — not a live kill feed.

## Fairness

This is anarchy. The site must not give a gameplay advantage:

- Live **player count** and up/down from https://api.mcsrvstat.us/3/76.176.218.251 (CORS, no key). If the API is down, the status degrades. The API’s online-name list is **never rendered**.
- No map, no coordinates, no “who is online where”.
- Leaderboards, profiles, and posted clips are fine — they are public in-game. Voting is support only (no loot or in-game advantage).

## Brand

Header logo is `public/img/logo.svg` (inline-injected so ember veins glow on hover). Favicon set: `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`. Social card: `public/img/og-image.jpg`.
