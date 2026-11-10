#!/usr/bin/env python3
"""Stamp shared chrome onto every HTML page so header/footer stay in sync.
2026-11-09 refine: story order hero → identity → features → gallery →
legends → stats → join. Death timeline is day columns, not a head pile.
Voting stays support-only — no loot, crates, ranks, or in-game advantage."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"
ORIGIN = "https://no-rules-survival.koevetmc.workers.dev"

# Logo is Home. Join is a conversion page — never hide it in More.
NAV_PRIMARY = [
    ("/legends.html", "Legends"),
    ("/rankings.html", "Rankings"),
    ("/gallery.html", "Gallery"),
    ("/join.html", "Join"),
    ("/vote.html", "Vote"),
]
NAV_MORE = [
    ("/players.html", "Players"),
    ("/media.html", "Media"),
    ("/changelog.html", "Log"),
    ("/me.html", "Account"),
]


def head(title: str, desc: str, path: str, extra: str = "") -> str:
    canon = ORIGIN + ("" if path == "/" else path)
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
  <meta property="og:image" content="{ORIGIN}/img/og-image.jpg">
  <meta property="og:url" content="{canon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  {extra}
</head>"""


def _nav_links(pairs) -> str:
    return "\n        ".join(f'<a href="{href}">{label}</a>' for href, label in pairs)


def chrome(main: str, scripts: str) -> str:
    primary = _nav_links(NAV_PRIMARY)
    more = _nav_links(NAV_MORE)
    foot_links = _nav_links(NAV_PRIMARY + NAV_MORE)
    return f"""
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="/" aria-label="NO RULES SURVIVAL home">
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
          <span data-count>—</span>
          <span data-label>checking</span>
        </span>
        <button class="btn btn-play" type="button" data-copy-ip="auto">Play now</button>
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


FEATURES = [
    ("Arena", "Void-world pit. Right-click ArenaMaster at the south spawn gate. Gear is vaulted. Waves, named bosses, 1v1 or a bot."),
    ("Bosses", "Named hosts in the pit. Punch a boss head in any lobby to spar. No rank, no board for a spar."),
    ("Crossplay", "Same world on Java and Bedrock. Recent Java versions join without a special client."),
    ("Proximity voice", "Simple Voice Chat on the server. Matching client mod required. Vanilla and Bedrock hear nothing — that is how it works. <a href=\"/join.html#voice\">Install notes</a>."),
    ("Killcams", "Rolling 60-second clip. PvP deaths auto-clip from victim and killer. Posted after the fight in <a href=\"/media.html\">Media</a>."),
    ("Pack", "Optional anarchy UI. No popup on join. In game: <code>/pack</code> — low, medium, high, or off."),
    ("Quick-chat", "Press <code>;</code> for a sidebar of tactical callouts, or fire a code like <code>;af</code>. Plays a sound to everyone nearby."),
    ("Party", "Invite with <code>/party</code>. Middle-click pings a spot on the locator bar. Outsiders see nothing."),
    ("Progression", "Veteran mark in chat after five hours. Hall of Legends statues. Server Firsts. No paid ranks."),
    ("Hall", "Twenty-four vanilla boards in a statue aisle at spawn. This site is the same hall. <a href=\"/legends.html\">Walk it</a>."),
]


def _feat_index() -> str:
    rows = "".join(
        f'<div class="feat-line"><h3>{title}</h3><p>{body}</p></div>'
        for title, body in FEATURES
    )
    return f'<div class="feat-index">{rows}</div>'


PAGES = {}

PAGES["index.html"] = (
    "NO RULES SURVIVAL — true Minecraft anarchy",
    "True Minecraft anarchy. No whitelist, no ops, no claims, no rules. Java and Bedrock. Join 76.176.218.251.",
    "/",
    """
    <section class="hero">
      <div class="hero-stage">
        <img class="hero-photo" src="/gallery/spawn-anarchy-a.jpg" alt="" width="1920" height="1080" fetchpriority="high">
        <div class="hero-veil" aria-hidden="true"></div>
        <div class="wrap hero-plaque">
          <p class="kicker">Java · Bedrock · no whitelist</p>
          <h1>NO RULES SURVIVAL</h1>
          <p class="tagline">Copy the IP. You're in.</p>
          <div class="edition" role="tablist" aria-label="Edition">
            <button class="edition-btn is-on" type="button" role="tab" aria-selected="true" data-edition="java">Java</button>
            <button class="edition-btn" type="button" role="tab" aria-selected="false" data-edition="bedrock">Bedrock</button>
          </div>
          <button class="ip-display ip-plaque" type="button" data-copy-ip="auto" data-ip-face>76.176.218.251</button>
          <p class="edition-note" data-edition-note>Direct connect. Default port 25565. <a href="/join.html">How to join</a></p>
        </div>
      </div>
    </section>

    <section class="section wrap identity" id="identity">
      <p class="kicker">The law</p>
      <h2>Spawn is a pocket. After that, nothing is safe.</h2>
      <p class="lede">The cobble ring is protected: no build, no PvP. Beyond it there are no claims, no ops, no resets, no whitelist. Griefing, stealing, and PvP are the game. Cheating is the only ban. Cap 30.</p>
    </section>

    <section class="death-strip" id="killfeed" aria-label="Deaths on this map">
      <div class="wrap">
        <p class="death-strip-kicker">Deaths on this map</p>
        <div class="death-axis" id="deaths"></div>
        <div class="death-tray" id="death-tray" aria-live="polite"></div>
      </div>
    </section>

    <section class="section wrap" id="features">
      <p class="kicker">In play</p>
      <h2>What the world actually has</h2>
      """ + _feat_index() + """
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

    <section class="section wrap" id="home-hall">
      <p class="kicker">Statues</p>
      <h2>Hall of Legends</h2>
      <p class="lede">The #1 in each board stands in the aisle at spawn. Walk it here. Full lists on <a href="/rankings.html">Rankings</a>.</p>
      <div class="home-legends" id="home-legends"></div>
      <p><a class="btn" href="/legends.html">Walk the hall</a></p>
    </section>

    <section class="section wrap" id="home-boards">
      <p class="kicker">Live boards</p>
      <h2>Who holds the map</h2>
      <p class="lede">Vanilla stats from this world. No coordinates. Vote counts are not a board.</p>
      <div class="home-stats" id="home-stats"></div>
      <p><a class="btn btn-ghost" href="/rankings.html">All rankings</a></p>
    </section>

    <section class="section wrap join-again">
      <p class="kicker">Direct connect</p>
      <h2>Play now</h2>
      <p class="lede">Java or Bedrock. No application. Cheating is the only ban. Voting is support only — it does not give loot.</p>
      <button class="ip-display ip-plaque" type="button" data-copy-ip="auto" data-ip-face>76.176.218.251</button>
      <div class="hero-actions">
        <button class="btn btn-play btn-lg" type="button" data-copy-ip="auto">Play now</button>
        <a class="btn btn-ghost" href="/join.html">How to join</a>
        <a class="btn btn-ghost" href="/vote.html">Vote the lists</a>
      </div>
    </section>
    """,
    '<script src="/js/gallery.js"></script>\n  <script src="/js/deaths.js"></script>\n  <script src="/js/home.js"></script>',
    '<link rel="preload" as="image" href="/gallery/spawn-anarchy-a.jpg">',
)

PAGES["legends.html"] = (
    "Hall of Legends · NO RULES SURVIVAL",
    "The #1 player in each vanilla stat category, mirrored from the in-game statue hall. Expand any board for the top 10.",
    "/legends.html",
    """
    <section class="hall-bleed">
      <div class="hall-head">
        <p class="kicker">In game</p>
        <h1>Hall of Legends</h1>
        <p class="hall-sub">Walk the aisle. Click a statue. <span id="legends-updated"></span></p>
      </div>
      <div class="hall-viewport" id="hall-view" tabindex="0" aria-label="Hall of Legends aisle. Drag to look, W S or scroll to walk, click a statue.">
        <div class="hall-world" id="hall-world"></div>
      </div>
      <p class="hall-hint wrap">
        <span>Drag to look · scroll or W/S to walk · click a statue</span>
        <span>
          <button class="btn btn-ghost" type="button" data-hall-prev>Prev</button>
          <button class="btn btn-ghost" type="button" data-hall-next>Next</button>
        </span>
      </p>
    </section>
    <section class="section wrap hall-meta">
      <div class="hall-index" id="hall-index"></div>
      <aside class="hall-detail" id="hall-detail"><p class="lede">Click a statue.</p></aside>
    </section>
    <section class="section wrap">
      <h2>All 24 boards</h2>
      <p class="lede">Same data as the aisle. Click a board for the top 10. Sortable lists live on <a href="/rankings.html">Rankings</a>.</p>
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
        <p class="lede">Kills, deaths, time alive, distance walked — the same boards as the Hall of Legends, plus movement and world stats. Click a name for the full profile. No coordinates. Voting is not a ranking and grants no loot.</p>
        <p class="lede" id="rank-updated"></p>
      </div>
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
        <h1>Vote</h1>
        <p class="lede">These seven links keep NO RULES SURVIVAL on public server lists. Voting is support only. There is no loot table, no crate, no key, no rank, no in-game item. You get nothing back except the server staying findable.</p>
        <p class="vote-banner">Support only — no loot, crates, keys, ranks, or advantage.</p>
      </div>
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
          <div class="ip-box"><span>76.176.218.251:19132</span><button class="btn btn-play" type="button" data-copy-ip="bedrock">Play now</button></div>
        </article>
      </div>
      <div class="join-extra">
        <article class="join-panel" id="voice">
          <p class="kicker">Optional</p>
          <h3>Simple Voice Chat</h3>
          <p>Proximity voice. Server runs Simple Voice Chat <strong>2.6.25</strong>. Install the matching <em>client</em> mod for your loader (Fabric, NeoForge, Forge, or Quilt) at the same version. Vanilla Java and Bedrock hear nothing — that is how SVC works. Windows CurseForge: <a href="https://github.com/koevetmc/mc-norules-resourcepack/releases/download/v1.2/install-voicechat.bat">install-voicechat.bat</a> (same release as the anarchy pack).</p>
        </article>
        <article class="join-panel">
          <p class="kicker">Optional</p>
          <h3>Anarchy resource pack</h3>
          <p>No accept/decline popup on join. Opt-in only: run <code>/pack</code> for a clickable menu, or <code>/pack low|medium|high|off</code>. Off returns vanilla UI.</p>
        </article>
        <article class="join-panel">
          <p class="kicker">Then</p>
          <h3>Walk out of spawn — or hit the pit</h3>
          <p>The cobble ring is protected spawn: no build, no PvP. Beyond that line there are no rules. Difficulty is hard. South gate: right-click ArenaMaster for the practice arena (gear vaulted). Nametags are hidden in the wild. <code>/autofollow</code> is not live until the next restart.</p>
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
