/* 2026-11-08: homepage death timeline from /data/deaths.json (real log lines).
   Horizontal axis, oldest on the left, newest on the right. Player heads + UTC stamps.
   No coordinates. After paint we scroll to the right so the latest deaths are in view. */
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

  function fmtDay(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  function fmtClock(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(11, 19) + " UTC";
  }

  fetch("/data/deaths.json")
    .then((r) => r.json())
    .then((data) => {
      const note = document.getElementById("deaths-updated");
      const items = (data.items || []).slice().sort(function (a, b) {
        return String(a.at || "").localeCompare(String(b.at || ""));
      });
      if (note && data.updated) {
        note.textContent =
          (data.sample ? "Sample · " : "") +
          items.length +
          " deaths · oldest → newest · updated " +
          data.updated.replace("T", " ").replace("Z", " UTC");
      }
      if (!items.length) {
        root.innerHTML = "<p class='lede'>No deaths in the log dump yet. Anarchy will fix that.</p>";
        return;
      }
      const nodes = items
        .map((e) => {
          const name = esc(e.name || "");
          const msg = esc(e.message || "");
          const href = "/player/" + encodeURIComponent(e.name || "") + "/";
          const title = name + " " + msg + " · " + fmtDay(e.at) + " " + fmtClock(e.at);
          return (
            '<article class="death-node" role="listitem" title="' +
            title +
            '">' +
            '<p class="death-msg"><a href="' +
            href +
            '">' +
            name +
            "</a> " +
            msg +
            "</p>" +
            '<div class="death-dot"><img src="' +
            NR.heads +
            "/" +
            encodeURIComponent(e.name) +
            '/40" alt="" width="40" height="40"></div>' +
            '<time datetime="' +
            esc(e.at || "") +
            '"><span>' +
            esc(fmtDay(e.at)) +
            "</span><span>" +
            esc(fmtClock(e.at)) +
            "</span></time>" +
            "</article>"
          );
        })
        .join("");
      root.innerHTML = '<div class="death-track" role="list">' + nodes + "</div>";
      // Land on the newest (right) end of the chronological axis.
      requestAnimationFrame(function () {
        root.scrollLeft = root.scrollWidth;
      });
    })
    .catch(() => {
      root.innerHTML = "<p>Could not load deaths.json.</p>";
    });
})();
