/* 2026-11-08: homepage death timeline from /data/deaths.json (real log lines).
   Newest first. Player heads via mc-heads. No coordinates. */
(function () {
  const root = document.getElementById("deaths");
  if (!root) return;
  const NR = window.NR || { heads: "https://mc-heads.net/avatar" };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function fmtWhen(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.replace("T", " ").replace("Z", " UTC");
    return d.toISOString().replace("T", " ").replace("Z", " UTC");
  }

  fetch("/data/deaths.json")
    .then((r) => r.json())
    .then((data) => {
      const note = document.getElementById("deaths-updated");
      if (note && data.updated) {
        note.textContent =
          (data.sample ? "Sample · " : "") +
          data.items.length +
          " deaths · updated " +
          data.updated.replace("T", " ").replace("Z", " UTC");
      }
      const items = data.items || [];
      if (!items.length) {
        root.innerHTML = "<p class='lede'>No deaths in the log dump yet. Anarchy will fix that.</p>";
        return;
      }
      root.innerHTML = items
        .map((e) => {
          const name = esc(e.name || "");
          const msg = esc(e.message || "");
          const href = "/player/" + encodeURIComponent(e.name || "") + "/";
          return (
            '<article class="death-row">' +
            '<img src="' +
            NR.heads +
            "/" +
            encodeURIComponent(e.name) +
            '/40" alt="" width="40" height="40">' +
            "<div><p><a href='" +
            href +
            "'>" +
            name +
            "</a> " +
            msg +
            "</p><time datetime='" +
            String(e.at || "") +
            "'>" +
            fmtWhen(e.at) +
            "</time></div></article>"
          );
        })
        .join("");
    })
    .catch(() => {
      root.innerHTML = "<p>Could not load deaths.json.</p>";
    });
})();
