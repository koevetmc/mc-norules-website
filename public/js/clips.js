/* 2026-11-03: Flashback killcam archive. Clips are posted after the fact — never a live kill feed. */
(function () {
  const root = document.getElementById("clips");
  if (!root) return;
  fetch("/data/clips.json")
    .then((r) => r.json())
    .then((data) => {
      const items = data.items || [];
      if (!items.length) {
        root.innerHTML = "<p class='lede'>No clips uploaded yet. Drop mp4s in /clips/ and add a line to data/clips.json.</p>";
        return;
      }
      root.innerHTML = items
        .map((c) => {
          const src = c.file
            ? "<video controls preload='metadata' poster='" +
              (c.poster || "/img/og-image.jpg") +
              "'><source src='" +
              c.file +
              "' type='video/mp4'>Clip not available.</video>"
            : "<div class='yt-card' style='min-height:10rem'><p>Clip file not uploaded yet.</p></div>";
          return (
            "<article class='clip-card'>" +
            src +
            "<div class='killfeed'><span class='killer'>" +
            (c.killer || "?") +
            "</span><span>⚔</span><span class='victim'>" +
            (c.victim || "?") +
            "</span></div>" +
            "<p style='padding:.55rem .7rem;margin:0'>" +
            (c.title || "") +
            (c.date ? " <span class='entry-date'>" + c.date + "</span>" : "") +
            "</p></article>"
          );
        })
        .join("");
    });
})();
