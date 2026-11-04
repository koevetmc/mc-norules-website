/* 2026-11-03: player profile. Name comes from /player/<Name>/ or ?name=.
   Stats only — never coordinates, never last location, never base info. */
(function () {
  const mount = document.getElementById("profile");
  if (!mount) return;
  const NR = window.NR;

  function playerName() {
    const q = new URLSearchParams(location.search).get("name");
    if (q) return q;
    const parts = location.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("player");
    if (i >= 0 && parts[i + 1] && parts[i + 1] !== "index.html") return decodeURIComponent(parts[i + 1]);
    return "";
  }

  const name = playerName();
  if (!name) {
    mount.innerHTML = "<p>Missing player name. See the <a href='/players.html'>player list</a>.</p>";
    return;
  }

  Promise.all([
    fetch("/data/players.json").then((r) => r.json()),
    fetch("/data/legends.json").then((r) => r.json())
  ])
    .then(([players, legends]) => {
      const list = players.players || [];
      const p = list.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!p) {
        mount.innerHTML =
          "<p>No profile for <strong>" +
          name.replace(/</g, "") +
          "</strong>. They may not be in players.json yet. <a href='/players.html'>All players</a>.</p>";
        return;
      }

      document.title = p.name + " · NO RULES SURVIVAL";
      const h = document.getElementById("profile-title");
      if (h) h.textContent = p.name;

      const badges = [];
      const cats = legends.categories || {};
      Object.keys(cats).forEach((key) => {
        const cat = cats[key];
        const entries = cat.entries || [];
        const idx = entries.findIndex((e) => e.name.toLowerCase() === p.name.toLowerCase());
        if (idx === 0) badges.push({ title: cat.title, place: "#1" });
        else if (idx > 0 && idx < 10) badges.push({ title: cat.title, place: "#" + (idx + 1) });
      });

      const s = p.stats || {};
      const kd =
        s.kd != null
          ? s.kd
          : s.deaths
            ? (Number(s.kills || 0) / Number(s.deaths)).toFixed(2)
            : Number(s.kills || 0).toFixed(2);

      const rows = [
        ["Kills", s.kills],
        ["Deaths", s.deaths],
        ["K/D", kd],
        ["Playtime", s.playtimeHours != null ? s.playtimeHours + " hours" : "—"],
        ["Distance traveled", s.distanceKm != null ? s.distanceKm + " km" : "—"],
        ["Blocks mined", s.mined],
        ["Blocks placed", s.placed],
        ["Totems popped", s.totems],
        ["Crystals placed", s.crystals],
        ["Votes", p.votes]
      ];

      mount.innerHTML =
        '<div class="profile">' +
        '<div class="skin-frame"><img src="' +
        NR.body +
        "/" +
        encodeURIComponent(p.name) +
        '" alt="Skin of ' +
        p.name.replace(/"/g, "") +
        '" width="180" height="360"></div>' +
        "<div>" +
        (badges.length
          ? '<div class="rank-list">' +
            badges
              .map((b) => '<span class="rank-chip">' + b.place + " " + b.title + "</span>")
              .join("") +
            "</div>"
          : "<p class='lede'>No Hall of Legends placements yet.</p>") +
        "<table class='stat-table'><tbody>" +
        rows
          .map((r) => {
            const v = r[1] == null || r[1] === "" ? "—" : r[1];
            return "<tr><th>" + r[0] + "</th><td>" + v + "</td></tr>";
          })
          .join("") +
        "</tbody></table>" +
        (p.firstSeen || p.lastSeen
          ? "<p class='lede' style='margin-top:1rem'>First seen " +
            (p.firstSeen || "—") +
            " · Last seen " +
            (p.lastSeen || "—") +
            "</p>"
          : "") +
        "<p class='lede'>Public stats only. This page never shows coordinates or live location.</p>" +
        "</div></div>";
    })
    .catch(() => {
      mount.innerHTML = "<p>Could not load player data.</p>";
    });
})();
