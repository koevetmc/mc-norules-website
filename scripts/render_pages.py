#!/usr/bin/env python3
"""Stamp shared chrome onto every HTML page so header/footer stay in sync.
2026-11-09: full visual redesign — cinematic hall hero, PLAY NOW + IP on
every page, header live count, no Paper / operator jargon in public copy.
Voting stays support-only — no loot, crates, ranks, or in-game advantage."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"

NAV_PRIMARY = [
    ("/", "Home"),
    ("/legends.html", "Legends"),
    ("/rankings.html", "Rankings"),
    ("/players.html", "Players"),
    ("/vote.html", "Vote"),
    ("/gallery.html", "Gallery"),
]
NAV_MORE = [
    ("/join.html", "Join"),
    ("/media.html", "Media"),
    ("/changelog.html", "Log"),
    ("/me.html", "Account"),
]


def head(title: str, desc: str, path: str, extra: str = "") -> str:
    canon = path
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#e85d04">
  <link rel="canonical" href="{canon}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NO RULES SURVIVAL">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="/img/og-image.jpg">
  <meta property="og:url" content="{canon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  {extra}
</head>"""


def _nav_links(pairs) -> str:
    return "\n        ".join(f'<a href="{href}">{label}</a>' for href, label in pairs)


def play_rail() -> str:
    # 2026-11-09: every inner page repeats PLAY NOW + the IP + live count.
    return """
      <aside class="play-rail" aria-label="Join the server">
        <p class="play-rail-kicker">Direct connect</p>
        <p class="ip-display">76.176.218.251</p>
        <button class="btn btn-play" type="button" data-copy-ip>Play now</button>
        <span class="status" data-status data-state="unknown">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-count>— / 30</span>
          <span data-label>checking</span>
        </span>
        <p class="play-rail-note">Java default port. Bedrock 19132. Voting is support only — no loot.</p>
      </aside>"""


def chrome(main: str, scripts: str) -> str:
    primary = _nav_links(NAV_PRIMARY)
    more = _nav_links(NAV_MORE)
    foot_links = _nav_links(NAV_PRIMARY + NAV_MORE)
    return f"""
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="/">
        <span class="logo-slot"><img src="/img/logo.svg" class="logo" width="42" height="42" alt=""></span>
        <span class="brand-text">NO RULES SURVIVAL<small>true anarchy</small></span>
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Primary">
        {primary}
        <div class="nav-more">
          <button type="button" aria-expanded="false" aria-controls="nav-more-list">More</button>
          <div class="nav-more-list" id="nav-more-list">
        {more}
          </div>
        </div>
      </nav>
      <div class="header-cta">
        <span class="status" data-status data-state="unknown">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-count>— / 30</span>
          <span data-label>checking</span>
        </span>
        <button class="btn btn-play" type="button" data-copy-ip>Play now</button>
      </div>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
  </header>
  <main id="main">
{main}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="brand-text">NO RULES SURVIVAL<small>true anarchy</small></p>
        <p class="ip-display ip-display-sm">76.176.218.251</p>
        <p><button class="btn btn-play" type="button" data-copy-ip>Play now</button></p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        {foot_links}
      </nav>
      <div>
        <p>Java or Bedrock. No whitelist. Cheating is the only ban.</p>
        <p><a href="/vote.html">Vote</a> is support only — no loot, crates, keys, ranks, or advantage.</p>
        <p class="fairness-note">This site never shows coordinates, live location, or who is online by name. Leaderboards and clips are public in-game data posted after the fact.</p>
        <p>© <span data-year>2026</span> NO RULES SURVIVAL</p>
      </div>
    </div>
  </footer>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <script src="/js/config.js"></script>
  <script src="/js/site.js"></script>
  {scripts}
</body>
</html>
"""


def _feat_card(icon: str, title: str, body: str, dup: bool = False) -> str:
    cls = "card feat-dup" if dup else "card"
    hid = ' aria-hidden="true"' if dup else ""
    return (
        f'<article class="{cls}"{hid}>'
        f'<div class="icon-pill">{icon}</div><h3>{title}</h3><p>{body}</p>'
        f"</article>"
    )


def _feat_row(cards: list, reverse: bool = False) -> str:
    cls = "feat-row feat-row-rev" if reverse else "feat-row"
    real = "".join(_feat_card(*c) for c in cards)
    dups = "".join(_feat_card(*c, dup=True) for c in cards)
    return f'<div class="{cls}">{real}{dups}</div>'


FEAT_ROW_A = [
    ("Ⓐ", "True anarchy", "No rules, no land claims, no map resets, no whitelist. Griefing allowed. Protected spawn is the only safe tile on the map."),
    ("⧉", "Java + Bedrock", "Same world. Java and Bedrock. Recent Java versions can join — you do not need a special client."),
    ("⚔", "The Arena", "Void-world pit. Right-click ArenaMaster at the south spawn gate (not from the wild). Gear is vaulted, diamond kit on entry, <code>/arena leave</code> restores it at spawn. PvE waves, named bosses, 1v1 or a bot. Punch a boss head in the lobby to spar. Party of 3 max."),
    ("🎤", "Proximity voice", "Simple Voice Chat on the server. You need the matching client mod (Fabric / NeoForge / Forge / Quilt). Vanilla and Bedrock have no voice — that is how SVC works. See <a href=\"/join.html#voice\">install notes</a>."),
    ("⚖", "Anti-cheat, not anti-fun", "Cheating is the only bannable offense. Anti-xray is on. Everything else is the game."),
    ("🏛", "Hall of Legends", "In-game statue hall at spawn for the #1 player in 24 vanilla stat categories, plus Server Firsts (<code>/firsts</code>) for first-on-this-map records. This site mirrors the legends boards. <a href=\"/legends.html\">Open the hall</a>."),
    ("▣", "Anarchy resource pack", "Optional UI pack. No popup on join. In game: <code>/pack</code> menu or <code>/pack low|medium|high|off</code> — chunky iron / worn iron + oxblood / extra rust, rivets, ember trim, or vanilla UI."),
    (";", "VGS quick-chat", "Tribes-style voice-game-soundboard. Press <code>;</code> for a sidebar of 70+ tactical callouts, or fire a code like <code>;af</code>. F-key hand swap is vanilla (no dupe). Plays a sound to everyone."),
]
FEAT_ROW_B = [
    ("※", "Party ping + share", "Middle-click a block or player to ping that spot for your <code>/party</code> (or <code>/ping</code>). Marker on the locator bar. <code>/share</code> still broadcasts a held item. Not in a party = invite someone first."),
    ("◉", "Locator bar + /wp", "Party members see each other on the vanilla locator bar. <code>/wp</code> waypoints: private by default, share with a player or <code>party</code>, HUD roster with distance. Outsiders see nothing."),
    ("→", "/autofollow", "<code>/autofollow &lt;player&gt;</code> (alias <code>/follow</code>) follows someone within 5 blocks. Sneak, damage, or <code>/autofollow off</code> cancels. The jar is staged on the server — it loads at the next restart, not before."),
    ("✦", "ChatFX", "<code>/chatfx</code> (or <code>/cfx</code>) for text effects and signature chat sounds. Mention chime. Currently all free — not a rank shop."),
    ("★", "Vote the lists", "Seven public server lists. Voting is support only — no loot, crates, keys, or ranks. It just keeps the IP visible. <a href=\"/vote.html\">Vote</a>."),
    ("!", "Report &amp; suggest", "<code>/report</code>, <code>/suggest</code>, and <code>/feedback</code> with anti-spam cooldowns. Still anarchy — these are optional, not a ticket system that will save your base."),
    ("▶", "Flashback killcams", "Rolling 60-second clip. PvP deaths auto-clip from both victim and killer. Exports land after the fact in <a href=\"/media.html\">Media</a>."),
    ("文", "Chat + veterans", "Per-viewer translator (whispers too). 5h+ playtime gets a veteran Ⓐ badge, with later hour tiers in the same font. Daily restart around 4am PT with warnings, daily backups."),
]


PAGES = {}

PAGES["index.html"] = (
    "NO RULES SURVIVAL — true Minecraft anarchy",
    "True Minecraft anarchy. No whitelist, no ops, no claims, no rules. Java and Bedrock. Join 76.176.218.251.",
    "/",
    """
    <section class="death-strip" id="killfeed" aria-label="Deaths on this map">
      <div class="wrap death-strip-inner">
        <p class="death-strip-kicker">Deaths</p>
        <div class="death-axis" id="deaths"></div>
      </div>
    </section>

    <section class="hero">
      <div class="hero-stage">
        <div class="hero-bg" aria-hidden="true"></div>
        <div class="wrap hero-inner">
          <div class="hero-copy">
            <p class="kicker">Java · Bedrock · no whitelist</p>
            <h1>NO RULES<br>SURVIVAL</h1>
            <p class="tagline">True anarchy. Copy the IP. You're in.</p>
            <p class="lede hero-lede">PvP, griefing, and stealing are the game. Spawn is a small safe pocket. After that, the only law is no cheating.</p>
            <div class="hero-actions">
              <button class="btn btn-play btn-lg" type="button" data-copy-ip>Play now</button>
              <a class="btn btn-ghost" href="/join.html">Bedrock + voice</a>
            </div>
            <div class="hero-ip-row">
              <p class="ip-display">76.176.218.251</p>
              <span class="status" data-status data-state="unknown">
                <span class="status-dot" aria-hidden="true"></span>
                <span data-count>— / 30</span>
                <span data-label>checking</span>
              </span>
            </div>
            <div class="badges">
              <span class="badge badge-ok">Java</span>
              <span class="badge badge-ok">Bedrock · 19132</span>
              <span class="badge">No whitelist</span>
              <span class="badge">No ops</span>
              <span class="badge">No claims</span>
              <span class="badge">Hard</span>
              <span class="badge">Max 30</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section home-shots wrap" id="shots">
      <p class="kicker">In world</p>
      <h2>The grounds</h2>
      <p class="lede">Spawn, the Hall of Legends, the practice arena, the End. Photos cycle — click one, or open the <a href="/gallery.html">full gallery</a>.</p>
      <div class="home-gallery" id="gallery"></div>
    </section>
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Screenshot">
      <div class="lightbox-bar wrap">
        <p data-cap></p>
        <div class="lightbox-nav">
          <button class="btn btn-ghost" type="button" data-prev>Prev</button>
          <button class="btn btn-ghost" type="button" data-next>Next</button>
          <button class="btn" type="button" data-close>Close</button>
        </div>
      </div>
      <img data-full alt="">
    </div>

    <section class="section" id="features">
      <div class="wrap">
      <p class="kicker">What you get</p>
      <h2>Everything is allowed. Except cheating.</h2>
      <p class="lede">Hover a card to pause. The full list is here — nothing invented, nothing for sale.</p>
      </div>
      <div class="feat-marquee" aria-label="Server features">
        """ + _feat_row(FEAT_ROW_A) + """
        """ + _feat_row(FEAT_ROW_B, reverse=True) + """
      </div>
    </section>
    <section class="section wrap join-again">
      <p class="kicker">That's the pitch</p>
      <h2>Play now</h2>
      <p class="lede">Java or Bedrock. No application. Bedrock uses port 19132. Cheating is the only ban. Voting is support only — it does not give loot.</p>
      <div class="hero-ip-row">
        <p class="ip-display">76.176.218.251</p>
        <span class="status" data-status data-state="unknown">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-count>— / 30</span>
          <span data-label>checking</span>
        </span>
      </div>
      <div class="hero-actions">
        <button class="btn btn-play btn-lg" type="button" data-copy-ip>Play now</button>
        <a class="btn btn-ghost" href="/join.html">Bedrock + voice</a>
        <a class="btn btn-ghost" href="/vote.html">Vote the lists</a>
      </div>
    </section>
    """,
    '<script src="/js/gallery.js"></script>\n  <script src="/js/deaths.js"></script>',
)

PAGES["legends.html"] = (
    "Hall of Legends · NO RULES SURVIVAL",
    "The #1 player in each vanilla stat category, mirrored from the in-game statue hall. Expand any board for the top 10.",
    "/legends.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Flagship</p>
        <h1>Hall of Legends</h1>
        <p class="lede">Same 24 boards as <code>/legends</code> in game — walk the lantern-lit aisle, click a statue. Full sortable lists live on <a href="/rankings.html">Rankings</a>. Server Firsts are <code>/firsts</code>. Unclaimed pedestals stay empty until someone logs the first point.</p>
        <p class="lede" id="legends-updated"></p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section hall-stage wrap">
      <div class="hall-viewport" id="hall-view" tabindex="0" aria-label="Hall of Legends aisle. Drag to look, W S or scroll to walk, click a statue.">
        <div class="hall-world" id="hall-world"></div>
      </div>
      <p class="hall-hint">
        <span>Drag to look · scroll or W/S to walk the aisle · click a statue for the top 10</span>
        <span>
          <button class="btn btn-ghost" type="button" data-hall-prev>Prev</button>
          <button class="btn btn-ghost" type="button" data-hall-next>Next</button>
        </span>
      </p>
      <div class="hall-index" id="hall-index"></div>
      <aside class="hall-detail" id="hall-detail"><p class="lede">Click a statue.</p></aside>
    </section>
    <section class="section wrap">
      <h2>All 24 boards</h2>
      <p class="lede">Every category, same data. Click a card for the top 10. If you asked the site to reduce motion, this list is the hall.</p>
      <div class="legend-grid" id="legends"></div>
    </section>
    """,
    '<script src="/js/legends.js"></script>',
    """<link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://mc-heads.net" crossorigin>
  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js"}}</script>""",
)

PAGES["rankings.html"] = (
    "Rankings · NO RULES SURVIVAL",
    "Sortable vanilla Minecraft leaderboards from this map. Hall of Legends cats, playtime, kills, mined, and more. Real stats only.",
    "/rankings.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Boards</p>
        <h1>Rankings</h1>
        <p class="lede">Every vanilla stat we can read from this map. Hall of Legends 24, plus movement, time, and world stats. Click a name for the full profile. No coordinates. Voting is not a ranking and grants no loot.</p>
        <p class="lede" id="rank-updated"></p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="filters" id="rank-tabs"></div>
      <div class="filters rank-boards" id="rank-boards"></div>
      <div class="board-panel" id="rank-table"></div>
    </section>
    <section class="section wrap">
      <h2>Server Firsts</h2>
      <p class="lede">First-on-this-map records from <code>/firsts</code>. Unclaimed keys are omitted.</p>
      <div class="board-panel" id="rank-firsts"></div>
    </section>
    """,
    '<script src="/js/rankings.js"></script>',
)

PAGES["players.html"] = (
    "Players · NO RULES SURVIVAL",
    "Public profiles for everyone who has joined. Every collected vanilla stat — no coordinates.",
    "/players.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Roster</p>
        <h1>Player profiles</h1>
        <p class="lede">Everyone with a stats file on this map. Each profile lists every vanilla stat we collect, Hall of Legends placements, and Server Firsts. No coordinates, no live location, no vote rewards.</p>
        <p class="lede" id="players-updated"></p>
        <label class="sr-only" for="player-filter">Filter players</label>
        <input class="player-filter" id="player-filter" type="search" placeholder="Filter by name" autocomplete="off" spellcheck="false">
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="player-grid" id="players"></div>
    </section>
    """,
    '<script src="/js/players.js"></script>',
)

PAGES["player.html"] = (
    "Player · NO RULES SURVIVAL",
    "Public Minecraft stats for a NO RULES SURVIVAL player.",
    "/player.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Profile</p>
        <h1 id="profile-title">Player</h1>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap" id="profile"></section>
    """,
    '<script src="/js/player.js"></script>',
)

PAGES["vote.html"] = (
    "Vote · NO RULES SURVIVAL",
    "Seven public list links. Voting is support only — no loot, crates, keys, ranks, or other in-game rewards.",
    "/vote.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Support the lists</p>
        <h1>Vote. That is the whole thing.</h1>
        <p class="lede">These seven links keep NO RULES SURVIVAL on public server lists. Voting is support only. There is no loot table, no crate, no key, no rank, no in-game item. You get nothing back except the server staying findable.</p>
        <p class="vote-banner">Support only — no loot, crates, keys, ranks, or advantage.</p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="vote-list">
        <article class="vote-row"><div><h3>Minecraft-MP</h3><p>minecraft-mp.com</p></div><a class="btn" href="https://minecraft-mp.com/server/365985/vote/" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>MinecraftServers.org</h3><p>minecraftservers.org</p></div><a class="btn" href="https://minecraftservers.org/vote/695286" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>Minecraft Server List</h3><p>minecraft-server-list.com</p></div><a class="btn" href="https://minecraft-server-list.com/server/524473/vote/" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>Minecraft Toplist</h3><p>minecraft-toplist.com</p></div><a class="btn" href="https://minecraft-toplist.com/server/no-rules-survival/vote/" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>Minecraft.buzz</h3><p>minecraft.buzz</p></div><a class="btn" href="https://minecraft.buzz/vote/no-rules-survival" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>TopMinecraftServers</h3><p>topminecraftservers.org</p></div><a class="btn" href="https://topminecraftservers.org/vote/44883" rel="noopener">Vote</a></article>
        <article class="vote-row"><div><h3>TopG</h3><p>topg.org — click “Vote for server”</p></div><a class="btn" href="https://topg.org/minecraft-servers/server-687649" rel="noopener">Vote</a></article>
      </div>
    </section>
    <section class="section wrap">
      <h2>Who has listed us</h2>
      <p class="lede">Public count of list-site votes. Not a rank, not a reward — just who clicked. Cheating vote sites is still cheating.</p>
      <p class="lede" id="votetop-updated"></p>
      <div class="board-panel" id="votetop"></div>
    </section>
    """,
    '<script src="/js/vote.js"></script>',
)

PAGES["gallery.html"] = (
    "Gallery · NO RULES SURVIVAL",
    "Screenshots of protected spawn and the Hall of Legends. No base-hunting intel.",
    "/gallery.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Screens</p>
        <h1>Gallery</h1>
        <p class="lede">Spawn, the statue hall, the practice arena, public dimensions. No base-hunting intel. Click a shot for a lightbox (arrows / Esc).</p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="masonry" id="gallery"></div>
    </section>
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Screenshot">
      <div class="lightbox-bar wrap">
        <p data-cap></p>
        <div class="lightbox-nav">
          <button class="btn btn-ghost" type="button" data-prev>Prev</button>
          <button class="btn btn-ghost" type="button" data-next>Next</button>
          <button class="btn" type="button" data-close>Close</button>
        </div>
      </div>
      <img data-full alt="">
    </div>
    """,
    '<script src="/js/gallery.js"></script>',
)

PAGES["media.html"] = (
    "Media · NO RULES SURVIVAL",
    "YouTube coming soon. Flashback killcam archive posted after fights, never live.",
    "/media.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Watch</p>
        <h1>Media</h1>
        <p class="lede">Killcams auto-export after the fight from the rolling 60-second Flashback buffer — scene camera and first-person, victim and killer. This is not a live kill feed.</p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="yt-card">
        <p class="kicker">YouTube</p>
        <h2>Channel not live yet</h2>
        <p class="lede">When a channel exists it will land here. Until then, the killcam archive below is the show.</p>
      </div>
    </section>
    <section class="section wrap">
      <h2>Killfeed archive</h2>
      <p class="lede">Posted after the fight. Never live, never a coordinate.</p>
      <div class="clip-grid" id="clips"></div>
    </section>
    """,
    '<script src="/js/clips.js"></script>',
)

PAGES["changelog.html"] = (
    "Changelog · NO RULES SURVIVAL",
    "Plugin, server, website, and fix notes for NO RULES SURVIVAL.",
    "/changelog.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Ship log</p>
        <h1>Changelog</h1>
        <p class="lede">What shipped. Filter by tag.</p>
        <div class="filters" role="toolbar" aria-label="Filter changelog">
          <button class="filter-btn" type="button" data-filter="ALL" aria-pressed="true">All</button>
          <button class="filter-btn" type="button" data-filter="PLUGIN" aria-pressed="false">Plugin</button>
          <button class="filter-btn" type="button" data-filter="SERVER" aria-pressed="false">Server</button>
          <button class="filter-btn" type="button" data-filter="WEBSITE" aria-pressed="false">Website</button>
          <button class="filter-btn" type="button" data-filter="FIX" aria-pressed="false">Fix</button>
        </div>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <ol class="timeline" id="changelog"></ol>
    </section>
    """,
    '<script src="/js/changelog.js"></script>',
)

PAGES["join.html"] = (
    "How to join · NO RULES SURVIVAL",
    "Java IP 76.176.218.251:25565. Bedrock port 19132. Optional Simple Voice Chat mod. /pack for the anarchy UI pack.",
    "/join.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Direct connect</p>
        <h1>How to join</h1>
        <p class="lede">No whitelist. No account application. If you can reach the IP, you are in. Cheat and you get banned. That is the only rule.</p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <div class="join-grid">
        <article class="join-panel">
          <p class="kicker">01</p>
          <h2>Java Edition</h2>
          <p>Multiplayer → Direct Connection. Recent Java versions work. Default port 25565.</p>
          <div class="ip-box"><span>76.176.218.251</span><button class="btn btn-play" type="button" data-copy-ip>Play now</button></div>
        </article>
        <article class="join-panel">
          <p class="kicker">02</p>
          <h2>Bedrock Edition</h2>
          <p>Add server. Address <strong>76.176.218.251</strong>, port <strong>19132</strong>. Same world as Java. Proximity voice is Java-mod only — Bedrock will not hear it.</p>
        </article>
      </div>
      <div class="join-extra">
        <article class="join-panel" id="voice">
          <p class="kicker">Optional</p>
          <h3>Simple Voice Chat</h3>
          <p>Proximity voice. Server runs voicechat-bukkit <strong>2.6.25</strong>. Install the matching <em>client</em> mod for your loader (Fabric, NeoForge, Forge, or Quilt) at the same version. Vanilla Java and Bedrock hear nothing — that is how SVC works. Windows CurseForge: <a href="https://github.com/koevetmc/mc-norules-resourcepack/releases/download/v1.2/install-voicechat.bat">install-voicechat.bat</a> (same release as the anarchy pack).</p>
        </article>
        <article class="join-panel">
          <p class="kicker">Optional</p>
          <h3>Anarchy resource pack</h3>
          <p>No accept/decline popup on join. Opt-in only: run <code>/pack</code> for a clickable menu, or <code>/pack low|medium|high|off</code>. Off returns vanilla UI.</p>
        </article>
        <article class="join-panel">
          <p class="kicker">Then</p>
          <h3>Walk out of spawn — or hit the pit</h3>
          <p>The cobble ring is protected spawn: no build, no PvP. Beyond that line there are no rules. Difficulty is hard. South gate: right-click ArenaMaster for the practice arena (gear vaulted). Nametags are hidden in the wild. <code>/autofollow &lt;player&gt;</code> is staged and will load at the next restart — it is not live yet.</p>
        </article>
      </div>
      <p class="join-more"><a class="btn" href="/vote.html">Vote the lists</a> <a class="btn btn-ghost" href="/legends.html">Hall of Legends</a></p>
    </section>
    """,
    "",
)

PAGES["404.html"] = (
    "404 · chunk not generated · NO RULES SURVIVAL",
    "This page was griefed, or it never generated.",
    "/404.html",
    """
    <section class="not-found wrap">
      <div>
        <p class="kicker">404</p>
        <h1>CHUNK NOT<br>GENERATED</h1>
        <p class="lede">Someone griefed this URL, or it never existed. Spawn is still that way.</p>
        <p class="ip-display">76.176.218.251</p>
        <p><button class="btn btn-play" type="button" data-copy-ip>Play now</button> <a class="btn btn-ghost" href="/">Back to spawn</a></p>
      </div>
    </section>
    """,
    "",
)


PAGES["login.html"] = (
    "Sign in · NO RULES SURVIVAL",
    "Email sign-in for your private player page. No Minecraft password is stored here.",
    "/login.html",
    """
    <section class="page-hero wrap">
      <div class="page-hero-copy">
        <p class="kicker">Account</p>
        <h1>Sign in</h1>
        <p class="lede">One email, one site account. After you are in, run <code>/link</code> in-game and type the code here. The site never asks for your Minecraft password.</p>
      </div>
      """ + play_rail() + """
    </section>
    <section class="section wrap">
      <form id="login-form" class="stack-form" autocomplete="on">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email">
        <button class="btn btn-play" type="submit">Send sign-in link</button>
        <p id="form-msg" class="form-msg" role="status"></p>
      </form>
    </section>
    """,
    '<script src="/js/account.js"></script>',
)

PAGES["me.html"] = (
    "Your account · NO RULES SURVIVAL",
    "Private page for the Minecraft account you linked. Your UUID stays on this page.",
    "/me.html",
    """
    <section class="section wrap dash" id="dash" hidden>
      <header class="dash-top">
        <img id="d-avatar" class="avatar" alt="" width="84" height="84">
        <div>
          <p class="kicker"><i id="live-dot"></i> <span id="d-live">Live</span></p>
          <h1 id="d-name">Your account</h1>
          <p id="d-rank" class="rank-line"></p>
          <div class="rank-bar" id="rank-bar" hidden><span id="rank-fill"></span></div>
          <p id="d-rank-next" class="form-msg"></p>
          <p id="d-uuid" class="uuid"></p>
          <p id="d-email" class="form-msg"></p>
        </div>
        <button class="btn btn-ghost" id="logout" type="button">Sign out</button>
      </header>
      <div class="stat-cards" id="stats">
        <article class="stat-card"><span>Playtime</span><b id="s-play">—</b></article>
        <article class="stat-card"><span>Deaths</span><b id="s-deaths">—</b></article>
        <article class="stat-card"><span>Player kills</span><b id="s-pkills">—</b></article>
        <article class="stat-card"><span>Mob kills</span><b id="s-mkills">—</b></article>
        <article class="stat-card"><span>Arena</span><b id="s-arena">—</b></article>
        <article class="stat-card"><span>Waves</span><b id="s-waves">—</b></article>
        <article class="stat-card"><span>Endless</span><b id="s-endless">—</b></article>
        <article class="stat-card"><span>Synced</span><b id="s-when">—</b></article>
      </div>
      <article class="card explore-card">
        <h3>Explored ground</h3>
        <p class="form-msg">Your /wp marks sit on the ground you have walked. Click a mark to center it. Nobody else can open this.</p>
        <div id="explore-worlds" class="world-tabs"></div>
        <canvas id="explore-map" class="explore-map" width="960" height="420"></canvas>
        <ul id="mark-list" class="mark-list"></ul>
      </article>
      <div class="dash-split">
        <article class="card">
          <h3>Polls</h3>
          <div id="polls"><p class="form-msg">Loading…</p></div>
        </article>
      </div>
      <details class="relink" id="relink">
        <summary>Enter a /link code</summary>
        <form id="link-form" class="stack-form">
          <label for="code">Code from <code>/link</code></label>
          <input id="code" name="code" type="text" required minlength="8" maxlength="8" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false">
          <button class="btn" type="submit">Link this account</button>
          <p id="form-msg" class="form-msg" role="status"></p>
        </form>
      </details>
    </section>
    """,
    '<script src="/js/account.js"></script>',
)


def main() -> None:
    for name, spec in PAGES.items():
        title, desc, path, body, scripts = spec[:5]
        extra = spec[5] if len(spec) > 5 else ""
        html = head(title, desc, path, extra) + chrome(body, scripts)
        (ROOT / name).write_text(html, encoding="utf-8")
        print("wrote", name)


if __name__ == "__main__":
    main()
