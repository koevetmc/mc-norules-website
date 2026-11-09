/* 2026-11-08 later: compact top-of-page death strip.
   Axis = server UTC days. Each death is a tick + tiny head. Hover = how they died.
   No coordinates. */
(function () {
  const root = document.getElementById("deaths");
  if (!root) return;
  const NR = window.NR || { heads: "https://mc-heads.net/avatar" };
  const DAY = 86400000;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function utcDay(ms) {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  function dayLabel(ms) {
    const d = new Date(ms);
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return m + "/" + day;
  }

  function stamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || "");
    return d.toISOString().slice(0, 19).replace("T", " ") + " UTC";
  }

  fetch("/data/deaths.json")
    .then((r) => r.json())
    .then((data) => {
      const items = (data.items || []).slice().sort(function (a, b) {
        return String(a.at || "").localeCompare(String(b.at || ""));
      });
      if (!items.length) {
        root.innerHTML = "<p class='death-strip-empty'>No deaths yet.</p>";
        return;
      }
      const t0 = utcDay(Date.parse(items[0].at));
      const tLast = utcDay(Date.parse(items[items.length - 1].at));
      const nDays = Math.max(1, Math.round((tLast - t0) / DAY) + 1);
      const tEnd = t0 + nDays * DAY;
      const span = tEnd - t0;

      function pct(ms) {
        return ((ms - t0) / span) * 100;
      }

      const days = [];
      for (let i = 0; i < nDays; i++) {
        const ms = t0 + i * DAY;
        const p = pct(ms);
        const edge = i === 0 || i === nDays - 1;
        const major = edge || i % 3 === 0;
        days.push(
          '<span class="death-day' +
            (edge ? " death-day-end" : "") +
            (major ? " death-day-major" : " death-day-minor") +
            '" style="left:' +
            p.toFixed(3) +
            '%">' +
            dayLabel(ms) +
            "</span>"
        );
      }

      const marks = items.map(function (e, i) {
        const ms = Date.parse(e.at);
        const p = pct(Number.isNaN(ms) ? t0 : ms);
        const name = esc(e.name || "");
        const msg = esc(e.message || "");
        const when = esc(stamp(e.at));
        const tip = name + " " + msg + " · " + when;
        const href = "/player/" + encodeURIComponent(e.name || "") + "/";
        const edge = p < 12 ? " death-mark-start" : p > 88 ? " death-mark-end" : "";
        return (
          '<a class="death-mark' +
            edge +
            '" href="' +
            href +
            '" style="left:' +
            p.toFixed(3) +
            "%;z-index:" +
            (i + 1) +
            '" title="' +
            tip +
            '" aria-label="' +
            tip +
            '"><i></i><img src="' +
            NR.heads +
            "/" +
            encodeURIComponent(e.name) +
            '/16" alt="" width="16" height="16"><span class="death-tip">' +
            name +
            " " +
            msg +
            "<br>" +
            when +
            "</span></a>"
        );
      });

      root.innerHTML =
        '<div class="death-axis-pad"><div class="death-line"></div>' +
        days.join("") +
        marks.join("") +
        "</div>";
      // Headless screenshot helper: /?death-tip opens the newest mark's how-they-died tip.
      if (new URLSearchParams(location.search).has("death-tip")) {
        const last = root.querySelector(".death-mark:last-of-type");
        if (last) last.classList.add("is-open");
      }
    })
    .catch(() => {
      root.innerHTML = "<p class='death-strip-empty'>Could not load deaths.</p>";
    });
})();
