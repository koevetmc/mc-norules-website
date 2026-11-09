/* 2026-11-06: sign-in and /link redeem. Shows only the signed-in account. */
(function () {
  const msg = document.getElementById("form-msg");

  function say(text, bad) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("bad", Boolean(bad));
  }

  if (new URLSearchParams(location.search).get("e") === "link") {
    say("That sign-in link expired or was already used.", true);
  }

  const login = document.getElementById("login-form");
  if (login) {
    login.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      say("Sending…");
      const email = document.getElementById("email").value;
      let res;
      let data = {};
      try {
        res = await fetch("/api/auth/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email }),
        });
        data = await res.json();
      } catch {
        say("Could not reach the site.", true);
        return;
      }
      if (!res.ok) {
        say(data.error || "Could not send the link.", true);
        return;
      }
      say(data.message || "Check your inbox.");
      if (data.devLink) {
        const br = document.createElement("br");
        const a = document.createElement("a");
        a.href = data.devLink;
        a.textContent = "Open local sign-in link";
        msg.appendChild(br);
        msg.appendChild(a);
      }
    });
    return;
  }

  const dash = document.getElementById("dash");
  if (!dash) return;
  let csrf = "";
  const RANKS = [
    ["Pit Dog", 0], ["Brawler", 3], ["Bloodletter", 8], ["Warrior", 15],
    ["Myrmidon", 25], ["Champion", 40], ["Grand Champion", 60],
  ];

  async function refresh() {
    let res;
    let data;
    try {
      res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
      if (res.status === 401) {
        location.href = "/login.html";
        return;
      }
      data = await res.json();
    } catch {
      const live = document.getElementById("d-live");
      if (live) live.classList.add("stale");
      return;
    }
    if (!data || !data.ok) return;
    csrf = data.csrf || csrf;
    paint(data);
    paintPolls(await loadPolls());
    loadMap(data);
    const live = document.getElementById("d-live");
    if (live) live.classList.remove("stale");
  }

  async function loadPolls() {
    try {
      const res = await fetch("/api/polls", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.polls || [];
    } catch {
      return [];
    }
  }

  const linkForm = document.getElementById("link-form");
  if (linkForm) {
    linkForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      say("Checking code…");
      const code = document.getElementById("code").value;
      let res;
      let data = {};
      try {
        res = await fetch("/api/link/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ code, csrf }),
        });
        data = await res.json();
      } catch {
        say("Could not reach the site.", true);
        return;
      }
      if (!res.ok) {
        say(data.error || "Could not link.", true);
        return;
      }
      say("Linked. Stats will catch up in a few seconds.");
      refresh();
    });
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== text) {
      el.textContent = text;
      const card = el.closest(".stat-card");
      if (card) {
        card.classList.add("tick");
        setTimeout(() => card.classList.remove("tick"), 700);
      }
    }
  }

  function paint(data) {
    dash.hidden = false;
    const name = data.linked ? (data.mcName || "Linked") : "Not linked";
    setText("d-name", name);
    const email = document.getElementById("d-email");
    if (email) email.textContent = data.email || "";
    const uuid = document.getElementById("d-uuid");
    if (uuid) uuid.textContent = data.linked ? data.mcUuid : "Run /link in game, then enter the code below.";
    const avatar = document.getElementById("d-avatar");
    if (avatar && data.mcUuid) avatar.src = "https://mc-heads.net/avatar/" + data.mcUuid + "/84";
    const relink = document.getElementById("relink");
    if (relink) relink.open = !data.linked;
    const s = data.stats;
    if (!s) {
      ["s-play", "s-deaths", "s-pkills", "s-mkills", "s-arena", "s-waves", "s-endless", "s-when"].forEach((id) => setText(id, "—"));
      paintRank(0);
    } else {
      const hours = (Number(s.play_ticks) || 0) / 72000;
      setText("s-play", hours >= 1 ? hours.toFixed(1) + "h" : Math.round(hours * 60) + "m");
      setText("s-deaths", String(s.deaths ?? 0));
      setText("s-pkills", String(s.player_kills ?? 0));
      setText("s-mkills", String(s.mob_kills ?? 0));
      setText("s-arena", (s.arena_wins ?? 0) + "–" + (s.arena_losses ?? 0));
      setText("s-waves", String(s.arena_waves ?? 0));
      setText("s-endless", String(s.endless_best ?? 0));
      setText("s-when", s.updated_at ? new Date(s.updated_at * 1000).toLocaleTimeString() : "—");
      paintRank(s.arena_wins || 0);
    }
  }

  function paintRank(wins) {
    let cur = RANKS[0], nxt = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (wins >= RANKS[i][1]) {
        cur = RANKS[i];
        nxt = RANKS[i + 1] || null;
      }
    }
    const line = document.getElementById("d-rank");
    if (line) line.textContent = cur[0];
    const bar = document.getElementById("rank-bar");
    const fill = document.getElementById("rank-fill");
    const next = document.getElementById("d-rank-next");
    if (!nxt) {
      if (bar) bar.hidden = true;
      if (next) next.textContent = "Top rank.";
      return;
    }
    const span = nxt[1] - cur[1];
    const have = Math.max(0, wins - cur[1]);
    if (bar) bar.hidden = false;
    if (fill) fill.style.width = Math.min(100, (have / span) * 100) + "%";
    if (next) next.textContent = have + " / " + span + " wins to " + nxt[0];
  }

  function paintPolls(polls) {
    const box = document.getElementById("polls");
    if (!box) return;
    if (!polls.length) {
      box.innerHTML = "<p class=\"form-msg\">No open polls. An op opens one with /poll Question? | Yes | No</p>";
      return;
    }
    box.innerHTML = "";
    polls.forEach((poll) => {
      const wrap = document.createElement("div");
      wrap.className = "poll";
      const h = document.createElement("h4");
      h.textContent = poll.title;
      wrap.appendChild(h);
      const total = poll.options.reduce((n, o) => n + o.votes, 0) || 1;
      poll.options.forEach((o) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "poll-opt";
        btn.textContent = o.label + "  " + o.votes;
        if (poll.mine === o.idx) btn.setAttribute("aria-pressed", "true");
        btn.addEventListener("click", () => cast(poll.id, o.idx));
        const bar = document.createElement("div");
        bar.className = "poll-bar";
        const span = document.createElement("span");
        span.style.width = Math.round((o.votes / total) * 100) + "%";
        bar.appendChild(span);
        wrap.appendChild(btn);
        wrap.appendChild(bar);
      });
      box.appendChild(wrap);
    });
  }

  async function cast(pollId, option) {
    const res = await fetch("/api/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ csrf, pollId, option }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) paintPolls(data.polls || []);
    else say(data.error || "Vote failed.", true);
  }

  const logout = document.getElementById("logout");
  if (logout) {
    logout.addEventListener("click", async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ csrf }),
      });
      location.href = "/login.html";
    });
  }

  const MAP_WORLDS = [
    ["world", "Overworld"],
    ["world_nether", "Nether"],
    ["world_the_end", "End"],
  ];
  let mapWorld = "world";
  let mapCamX = 0;
  let mapCamZ = 0;
  let mapScale = 2;
  let mapCamSet = false;
  const mapImages = new Map();
  let mapMarks = [];
  let mapSelf = null;

  function bindMap() {
    const canvas = document.getElementById("explore-map");
    if (!canvas || canvas.dataset.bound) return;
    canvas.dataset.bound = "1";
    canvas.addEventListener("pointerdown", (ev) => {
      canvas.setPointerCapture(ev.pointerId);
      canvas.dataset.drag = "1";
      canvas.dataset.px = String(ev.clientX);
      canvas.dataset.pz = String(ev.clientY);
    });
    canvas.addEventListener("pointermove", (ev) => {
      if (canvas.dataset.drag !== "1") return;
      const dx = ev.clientX - Number(canvas.dataset.px);
      const dy = ev.clientY - Number(canvas.dataset.pz);
      canvas.dataset.px = String(ev.clientX);
      canvas.dataset.pz = String(ev.clientY);
      mapCamX -= dx / mapScale;
      mapCamZ -= dy / mapScale;
      drawMap(mapMarks);
      drawSelf(mapSelf);
    });
    canvas.addEventListener("pointerup", () => { canvas.dataset.drag = "0"; });
    canvas.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      mapScale = Math.min(8, Math.max(0.35, mapScale * (ev.deltaY < 0 ? 1.15 : 0.87)));
      drawMap(mapMarks);
      drawSelf(mapSelf);
    }, { passive: false });
  }

  async function loadMap(data) {
    bindMap();
    const tabs = document.getElementById("explore-worlds");
    if (tabs && !tabs.childElementCount) {
      MAP_WORLDS.forEach(([id, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.dataset.world = id;
        b.addEventListener("click", () => {
          mapWorld = id;
          mapCamSet = false;
          loadMap(data);
        });
        tabs.appendChild(b);
      });
    }
    if (tabs) tabs.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.world === mapWorld));
    });
    let tiles = [];
    try {
      const res = await fetch("/api/map/index?world=" + encodeURIComponent(mapWorld), {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.ok) tiles = (await res.json()).tiles || [];
    } catch { /* keep the last frame */ }
    const here = (data && data.waypoints ? data.waypoints : []).filter((m) => m.world === mapWorld);
    if (!mapCamSet) {
      const self = data && data.self && data.self.world === mapWorld ? data.self : null;
      if (self) {
        mapCamX = self.x;
        mapCamZ = self.z;
      } else if (here.length) {
        mapCamX = here.reduce((n, m) => n + m.x, 0) / here.length;
        mapCamZ = here.reduce((n, m) => n + m.z, 0) / here.length;
      } else if (tiles.length) {
        mapCamX = tiles[0].tx * 128 + 64;
        mapCamZ = tiles[0].tz * 128 + 64;
      }
      mapCamSet = true;
    }
    await Promise.all(tiles.map(async (t) => {
      const key = mapWorld + ":" + t.tx + ":" + t.tz;
      const prev = mapImages.get(key);
      if (prev && prev.updated === t.updated_at) return;
      const imgRes = await fetch(
        "/api/map/tile?world=" + encodeURIComponent(mapWorld) + "&tx=" + t.tx + "&tz=" + t.tz,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!imgRes.ok) return;
      const img = new Image();
      img.src = URL.createObjectURL(await imgRes.blob());
      try { await img.decode(); } catch { return; }
      if (prev && prev.img && prev.img.src.startsWith("blob:")) URL.revokeObjectURL(prev.img.src);
      mapImages.set(key, { updated: t.updated_at, img, tx: t.tx, tz: t.tz });
    }));
    mapMarks = data && data.waypoints ? data.waypoints : [];
    mapSelf = data && data.self ? data.self : null;
    paintMarkList(mapMarks);
    drawMap(mapMarks);
    drawSelf(mapSelf);
  }

  function drawMap(waypoints) {
    const canvas = document.getElementById("explore-map");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#070605";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    for (const [key, tile] of mapImages) {
      if (!key.startsWith(mapWorld + ":")) continue;
      const sx = (tile.tx * 128 - mapCamX) * mapScale + w / 2;
      const sy = (tile.tz * 128 - mapCamZ) * mapScale + h / 2;
      ctx.drawImage(tile.img, sx, sy, 128 * mapScale, 128 * mapScale);
    }
    const shown = (waypoints || []).filter((m) => m.world === mapWorld);
    ctx.font = "13px Outfit, sans-serif";
    ctx.textBaseline = "bottom";
    shown.forEach((m) => {
      const x = (m.x - mapCamX) * mapScale + w / 2;
      const y = (m.z - mapCamZ) * mapScale + h / 2;
      ctx.fillStyle = "#ffba08";
      ctx.beginPath();
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 9);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#efe6d8";
      ctx.fillText(m.name, x + 10, y - 2);
    });
  }

  function paintMarkList(waypoints) {
    const list = document.getElementById("mark-list");
    if (!list) return;
    const shown = (waypoints || []).filter((m) => m.world === mapWorld);
    list.innerHTML = "";
    if (!shown.length) {
      const li = document.createElement("li");
      li.textContent = "No marks in this world. /wp add while you play.";
      list.appendChild(li);
      return;
    }
    shown.forEach((m) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = m.name + "  " + Math.round(m.x) + " " + Math.round(m.y) + " " + Math.round(m.z);
      btn.addEventListener("click", () => {
        mapCamX = m.x;
        mapCamZ = m.z;
        mapScale = Math.max(mapScale, 2);
        drawMap(waypoints);
        drawSelf(mapSelf);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function drawSelf(self) {
    if (!self || self.world !== mapWorld) return;
    const canvas = document.getElementById("explore-map");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const x = (self.x - mapCamX) * mapScale + canvas.width / 2;
    const y = (self.z - mapCamZ) * mapScale + canvas.height / 2;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 8000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
