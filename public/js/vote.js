/* 2026-11-03: /votetop mirror from data/votetop.json. */
(function () {
  const root = document.getElementById("votetop");
  if (!root) return;
  const NR = window.NR;
  fetch("/data/votetop.json")
    .then((r) => r.json())
    .then((data) => {
      const note = document.getElementById("votetop-updated");
      if (note && data.updated) note.textContent = (data.sample ? "Sample · " : "") + data.updated;
      const entries = data.entries || [];
      if (!entries.length) {
        root.innerHTML = "<p class='lede'>No votes recorded yet.</p>";
        return;
      }
      root.innerHTML =
        "<ol class='top10' style='display:grid;padding:1rem'>" +
        entries
          .slice(0, 25)
          .map((e, i) => {
            return (
              "<li><span class='rank'>" +
              (i + 1) +
              "</span><img src='" +
              NR.heads +
              "/" +
              encodeURIComponent(e.name) +
              "/32' alt='' width='20' height='20'><a href='/player/" +
              encodeURIComponent(e.name) +
              "/'>" +
              e.name +
              "</a><span>" +
              Number(e.votes).toLocaleString() +
              " votes</span></li>"
            );
          })
          .join("") +
        "</ol>";
    });
})();
