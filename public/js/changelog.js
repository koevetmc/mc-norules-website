/* 2026-11-03: reverse-chronological changelog from /data/changelog.json. */
(function () {
  const root = document.getElementById("changelog");
  if (!root) return;
  let all = [];
  let tag = "ALL";

  function render() {
    const rows = tag === "ALL" ? all : all.filter((e) => e.tags && e.tags.indexOf(tag) >= 0);
    root.innerHTML = rows
      .map((e) => {
        const tags = (e.tags || [])
          .map((t) => '<span class="tag tag-' + t + '">' + t + "</span>")
          .join("");
        return (
          "<li><div class='entry-meta'><time class='entry-date' datetime='" +
          e.date +
          "'>" +
          e.date +
          "</time>" +
          (e.version ? "<span class='tag'>" + e.version + "</span>" : "") +
          tags +
          "</div><h3>" +
          e.title +
          "</h3><p class='lede'>" +
          e.body +
          "</p></li>"
        );
      })
      .join("");
  }

  fetch("/data/changelog.json")
    .then((r) => r.json())
    .then((data) => {
      all = (data.entries || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      render();
    });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tag = btn.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });
})();
