/* 2026-11-09: spaced day-column timeline. Hover/tap fills a detail tray
   (victim, how they died, killer if it was a player). No piled 16px heads.
   No coordinates. */
(function () {
  const root = document.getElementById("deaths");
  const tray = document.getElementById("death-tray");
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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }

  function whenLabel(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || "");
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  }

  function killerOf(msg) {
    const m = String(msg || "").match(/\bby (.+)$/i);
    if (!m) return "";
    return m[1].replace(/\s+while trying to escape.*$/i, "").trim();
  }

  function headUrl(name) {
    return NR.heads + "/" + encodeURIComponent(name) + "/32";
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

      // 2026-11-09: kicker carries the real count so the fold shows 147, not a crop.
      const kicker = document.querySelector(".death-strip-kicker");
      if (kicker) kicker.textContent = "Deaths · " + items.length;
      const strip = document.getElementById("killfeed");
      if (strip) strip.setAttribute("data-death-count", String(items.length));

      const names = {};
      items.forEach(function (e) {
        if (e.name) names[e.name] = true;
      });

      const t0 = utcDay(Date.parse(items[0].at));
      const tLast = utcDay(Date.parse(items[items.length - 1].at));
      const nDays = Math.max(1, Math.round((tLast - t0) / DAY) + 1);
      const buckets = [];
      for (let i = 0; i < nDays; i++) buckets.push([]);
      items.forEach(function (e, idx) {
        const ms = Date.parse(e.at);
        const i = Math.max(0, Math.min(nDays - 1, Math.round((utcDay(ms) - t0) / DAY)));
        e._i = idx;
        buckets[i].push(e);
      });

      let selected = items[items.length - 1];

      function paintTray(e) {
        if (!tray || !e) return;
        selected = e;
        const killer = killerOf(e.message);
        const pvp = killer && names[killer];
        const href = "/player/" + encodeURIComponent(e.name || "") + "/";
        tray.innerHTML =
          '<a class="death-tray-who" href="' +
          href +
          '"><img src="' +
          headUrl(e.name) +
          '" alt="" width="32" height="32"><strong>' +
          esc(e.name) +
          "</strong></a>" +
          '<p class="death-tray-msg">' +
          esc(e.message || "") +
          "</p>" +
          (pvp
            ? '<a class="death-tray-killer" href="/player/' +
              encodeURIComponent(killer) +
              '/"><img src="' +
              headUrl(killer) +
              '" alt="" width="24" height="24"> ' +
              esc(killer) +
              "</a>"
            : killer
              ? '<span class="death-tray-mob">' + esc(killer) + "</span>"
              : "") +
          '<time datetime="' +
          esc(e.at) +
          '">' +
          esc(whenLabel(e.at)) +
          "</time>";
        root.querySelectorAll(".death-tick").forEach(function (btn) {
          btn.classList.toggle("is-on", Number(btn.getAttribute("data-i")) === e._i);
        });
      }

      const cols = buckets
        .map(function (list, i) {
          const ms = t0 + i * DAY;
          // Every death in the JSON is a tick. Dense days wrap; nothing is +N cropped.
          const ticks = list
            .map(function (e) {
              const killer = killerOf(e.message);
              const pvp = killer && names[killer];
              const label = esc(e.name) + " " + esc(e.message || "");
              return (
                '<button class="death-tick' +
                (pvp ? " is-pvp" : "") +
                '" type="button" data-i="' +
                e._i +
                '" aria-label="' +
                label +
                '"><img src="' +
                headUrl(e.name) +
                '" alt="" width="16" height="16"></button>'
              );
            })
            .join("");
          if (!list.length) return "";
          return (
            '<div class="death-col" data-day="' +
            i +
            '"><span class="death-col-date">' +
            dayLabel(ms) +
            '</span><div class="death-stack">' +
            ticks +
            '</div><span class="death-col-n">' +
            list.length +
            "</span></div>"
          );
        })
        .join("");

      root.innerHTML = '<div class="death-days">' + cols + "</div>";
      root.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".death-tick");
        if (!btn) return;
        const e = items[Number(btn.getAttribute("data-i"))];
        if (e) paintTray(e);
      });
      root.addEventListener("mouseover", function (ev) {
        const btn = ev.target.closest(".death-tick");
        if (!btn) return;
        const e = items[Number(btn.getAttribute("data-i"))];
        if (e) paintTray(e);
      });
      paintTray(selected);
      if (new URLSearchParams(location.search).has("death-tip")) {
        const last = root.querySelector(".death-tick:last-of-type");
        if (last) last.classList.add("is-on");
      }
    })
    .catch(() => {
      root.innerHTML = "<p class='death-strip-empty'>Could not load deaths.</p>";
    });
})();
