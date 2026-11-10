/* 2026-11-03: shared chrome — nav, copy-IP, live status, toast, logo hover. */
(function () {
  const NR = window.NR || {};
  const ip = NR.javaHost || "76.176.218.251";

  // Inline the SVG so header hover can light ember veins (img cannot).
  const slots = document.querySelectorAll(".logo-slot");
  if (slots.length) {
    fetch("/img/logo.svg")
      .then((r) => r.text())
      .then((svg) => {
        slots.forEach((el) => {
          el.innerHTML = svg;
        });
      })
      .catch(() => {});
  }

  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // 2026-11-09: More dropdown for Join / Media / Log / Account.
  const more = document.querySelector(".nav-more");
  const moreBtn = more && more.querySelector(":scope > button");
  if (more && moreBtn) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = more.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", () => {
      more.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    });
  }

  const here = location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll(".site-nav a").forEach((a) => {
    const href = a.getAttribute("href").replace(/\/+$/, "") || "/";
    if (href === here || (href !== "/" && here.startsWith(href.replace(".html", "")))) {
      a.setAttribute("aria-current", "page");
    }
  });

  const toast = document.getElementById("toast");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }
  window.nrToast = showToast;

  const port = NR.bedrockPort || 19132;
  let edition = "java";

  document.querySelectorAll("[data-copy-ip]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mode = btn.getAttribute("data-copy-ip");
      const bedrock = mode === "bedrock" || (mode === "auto" && edition === "bedrock");
      // Host is the same. Bedrock toast names port 19132 so Add Server is obvious.
      const text = ip;
      const note = bedrock ? "Copied · " + ip + " port " + port : "Copied · " + ip;
      const label = btn.textContent;
      try {
        await navigator.clipboard.writeText(text);
        showToast(note);
        btn.textContent = "Copied";
        clearTimeout(btn._nrCopy);
        btn._nrCopy = setTimeout(() => {
          btn.textContent = label;
        }, 1600);
      } catch {
        showToast("copy failed — " + ip);
      }
    });
  });

  // Java / Bedrock plaque on the homepage. Same host; Bedrock uses port 19132.
  const editionBtns = document.querySelectorAll("[data-edition]");
  const ipFaces = document.querySelectorAll("[data-ip-face]");
  const editionNote = document.querySelector("[data-edition-note]");
  function setEdition(next) {
    edition = next;
    editionBtns.forEach((b) => {
      const on = b.getAttribute("data-edition") === next;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
    ipFaces.forEach((el) => {
      el.textContent = next === "bedrock" ? ip + ":" + port : ip;
    });
    if (editionNote) {
      editionNote.textContent =
        next === "bedrock" ? "Add server. Port " + port + "." : "Direct connect. Default port 25565.";
    }
  }
  editionBtns.forEach((b) => {
    b.addEventListener("click", () => setEdition(b.getAttribute("data-edition")));
  });

  // Live count only. Cap 30 is the product, not a half-empty bar. Never list who is online.
  const statusEls = document.querySelectorAll("[data-status]");
  if (statusEls.length) {
    fetch(NR.statusApi, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        statusEls.forEach((el) => {
          const countEl = el.querySelector("[data-count]");
          const labelEl = el.querySelector("[data-label]");
          const max = data.players && data.players.max ? data.players.max : 30;
          if (data && data.online) {
            el.dataset.state = "online";
            const n = data.players && typeof data.players.online === "number" ? data.players.online : 0;
            if (countEl) countEl.textContent = String(n);
            if (labelEl) labelEl.textContent = "online · cap " + max;
          } else {
            el.dataset.state = "offline";
            if (countEl) countEl.textContent = "0";
            if (labelEl) labelEl.textContent = "offline · cap " + max;
          }
        });
      })
      .catch(() => {
        statusEls.forEach((el) => {
          el.dataset.state = "unknown";
          const labelEl = el.querySelector("[data-label]");
          if (labelEl) labelEl.textContent = "status unknown";
        });
      });
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // 2026-11-08: mark the document so CSS can gate extra motion.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("nr-reduce");
  } else {
    document.documentElement.classList.add("nr-motion");
  }

  // Headless screenshot helper: /?features hides the hero/gallery so the
  // ticker is in the first viewport (scrollIntoView is flaky in headless).
  if (new URLSearchParams(location.search).has("features")) {
    document.documentElement.classList.add("nr-shot-features");
  }
})();

/* 2026-11-08: cyan Navi-style fairy follows the mouse. One rAF, no canvas.
   Fine pointer + hover only — touch and reduced-motion never start it. */
(function () {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || reduce.matches) return;

  const root = document.createElement("div");
  root.className = "nr-fairy";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<span class="nr-fairy-glow"></span><span class="nr-fairy-core"></span>' +
    '<span class="nr-fairy-wing nr-fairy-wing-l"></span><span class="nr-fairy-wing nr-fairy-wing-r"></span>';
  document.body.appendChild(root);

  const sparks = [];
  for (let i = 0; i < 7; i++) {
    const el = document.createElement("span");
    el.className = "nr-fairy-spark";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    sparks.push({ el: el, x: 0, y: 0, life: 0 });
  }

  let tx = innerWidth * 0.5;
  let ty = innerHeight * 0.4;
  let x = tx;
  let y = ty;
  let dartT = 0;
  let dartX = 0;
  let dartY = 0;
  let sparkI = 0;
  let sparkWait = 0;
  let on = false;
  let raf = 0;

  function hide() {
    on = false;
    root.classList.remove("is-on");
  }

  function show() {
    if (on) return;
    on = true;
    root.classList.add("is-on");
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(t) {
    raf = 0;
    if (!on && !sparks.some(function (s) { return s.life > 0; })) return;

    const bob = Math.sin(t / 420) * 4;
    dartT -= 1;
    if (dartT <= 0) {
      dartT = 48 + Math.random() * 90;
      dartX = (Math.random() - 0.5) * 22;
      dartY = (Math.random() - 0.5) * 16 - 6;
    }
    dartX *= 0.92;
    dartY *= 0.92;
    // Hover just above-right of the pointer, like Navi beside Link — keep the OS cursor.
    const aimX = tx + 16 + dartX;
    const aimY = ty - 18 + dartY + bob;
    x += (aimX - x) * 0.16;
    y += (aimY - y) * 0.16;
    root.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";

    if (on) {
      sparkWait += 1;
      if (sparkWait >= 3) {
        sparkWait = 0;
        const s = sparks[sparkI++ % sparks.length];
        s.x = x + (Math.random() - 0.5) * 8;
        s.y = y + 5 + Math.random() * 5;
        s.life = 1;
      }
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (s.life <= 0) {
        s.el.style.opacity = "0";
        continue;
      }
      s.life -= 0.045;
      s.y += 0.35;
      s.el.style.opacity = String(Math.max(0, s.life));
      s.el.style.transform =
        "translate3d(" + s.x.toFixed(1) + "px," + s.y.toFixed(1) + "px,0) scale(" + (0.35 + s.life) + ")";
    }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      tx = e.clientX;
      ty = e.clientY;
      show();
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", hide);
  window.addEventListener(
    "pointerdown",
    function (e) {
      if (e.pointerType === "touch") hide();
    },
    { passive: true }
  );
  fine.addEventListener("change", function () {
    if (!fine.matches) hide();
  });
  reduce.addEventListener("change", function () {
    if (reduce.matches) hide();
  });

  // Headless screenshot helper: /?fairy parks the spark on the hero without a mouse.
  if (new URLSearchParams(location.search).has("fairy")) {
    tx = innerWidth * 0.62;
    ty = innerHeight * 0.38;
    x = tx;
    y = ty;
    show();
  }
})();

/** Format a Hall of Legends raw value the same way /legends does in-game. */
window.nrFormatStat = function (format, value, unit) {
  const n = Number(value) || 0;
  const u = unit || "";
  switch (format) {
    case "km":
      return (n / 100000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + " km";
    case "hours":
      return (n / 72000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + " hours";
    case "hearts":
      return Math.floor(n / 20).toLocaleString() + " hearts";
    case "life": {
      const min = Math.floor(n / 1200);
      return min >= 60
        ? Math.floor(min / 60) + "h " + String(min % 60).padStart(2, "0") + "m"
        : min + "m";
    }
    case "ticks": {
      const sec = Math.floor(n / 20);
      if (sec >= 3600) return (sec / 3600).toLocaleString(undefined, { maximumFractionDigits: 1 }) + " h";
      if (sec >= 60) return Math.floor(sec / 60) + " m";
      return sec + " s";
    }
    default:
      return n.toLocaleString() + (u ? " " + u : "");
  }
};
