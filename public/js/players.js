/* 2026-11-03: index of every player in players.json.
   2026-11-09: playtime on tiles + name filter. Real stats only. */
(function () {
  const root = document.getElementById("players");
  if (!root) return;
  const NR = window.NR;
  const filter = document.getElementById("player-filter");
  let players = [];

  function paint(q) {
    const needle = (q || "").trim().toLowerCase();
    const rows = needle
      ? players.filter((p) => p.name.toLowerCase().indexOf(needle) >= 0)
      : players;
    root.innerHTML = rows
      .map((p) => {
        const hours =
          p.stats && p.stats.playtime
            ? window.nrFormatStat("hours", p.stats.playtime)
            : "";
        return (
          '<a class="player-tile" href="/player/' +
          encodeURIComponent(p.name) +
          '/"><img src="' +
          NR.heads +
          "/" +
          encodeURIComponent(p.name) +
          '/40" alt="" width="40" height="40"><b>' +
          p.name.replace(/</g, "") +
          "</b>" +
          (hours ? "<small>" + hours + "</small>" : "") +
          "</a>"
        );
      })
      .join("");
    if (!rows.length) root.innerHTML = "<p class='lede'>No names match.</p>";
  }

  fetch("/data/players.json")
    .then((r) => r.json())
    .then((data) => {
      const note = document.getElementById("players-updated");
      if (note && data.updated) {
        note.textContent = (data.sample ? "Sample data · " : "") + "updated " + data.updated;
      }
      players = (data.players || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      paint("");
      if (filter) {
        filter.addEventListener("input", () => paint(filter.value));
      }
    })
    .catch(() => {
      root.innerHTML = "<p>Could not load the roster.</p>";
    });
})();
