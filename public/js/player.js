/* 2026-11-03: player profile. Name from /player/<Name>/ or ?name=.
   2026-11-08: every collected vanilla stat, Hall badges, Server Firsts.
   Stats only — never coordinates, never last location, never vote rewards. */
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
    fetch("/data/legends.json").then((r) => r.json()),
    fetch("/data/stats-catalog.json").then((r) => r.json()),
    fetch("/data/firsts.json").then((r) => r.json()).catch(() => ({ claims: [] })),
  ])
    .then(([players, legends, catalog, firstsDoc]) => {
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
      (firstsDoc.claims || []).forEach((c) => {
        if (c.name && c.name.toLowerCase() === p.name.toLowerCase()) {
          badges.push({ title: c.title || c.key, place: "First" });
        }
      });

      const s = p.stats || {};
      const groups = catalog.groups || [];
      const stats = catalog.stats || [];
      const groupBlocks = groups
        .map((g) => {
          const rows = stats.filter((st) => st.group === g.id);
          if (!rows.length) return "";
          const tr = rows
            .map((st) => {
              const raw = s[st.id];
              const shown =
                raw == null || raw === ""
                  ? "—"
                  : window.nrFormatStat(st.format, raw, st.unit);
              return (
                "<tr><th>" +
                st.title.replace(/</g, "") +
                "</th><td>" +
                shown +
                "</td></tr>"
              );
            })
            .join("");
          return "<h3 class='stat-group'>" + g.title.replace(/</g, "") + "</h3><table class='stat-table'><tbody>" + tr + "</tbody></table>";
        })
        .join("");

      function listTop(title, rows) {
        if (!rows || !rows.length) return "";
        return (
          "<h3 class='stat-group'>" +
          title +
          "</h3><table class='stat-table'><tbody>" +
          rows
            .map((r) => {
              const label = String(r.id || "").replace(/_/g, " ").replace(/</g, "");
              return "<tr><th>" + label + "</th><td>" + Number(r.value).toLocaleString() + "</td></tr>";
            })
            .join("") +
          "</tbody></table>"
        );
      }

      const kd =
        s.deaths
          ? (Number(s.kills || 0) / Number(s.deaths)).toFixed(2)
          : Number(s.kills || 0).toFixed(2);

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
        (p.bedrock ? "<p class='lede'>Bedrock (Geyser/floodgate).</p>" : "") +
        (badges.length
          ? '<div class="rank-list">' +
            badges
              .map((b) => '<span class="rank-chip">' + b.place + " " + b.title.replace(/</g, "") + "</span>")
              .join("") +
            "</div>"
          : "<p class='lede'>No Hall of Legends or Server Firsts yet.</p>") +
        "<p class='lede'><a href='/rankings.html'>Open rankings</a> · K/D " +
        kd +
        "</p>" +
        groupBlocks +
        listTop("Most mined (this map)", p.topMined) +
        listTop("Most killed (this map)", p.topKilled) +
        "<p class='lede' style='margin-top:1rem'>Public vanilla stats from this map. This page never shows coordinates, live location, or vote rewards.</p>" +
        "</div></div>";
    })
    .catch(() => {
      mount.innerHTML = "<p>Could not load player data.</p>";
    });
})();
