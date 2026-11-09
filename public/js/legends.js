/* 2026-11-03: Hall of Legends grid from /data/legends.json (24 plugin keys).
   2026-11-08: CSS 3D statue ring in front of the same 24 boards. No WebGL.
   Reduced-motion hides the ring (CSS) and keeps the list. */
(function () {
  const root = document.getElementById("legends");
  if (!root) return;
  const NR = window.NR;
  const world = document.getElementById("hall-world");
  const view = document.getElementById("hall-view");
  const indexEl = document.getElementById("hall-index");
  const detail = document.getElementById("hall-detail");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fillTop10(list, cat) {
    list.innerHTML = "";
    const entries = Array.isArray(cat.entries) ? cat.entries : [];
    if (!entries.length) {
      const li = document.createElement("li");
      li.textContent = "unclaimed — be the first";
      li.style.gridTemplateColumns = "1fr";
      list.appendChild(li);
      return;
    }
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

  function paintGrid(order, cats) {
    root.innerHTML = "";
    order.forEach((key) => {
      const cat = cats[key];
      if (!cat) return;
      const entries = Array.isArray(cat.entries) ? cat.entries : [];
      const top = entries[0];
      const card = document.createElement("article");
      card.className = "legend-card" + (top ? "" : " unclaimed");
      card.id = "board-" + key;

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
      fillTop10(list, cat);

      btn.addEventListener("click", () => {
        const open = card.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
      });

      card.append(btn, list);
      root.appendChild(card);
    });
  }

  function paintHall(order, cats) {
    if (!world || !view || reduce) return;
    const n = order.length;
    const step = 360 / Math.max(n, 1);
    let rot = 18;
    let selected = 0;
    let dragging = false;
    let lastX = 0;
    let auto = true;
    const statues = [];
    const chips = [];

    world.innerHTML = '<div class="hall-floor" aria-hidden="true"></div>';
    if (indexEl) indexEl.innerHTML = "";

    order.forEach((key, i) => {
      const cat = cats[key];
      if (!cat) return;
      const top = (cat.entries || [])[0];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hall-statue";
      btn.style.setProperty("--a", i * step + "deg");
      btn.dataset.i = String(i);
      const plinth = document.createElement("div");
      plinth.className = "hall-plinth";
      const img = document.createElement("img");
      img.width = 64;
      img.height = 64;
      img.alt = "";
      img.src = top
        ? NR.heads + "/" + encodeURIComponent(top.name) + "/64"
        : "/img/icon-32.png";
      const plaque = document.createElement("p");
      plaque.className = "hall-plaque";
      plaque.textContent = cat.title || key;
      const who = document.createElement("p");
      who.className = "hall-who";
      who.textContent = top ? top.name : "unclaimed";
      btn.append(plinth, img, plaque, who);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        auto = false;
        select(i, true);
      });
      world.appendChild(btn);
      statues.push(btn);

      if (indexEl) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.textContent = cat.title || key;
        chip.addEventListener("click", () => {
          auto = false;
          select(i, true);
        });
        indexEl.appendChild(chip);
        chips.push(chip);
      }
    });

    function apply() {
      world.style.setProperty("--hall-rot", rot + "deg");
    }

    function select(i, spinTo) {
      selected = i;
      statues.forEach((el, j) => el.classList.toggle("is-on", j === i));
      chips.forEach((el, j) => el.classList.toggle("is-on", j === i));
      if (spinTo) rot = -i * step + 18;
      apply();
      const key = order[i];
      const cat = cats[key];
      if (!detail || !cat) return;
      const top = (cat.entries || [])[0];
      detail.innerHTML = "";
      const h = document.createElement("h3");
      h.textContent = cat.title || key;
      const p = document.createElement("p");
      p.className = "lede";
      p.style.margin = "0 0 0.4rem";
      p.textContent = top
        ? top.name + " · " + window.nrFormatStat(cat.format, top.value, cat.unit)
        : "unclaimed — be the first";
      const ol = document.createElement("ol");
      ol.className = "top10";
      fillTop10(ol, cat);
      detail.append(h, p, ol);
    }

    function onDown(e) {
      dragging = true;
      auto = false;
      lastX = e.clientX;
      view.classList.add("is-drag");
      view.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      rot += (e.clientX - lastX) * 0.35;
      lastX = e.clientX;
      apply();
    }
    function onUp(e) {
      dragging = false;
      view.classList.remove("is-drag");
      try {
        view.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    view.addEventListener("pointerdown", onDown);
    view.addEventListener("pointermove", onMove);
    view.addEventListener("pointerup", onUp);
    view.addEventListener("pointercancel", onUp);
    view.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        auto = false;
        rot += e.deltaY * 0.12;
        apply();
      },
      { passive: false }
    );

    const prev = document.querySelector("[data-hall-prev]");
    const next = document.querySelector("[data-hall-next]");
    if (prev) prev.addEventListener("click", () => { auto = false; select((selected - 1 + n) % n, true); });
    if (next) next.addEventListener("click", () => { auto = false; select((selected + 1) % n, true); });

    let last = performance.now();
    function tick(now) {
      if (auto && !dragging) {
        const dt = Math.min(32, now - last);
        rot += dt * 0.008;
        apply();
      }
      last = now;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    select(0, true);
    auto = true;
  }

  fetch("/data/legends.json")
    .then((r) => r.json())
    .then((data) => {
      const updated = document.getElementById("legends-updated");
      if (updated && data.updated) {
        updated.textContent = "Updated " + data.updated.replace("T", " ").replace("Z", " UTC");
        if (data.sample) updated.textContent += " · sample data";
      }
      const cats = data.categories || {};
      const order = (data.order || Object.keys(cats)).filter((k) => cats[k]);
      paintGrid(order, cats);
      paintHall(order, cats);
    })
    .catch(() => {
      root.innerHTML = "<p class='lede'>Could not load legends.json.</p>";
    });
})();
