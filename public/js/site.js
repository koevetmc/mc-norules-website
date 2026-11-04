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

  document.querySelectorAll("[data-copy-ip]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(ip);
        showToast("copied");
      } catch {
        showToast("copy failed — " + ip);
      }
    });
  });

  // Live player count. Degrade if mcsrvstat.us is down. Never list who is online.
  document.querySelectorAll("[data-status]").forEach((el) => {
    const countEl = el.querySelector("[data-count]");
    const labelEl = el.querySelector("[data-label]");
    fetch(NR.statusApi, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data && data.online) {
          el.dataset.state = "online";
          const n = data.players && typeof data.players.online === "number" ? data.players.online : 0;
          const max = data.players && data.players.max ? data.players.max : 30;
          if (countEl) countEl.textContent = n + " / " + max;
          if (labelEl) labelEl.textContent = "online";
        } else {
          el.dataset.state = "offline";
          if (countEl) countEl.textContent = "0 / 30";
          if (labelEl) labelEl.textContent = "offline";
        }
      })
      .catch(() => {
        el.dataset.state = "unknown";
        if (labelEl) labelEl.textContent = "status unknown";
      });
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
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
        ? Math.floor(min / 60) + "h " + String(min % 60).padStart(2, "0") + "m without dying"
        : min + "m without dying";
    }
    default:
      return n.toLocaleString() + (u ? " " + u : "");
  }
};
