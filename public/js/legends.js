/* 2026-11-03: Hall of Legends grid. Reads /data/legends.json (same 24 keys as the in-game plugin). */
(function () {
  const root = document.getElementById("legends");
  if (!root) return;
  const NR = window.NR;

  fetch("/data/legends.json")
    .then((r) => r.json())
    .then((data) => {
      const updated = document.getElementById("legends-updated");
      if (updated && data.updated) {
        updated.textContent = "Updated " + data.updated.replace("T", " ").replace("Z", " UTC");
        if (data.sample) updated.textContent += " · sample data";
      }
      const cats = data.categories || {};
      const order = data.order || Object.keys(cats);
      root.innerHTML = "";
      order.forEach((key) => {
        const cat = cats[key];
        if (!cat) return;
        const entries = Array.isArray(cat.entries) ? cat.entries : [];
        const top = entries[0];
        const card = document.createElement("article");
        card.className = "legend-card" + (top ? "" : " unclaimed");

        const btn = document.createElement("button");
        btn.className = "legend-head";
        btn.type = "button";
        btn.setAttribute("aria-expanded", "false");
        const aid = "top10-" + key;
        btn.setAttribute("aria-controls", aid);

        const img = document.createElement("img");
        img.width = 48;
        img.height = 48;
        img.alt = "";
        if (top) {
          img.src = NR.heads + "/" + encodeURIComponent(top.name) + "/64";
        } else {
          img.src = "/img/icon-32.png";
          img.alt = "unclaimed";
        }

        const meta = document.createElement("div");
        meta.className = "legend-meta";
        const title = document.createElement("div");
        title.className = "legend-cat";
        title.textContent = cat.title || key;
        const name = document.createElement("div");
        name.className = "legend-name";
        if (top) {
          const a = document.createElement("a");
          a.href = "/player/" + encodeURIComponent(top.name) + "/";
          a.textContent = top.name;
          name.appendChild(a);
        } else {
          name.textContent = "unclaimed — be the first";
        }
        const stat = document.createElement("div");
        stat.className = "legend-stat";
        stat.textContent = top ? window.nrFormatStat(cat.format, top.value, cat.unit) : "no statue yet";
        meta.append(title, name, stat);
        btn.append(img, meta);

        const list = document.createElement("ol");
        list.className = "top10";
        list.id = aid;
        if (!entries.length) {
          const li = document.createElement("li");
          li.textContent = "unclaimed — be the first";
          li.style.gridTemplateColumns = "1fr";
          list.appendChild(li);
        } else {
          entries.slice(0, 10).forEach((e, i) => {
            const li = document.createElement("li");
            const head = document.createElement("img");
            head.src = NR.heads + "/" + encodeURIComponent(e.name) + "/32";
            head.alt = "";
            head.width = 20;
            head.height = 20;
            const who = document.createElement("a");
            who.href = "/player/" + encodeURIComponent(e.name) + "/";
            who.textContent = e.name;
            const val = document.createElement("span");
            val.textContent = window.nrFormatStat(cat.format, e.value, cat.unit);
            const rank = document.createElement("span");
            rank.className = "rank";
            rank.textContent = String(i + 1);
            li.append(rank, head, who, val);
            list.appendChild(li);
          });
        }

        btn.addEventListener("click", () => {
          const open = card.classList.toggle("open");
          btn.setAttribute("aria-expanded", String(open));
        });

        card.append(btn, list);
        root.appendChild(card);
      });
    })
    .catch(() => {
      root.innerHTML = "<p class='lede'>Could not load legends.json.</p>";
    });
})();
