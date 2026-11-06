#!/usr/bin/env python3
"""Stamp shared chrome onto every HTML page so header/footer stay in sync.
2026-11-03: initial site. 2026-11-06: Arena, /pack off, ItemShare ping,
ChatFX, Server Firsts, waypoints HUD/share, Flashback dual-angle, pack v1.2.
Voting stays support-only — no loot, crates, ranks, or in-game advantage."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"

NAV = [
    ("/", "Home"),
    ("/legends.html", "Legends"),
    ("/players.html", "Players"),
    ("/vote.html", "Vote"),
    ("/gallery.html", "Gallery"),
    ("/media.html", "Media"),
    ("/changelog.html", "Log"),
    ("/join.html", "Join"),
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


def chrome(main: str, scripts: str) -> str:
    links = "\n        ".join(f'<a href="{href}">{label}</a>' for href, label in NAV)
    return f"""
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="/">
        <span class="logo-slot"><img src="/img/logo.svg" class="logo" width="42" height="42" alt=""></span>
        <span class="brand-text">NO RULES SURVIVAL<small>true anarchy</small></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav class="site-nav" id="site-nav" aria-label="Primary">
        {links}
      </nav>
    </div>
  </header>
  <main id="main">
{main}
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <p>© <span data-year>2026</span> NO RULES SURVIVAL · Paper 26.3 · 76.176.218.251</p>
      <p class="fairness-note">Anarchy fairness: this site never shows coordinates, live location, or who is online by name. Leaderboards and clips are public in-game data posted after the fact.</p>
    </div>
  </footer>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <script src="/js/config.js"></script>
  <script src="/js/site.js"></script>
  {scripts}
</body>
</html>
"""


PAGES = {}

PAGES["index.html"] = (
    "NO RULES SURVIVAL — true Minecraft anarchy",
    "True anarchy survival on Paper 26.3. No whitelist, no ops, no claims, no rules. Java and Bedrock. Join 76.176.218.251.",
    "/",
    """
    <section class="hero wrap">
      <div class="hero-logo logo-slot" aria-hidden="true"><img src="/img/logo.svg" alt=""></div>
      <p class="kicker">Java + Bedrock · Paper 26.3</p>
      <h1>NO RULES<br>SURVIVAL</h1>
      <p class="tagline">Join anarchy</p>
      <div class="hero-actions">
        <button class="btn btn-lg" type="button" data-copy-ip>Copy IP · 76.176.218.251</button>
        <a class="btn btn-ghost" href="/join.html">How to join</a>
        <span class="status" data-status data-state="unknown">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-count>— / 30</span>
          <span data-label>checking</span>
        </span>
      </div>
      <div class="badges">
        <span class="badge badge-ok">Java 25565</span>
        <span class="badge badge-ok">Bedrock 19132</span>
        <span class="badge">No whitelist</span>
        <span class="badge">No ops</span>
        <span class="badge">No claims</span>
        <span class="badge">Hard</span>
        <span class="badge">Max 30</span>
      </div>
    </section>

    <section class="section wrap" id="features">
      <p class="kicker">What you get</p>
      <h2>Everything is allowed. Except cheating.</h2>
      <p class="lede">PvP, griefing, and stealing are the game. Difficulty is hard. Spawn is a small no-build / no-pvp pocket so new players can walk out. GrimAC + anti-xray is the only law. A practice arena sits at the south spawn gate — it does not protect you in the wild.</p>
      <div class="grid">
        <article class="card"><div class="icon-pill">Ⓐ</div><h3>True anarchy</h3><p>No rules, no land claims, no map resets, no whitelist. Griefing allowed. Protected spawn is the only safe tile on the map.</p></article>
        <article class="card"><div class="icon-pill">⧉</div><h3>Java + Bedrock</h3><p>Geyser + floodgate crossplay. ViaVersion and ViaBackwards let older and newer Java clients join Paper 26.3.</p></article>
        <article class="card"><div class="icon-pill">⚔</div><h3>The Arena</h3><p>Void-world pit. Right-click ArenaMaster at the south spawn gate (not from the wild). Gear is vaulted, diamond kit on entry, <code>/arena leave</code> restores it at spawn. PvE waves, named bosses, 1v1 or a bot. Punch a boss head in the lobby to spar. Party of 3 max.</p></article>
        <article class="card"><div class="icon-pill">🎤</div><h3>Proximity voice</h3><p>Simple Voice Chat on the server. You need the matching client mod (Fabric / NeoForge / Forge / Quilt). Vanilla and Bedrock have no voice — that is how SVC works. See <a href="/join.html#voice">install notes</a>.</p></article>
        <article class="card"><div class="icon-pill">⚖</div><h3>Anti-cheat, not anti-fun</h3><p>GrimAC + packetevents. Cheating is the only bannable offense. Anti-xray engine-mode 2 is on.</p></article>
        <article class="card"><div class="icon-pill">🏛</div><h3>Hall of Legends</h3><p>In-game statue hall at spawn for the #1 player in 24 vanilla stat categories, plus Server Firsts (<code>/firsts</code>) for first-on-this-map records. This site mirrors the legends boards. <a href="/legends.html">Open the hall</a>.</p></article>
        <article class="card"><div class="icon-pill">▣</div><h3>Anarchy resource pack</h3><p>Optional UI pack. No popup on join. In game: <code>/pack</code> menu or <code>/pack low|medium|high|off</code> — chunky iron / worn iron + oxblood / extra rust, rivets, ember trim, or vanilla UI.</p></article>
        <article class="card"><div class="icon-pill">;</div><h3>VGS quick-chat</h3><p>Tribes-style voice-game-soundboard. Press <code>;</code> for a sidebar of 70+ tactical callouts, or fire a code like <code>;af</code>. F-key hand swap is vanilla (no dupe). Plays a sound to everyone.</p></article>
        <article class="card"><div class="icon-pill">※</div><h3>Party ping + share</h3><p>Middle-click a block or player to ping that spot for your <code>/party</code> (or <code>/ping</code>). Marker on the locator bar. <code>/share</code> still broadcasts a held item. Not in a party = invite someone first.</p></article>
        <article class="card"><div class="icon-pill">◉</div><h3>Locator bar + /wp</h3><p>Party members see each other on the vanilla locator bar. <code>/wp</code> waypoints: private by default, share with a player or <code>party</code>, HUD roster with distance. Outsiders see nothing.</p></article>
        <article class="card"><div class="icon-pill">→</div><h3>/autofollow</h3><p><code>/autofollow &lt;player&gt;</code> follows a nearby player hands-free. Must be within 5 blocks. Sneak or damage cancels.</p></article>
        <article class="card"><div class="icon-pill">✦</div><h3>ChatFX</h3><p><code>/chatfx</code> (or <code>/cfx</code>) for text effects and signature chat sounds. Mention chime. Currently all free — not a rank shop.</p></article>
        <article class="card"><div class="icon-pill">★</div><h3>Vote the lists</h3><p>Seven public server lists. Voting is support only — no loot, crates, keys, or ranks. It just keeps the IP visible. <a href="/vote.html">Vote</a>.</p></article>
        <article class="card"><div class="icon-pill">!</div><h3>Report &amp; suggest</h3><p><code>/report</code>, <code>/suggest</code>, and <code>/feedback</code> with anti-spam cooldowns. Still anarchy — these are optional, not a ticket system that will save your base.</p></article>
        <article class="card"><div class="icon-pill">▶</div><h3>Flashback killcams</h3><p>Rolling 60-second clip. PvP deaths auto-clip from both victim and killer. Exports land after the fact in <a href="/media.html">Media</a>.</p></article>
        <article class="card"><div class="icon-pill">文</div><h3>Chat + veterans</h3><p>Per-viewer translator (whispers too). 5h+ playtime gets a veteran Ⓐ badge, with later hour tiers in the same font. Pregenned world (Chunky r=3000). Daily restart ~4am PT with warnings, daily backups.</p></article>
      </div>
    </section>
    """,
    "",
)

PAGES["legends.html"] = (
    "Hall of Legends · NO RULES SURVIVAL",
    "The #1 player in each vanilla stat category, mirrored from the in-game statue hall. Expand any board for the top 10.",
    "/legends.html",
    """
    <section class="page-hero wrap">
      <p class="kicker">Flagship</p>
      <h2>Hall of Legends</h2>
      <p class="lede">Same boards as <code>/legends</code> in game. Twenty-four vanilla stat categories in the statue hall under spawn. The same hall also holds Server Firsts — first-on-this-map records via <code>/firsts</code> (diamond, first blood, nether, dragon, and the rest). Unclaimed legends pedestals stay empty until someone logs the first point. Click a card for the top 10.</p>
      <p class="lede" id="legends-updated"></p>
    </section>
    <section class="section wrap">
      <div class="legend-grid" id="legends"></div>
    </section>
    """,
    '<script src="/js/legends.js"></script>',
)

PAGES["players.html"] = (
    "Players · NO RULES SURVIVAL",
    "Public profiles for everyone who has joined. Stats only — no coordinates.",
    "/players.html",
    """
    <section class="page-hero wrap">
      <p class="kicker">Roster</p>
      <h2>Player profiles</h2>
      <p class="lede">Everyone who has ever joined. Skins, Hall of Legends badges, vanilla stats. No coordinates, no live location, no base intel — this is anarchy, the site is not an ESP.</p>
      <p class="lede" id="players-updated"></p>
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
      <p class="kicker">Profile</p>
      <h2 id="profile-title">Player</h2>
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
      <p class="kicker">Support the lists</p>
      <h2>Vote. That is the whole thing.</h2>
      <p class="lede">These seven links keep NO RULES SURVIVAL on public server lists. Voting is support only. There is no loot table, no crate, no key, no rank, no in-game item. You get nothing back except the server staying findable.</p>
    </section>
    <section class="section wrap">
      <div class="grid">
        <article class="card vote-card"><h3>Minecraft-MP</h3><p>minecraft-mp.com</p><a class="btn" href="https://minecraft-mp.com/server/365985/vote/" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>MinecraftServers.org</h3><p>minecraftservers.org</p><a class="btn" href="https://minecraftservers.org/vote/695286" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>Minecraft Server List</h3><p>minecraft-server-list.com</p><a class="btn" href="https://minecraft-server-list.com/server/524473/vote/" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>Minecraft Toplist</h3><p>minecraft-toplist.com</p><a class="btn" href="https://minecraft-toplist.com/server/no-rules-survival/vote/" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>Minecraft.buzz</h3><p>minecraft.buzz</p><a class="btn" href="https://minecraft.buzz/vote/no-rules-survival" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>TopMinecraftServers</h3><p>topminecraftservers.org</p><a class="btn" href="https://topminecraftservers.org/vote/44883" rel="noopener">Vote</a></article>
        <article class="card vote-card"><h3>TopG</h3><p>topg.org — click “Vote for server”</p><a class="btn" href="https://topg.org/minecraft-servers/server-687649" rel="noopener">Vote</a></article>
      </div>
    </section>
    <section class="section wrap">
      <h2>Who has listed us</h2>
      <p class="lede">Public count of list-site votes. Not a rank, not a reward — just who clicked. Cheating vote sites is still cheating.</p>
      <p class="lede" id="votetop-updated"></p>
      <div class="card" id="votetop" style="padding:0"></div>
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
      <p class="kicker">Screens</p>
      <h2>Gallery</h2>
      <p class="lede">Spawn, the statue hall, the practice arena, public dimensions. No base-hunting intel. Click for a lightbox (arrows / Esc). Drop files in <code>/gallery/</code> and add a line to <code>data/gallery.json</code>.</p>
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
      <p class="kicker">Watch</p>
      <h2>Media</h2>
      <p class="lede">Killcams auto-export after the fight from the rolling 60-second Flashback buffer — scene camera and first-person, victim and killer. This is not a live kill feed.</p>
    </section>
    <section class="section wrap">
      <h2>YouTube — coming soon</h2>
      <div class="yt-card">
        <p class="kicker">Subscribe</p>
        <h3>Channel not live yet</h3>
        <p class="lede">When the channel exists it will land here. Until then, the killcam archive below is the show.</p>
        <a class="btn btn-ghost" href="https://www.youtube.com" rel="noopener">YouTube</a>
      </div>
    </section>
    <section class="section wrap">
      <h2>Killfeed archive</h2>
      <p class="lede">Drop mp4s in <code>/clips/</code> and add a row to <code>data/clips.json</code>.</p>
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
      <p class="kicker">Ship log</p>
      <h2>Changelog</h2>
      <p class="lede">Maintained in <code>data/changelog.json</code>. Filter by tag.</p>
      <div class="filters" role="toolbar" aria-label="Filter changelog">
        <button class="filter-btn" type="button" data-filter="ALL" aria-pressed="true">All</button>
        <button class="filter-btn" type="button" data-filter="PLUGIN" aria-pressed="false">Plugin</button>
        <button class="filter-btn" type="button" data-filter="SERVER" aria-pressed="false">Server</button>
        <button class="filter-btn" type="button" data-filter="WEBSITE" aria-pressed="false">Website</button>
        <button class="filter-btn" type="button" data-filter="FIX" aria-pressed="false">Fix</button>
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
      <p class="kicker">Direct connect</p>
      <h2>How to join</h2>
      <p class="lede">No whitelist. No account application. If you can reach the IP, you are in. GrimAC will ban you if you cheat. That is the only rule.</p>
    </section>
    <section class="section wrap">
      <ol class="steps">
        <li>
          <h3>Java Edition</h3>
          <p>Multiplayer → Direct Connection. Paper 26.3. ViaVersion + ViaBackwards accept older and newer Java clients.</p>
          <div class="ip-box"><span>76.176.218.251</span><button class="btn" type="button" data-copy-ip>Copy</button></div>
        </li>
        <li>
          <h3>Bedrock Edition</h3>
          <p>Add server. Address <strong>76.176.218.251</strong>, port <strong>19132</strong>. Crossplay via Geyser + floodgate. You will not have Simple Voice Chat.</p>
        </li>
        <li id="voice">
          <h3>Optional: Simple Voice Chat</h3>
          <p>Proximity voice. Server runs voicechat-bukkit <strong>2.6.25</strong>. Install the matching <em>client</em> mod for your loader (Fabric, NeoForge, Forge, or Quilt) at the same version. Vanilla Java and Bedrock hear nothing — that is how SVC works. Windows CurseForge: <a href="https://github.com/koevetmc/mc-norules-resourcepack/releases/download/v1.2/install-voicechat.bat">install-voicechat.bat</a> (same release as the anarchy pack).</p>
        </li>
        <li>
          <h3>Optional: anarchy resource pack</h3>
          <p>No accept/decline popup on join. Opt-in only: run <code>/pack</code> for a clickable menu, or <code>/pack low|medium|high|off</code>. Off returns vanilla UI. Pack v1.2 (charcoal/oxblood iron, veteran Ⓐ glyphs).</p>
        </li>
        <li>
          <h3>Walk out of spawn — or hit the pit</h3>
          <p>The cobble ring is a WorldGuard pocket: no build, no pvp. Beyond that line there are no rules. Difficulty is hard. South gate: right-click ArenaMaster for the practice arena (gear vaulted). Nametags are hidden in the wild.</p>
        </li>
      </ol>
      <p><a class="btn" href="/vote.html">Vote</a> <a class="btn btn-ghost" href="/legends.html">Hall of Legends</a></p>
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
        <p><a class="btn" href="/">Back to spawn</a> <a class="btn btn-ghost" href="/join.html">How to join</a></p>
      </div>
    </section>
    """,
    "",
)


def main() -> None:
    for name, (title, desc, path, main, scripts) in PAGES.items():
        html = head(title, desc, path) + chrome(main, scripts)
        (ROOT / name).write_text(html, encoding="utf-8")
        print("wrote", name)


if __name__ == "__main__":
    main()
