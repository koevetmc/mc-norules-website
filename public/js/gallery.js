/* 2026-11-03: masonry gallery + accessible lightbox (Esc / arrows / trap-ish focus).
   2026-11-06: also drives the homepage mosaic (#gallery.home-gallery). */
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

  fetch("/data/gallery.json")
    .then((r) => r.json())
    .then((data) => {
      items = data.items || [];
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
