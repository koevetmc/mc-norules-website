/* 2026-11-08: sortable leaderboards from live vanilla stats (players.json + catalog).
   No fake rows. Vote counts are not a board. */
(function () {
  const tableRoot = document.getElementById("rank-table");
  const tabs = document.getElementById("rank-tabs");
  const boardsEl = document.getElementById("rank-boards");
  const note = document.getElementById("rank-updated");
  const firstsEl = document.getElementById("rank-firsts");
  if (!tableRoot || !tabs) return;
  const NR = window.NR;

  const GROUP_ORDER = ["combat", "survival", "movement", "gather"];

  Promise.all([
    fetch("/data/players.json").then((r) => r.json()),
    fetch("/data/stats-catalog.json").then((r) => r.json()),
    fetch("/data/firsts.json").then((r) => r.json()).catch(() => ({ claims: [] })),
  ])
    .then(([playersDoc, catalog, firstsDoc]) => {
      if (note) {
        note.textContent =
          (playersDoc.sample ? "Sample · " : "Live · ") +
          window.nrWhen(playersDoc.updated);
      }
      const players = playersDoc.players || [];
      const stats = catalog.stats || [];
      const groups = catalog.groups || [];
      const groupTitle = {};
      groups.forEach((g) => {
        groupTitle[g.id] = g.title;
      });

      let group = "combat";
      let boardId = "kills";
      let sortDir = -1;

      function boardsFor(g) {
        return stats.filter((s) => s.group === g);
      }

      function rowsFor(id) {
        const rows = [];
        players.forEach((p) => {
          const v = p.stats && p.stats[id];
          const n = Number(v) || 0;
          if (n <= 0) return;
          rows.push({ name: p.name, value: n, bedrock: !!p.bedrock });
        });
        rows.sort((a, b) => (a.value - b.value) * sortDir || a.name.localeCompare(b.name));
        return rows;
      }

      function renderTabs() {
        tabs.innerHTML = "";
        GROUP_ORDER.forEach((gid) => {
          const g = groups.find((x) => x.id === gid) || { id: gid, title: gid };
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "filter-btn";
          btn.textContent = g.title;
          btn.setAttribute("aria-pressed", String(gid === group));
          btn.addEventListener("click", () => {
            group = gid;
            const list = boardsFor(group);
            boardId = list.length ? list[0].id : boardId;
            render();
          });
          tabs.appendChild(btn);
        });
      }

      function renderBoards() {
        boardsEl.innerHTML = "";
        boardsFor(group).forEach((s) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "filter-btn";
          btn.textContent = s.title;
          btn.setAttribute("aria-pressed", String(s.id === boardId));
          btn.addEventListener("click", () => {
            boardId = s.id;
            sortDir = -1;
            render();
          });
          boardsEl.appendChild(btn);
        });
      }

      function renderTable() {
        const meta = stats.find((s) => s.id === boardId) || { title: boardId, format: "count", unit: "" };
        const rows = rowsFor(boardId);
        const thead =
          "<thead><tr>" +
          "<th>#</th><th>Player</th>" +
          '<th><button type="button" class="rank-sort" data-sort>Value ' +
          (sortDir < 0 ? "↓" : "↑") +
          "</button></th>" +
          "</tr></thead>";
        const body = rows
          .map((r, i) => {
            const safe = r.name.replace(/</g, "");
            return (
              "<tr>" +
              '<td class="rank">' +
              (i + 1) +
              "</td>" +
              "<td><a class='rank-player' href='/player/" +
              encodeURIComponent(r.name) +
              "/'><img src='" +
              NR.heads +
              "/" +
              encodeURIComponent(r.name) +
              "/32' alt='' width='24' height='24'>" +
              safe +
              "</a></td>" +
              "<td>" +
              window.nrFormatStat(meta.format, r.value, meta.unit) +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
        tableRoot.innerHTML =
          "<h3>" +
          (meta.title || boardId) +
          " <span class='lede' style='font-weight:400'>· " +
          rows.length +
          " with a score</span></h3>" +
          "<table class='rank-table'>" +
          thead +
          "<tbody>" +
          (body || "<tr><td colspan='3'>Nobody has this stat yet.</td></tr>") +
          "</tbody></table>";
        const sortBtn = tableRoot.querySelector("[data-sort]");
        if (sortBtn) {
          sortBtn.addEventListener("click", () => {
            sortDir *= -1;
            renderTable();
          });
        }
      }

      function renderFirsts() {
        if (!firstsEl) return;
        const claims = firstsDoc.claims || [];
        if (!claims.length) {
          firstsEl.innerHTML = "<p class='lede'>No Server Firsts claimed yet.</p>";
          return;
        }
        firstsEl.innerHTML =
          "<table class='rank-table'><thead><tr><th>First</th><th>Player</th><th>When</th></tr></thead><tbody>" +
          claims
            .map((c) => {
              const when = (c.when || "").replace("T", " ").replace("Z", " UTC");
              const extra = c.detail ? " — " + String(c.detail).replace(/</g, "") : "";
              return (
                "<tr><td>" +
                String(c.title || c.key).replace(/</g, "") +
                "</td><td><a href='/player/" +
                encodeURIComponent(c.name) +
                "/'>" +
                String(c.name || "").replace(/</g, "") +
                "</a>" +
                extra +
                "</td><td>" +
                when +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table>";
      }

      function render() {
        renderTabs();
        renderBoards();
        renderTable();
      }

      render();
      renderFirsts();
    })
    .catch(() => {
      tableRoot.innerHTML = "<p>Could not load rankings.</p>";
    });
})();
