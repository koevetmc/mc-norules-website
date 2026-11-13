/* 2026-11-03: masonry gallery + accessible lightbox (Esc / arrows).
   2026-11-06: homepage used the same JSON as a large mosaic.
   2026-11-09: homepage is a compact cycling stage instead. gallery.html
   stays a masonry. Click still opens the lightbox. */
(function () {
  const root = document.getElementById("gallery");
  const box = document.getElementById("lightbox");
  if (!root || !box) return;

  let items = [];
  let index = 0;
  const imgEl = box.querySelector("[data-full]");
  const capEl = box.querySelector("[data-cap]");
  const closeBtn = box.querySelector("[data-close]");
  const prevBtn = box.querySelector("[data-prev]");
  const nextBtn = box.querySelector("[data-next]");
  const home = root.classList.contains("home-gallery");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const it = items[index];
    imgEl.src = it.file;
    imgEl.alt = it.caption || "";
    capEl.textContent = (it.caption || "") + (it.author ? " — " + it.author : "") + (it.date ? " · " + it.date : "");
    box.classList.add("open");
    box.setAttribute("aria-hidden", "false");
    closeBtn.focus();
  }
  function hide() {
    box.classList.remove("open");
    box.setAttribute("aria-hidden", "true");
    imgEl.removeAttribute("src");
  }

  function paintMasonry() {
    root.innerHTML = items
      .map((it, i) => {
        const eager = i === 0 ? ' fetchpriority="high" loading="eager"' : ' loading="lazy"';
        return (
          '<a href="' +
          it.file +
          '" data-i="' +
          i +
          '"><figure><img src="' +
          it.file +
          '" alt="' +
          (it.caption || "").replace(/"/g, "&quot;") +
          '"' +
          eager +
          ' width="800" height="450"><figcaption>' +
          (it.caption || "") +
          "</figcaption></figure></a>"
        );
      })
      .join("");
    root.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        show(Number(a.dataset.i));
      });
    });
  }

  function paintCycle() {
    root.classList.add("is-cycle");
    root.innerHTML =
      '<figure class="home-cycle-stage">' +
      '<a href="#" data-open>' +
      '<img alt="" width="960" height="540" fetchpriority="high">' +
      "<figcaption></figcaption>" +
      "</a></figure>" +
      '<p class="home-cycle-bar">' +
      '<button class="btn btn-ghost" type="button" data-cycle-prev>Prev</button>' +
      '<span data-cycle-count></span>' +
      '<button class="btn btn-ghost" type="button" data-cycle-next>Next</button>' +
      "</p>";

    const frame = root.querySelector("[data-open]");
    const photo = root.querySelector("img");
    const caption = root.querySelector("figcaption");
    const count = root.querySelector("[data-cycle-count]");
    const prev = root.querySelector("[data-cycle-prev]");
    const next = root.querySelector("[data-cycle-next]");
    let cur = 0;
    let timer = 0;
    let fade = 0;
    let first = true;
    const wait = 5500;

    function go(i, user) {
      if (!items.length) return;
      cur = (i + items.length) % items.length;
      const it = items[cur];
      const token = ++fade;
      const apply = () => {
        if (token !== fade) return;
        photo.src = it.file;
        photo.alt = it.caption || "";
        caption.textContent = it.caption || "";
        count.textContent = cur + 1 + " / " + items.length;
        frame.href = it.file;
        frame.dataset.i = String(cur);
        photo.classList.add("is-in");
      };
      if (first || reduce) {
        first = false;
        apply();
      } else {
        photo.classList.remove("is-in");
        window.setTimeout(apply, 180);
      }
      const nxt = items[(cur + 1) % items.length];
      if (nxt) {
        const pre = new Image();
        pre.src = nxt.file;
      }
      if (user) restart();
    }

    function tick() {
      if (box.classList.contains("open")) return;
      go(cur + 1, false);
    }
    function restart() {
      window.clearInterval(timer);
      if (!reduce) timer = window.setInterval(tick, wait);
    }

    frame.addEventListener("click", (e) => {
      e.preventDefault();
      show(cur);
    });
    prev.addEventListener("click", () => go(cur - 1, true));
    next.addEventListener("click", () => go(cur + 1, true));
    root.addEventListener("mouseenter", () => window.clearInterval(timer));
    root.addEventListener("mouseleave", restart);
    root.addEventListener("focusin", () => window.clearInterval(timer));
    root.addEventListener("focusout", (e) => {
      if (!root.contains(e.relatedTarget)) restart();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.clearInterval(timer);
      else restart();
    });

    go(0, false);
    restart();
  }

  fetch("/data/gallery.json")
    .then((r) => r.json())
    .then((data) => {
      items = data.items || [];
      if (home) paintCycle();
      else paintMasonry();
    });

  closeBtn.addEventListener("click", hide);
  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (e) => {
    if (e.target === box) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") hide();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
})();
