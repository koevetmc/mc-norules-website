/* 2026-11-03: index of every player in players.json. */
(function () {
  const root = document.getElementById("players");
  if (!root) return;
  const NR = window.NR;
  fetch("/data/players.json")
    .then((r) => r.json())
    .then((data) => {
      const note = document.getElementById("players-updated");
      if (note && data.updated) {
        note.textContent = (data.sample ? "Sample data · " : "") + "updated " + data.updated;
      }
      const players = (data.players || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      root.innerHTML = players
        .map((p) => {
          return (
            '<a class="player-tile" href="/player/' +
            encodeURIComponent(p.name) +
            '/"><img src="' +
            NR.heads +
            "/" +
            encodeURIComponent(p.name) +
            '/40" alt="" width="40" height="40"><span>' +
            p.name.replace(/</g, "") +
            "</span></a>"
          );
        })
        .join("");
    })
    .catch(() => {
      root.innerHTML = "<p>Could not load players.json.</p>";
    });
})();
