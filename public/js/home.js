/* 2026-11-09: homepage legends teaser + live boards. Real legends.json only. */
(function () {
  const legendsRoot = document.getElementById("home-legends");
  const statsRoot = document.getElementById("home-stats");
  if (!legendsRoot && !statsRoot) return;
  const HEADS = (window.NR && window.NR.heads) || "https://mc-heads.net/avatar";

  fetch("/data/legends.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      const order = data.order || [];
      const cats = data.categories || {};

      if (legendsRoot) {
        legendsRoot.innerHTML = order
          .slice(0, 8)
          .map(function (k) {
            const cat = cats[k];
            if (!cat) return "";
            const top = (cat.entries || [])[0];
            const name = top ? top.name : "";
            const img = name ? HEADS + "/" + encodeURIComponent(name) + "/48" : "/img/icon-32.png";
            return (
              '<a class="home-legend-cell" href="/legends.html">' +
              '<img src="' +
              img +
              '" alt="" width="48" height="48">' +
              '<span class="home-legend-cat">' +
              cat.title +
              "</span>" +
              '<span class="home-legend-name">' +
              (name || "unclaimed") +
              "</span></a>"
            );
          })
          .join("");
      }

      if (statsRoot) {
        const keys = ["kills", "deaths", "playtime", "life", "distance", "bosses"];
        statsRoot.innerHTML = keys
          .map(function (k) {
            const cat = cats[k];
            if (!cat) return "";
            const top = (cat.entries || [])[0];
            if (!top) {
              return (
                '<div class="home-stat"><span>' +
                cat.title +
                "</span><b>unclaimed</b></div>"
              );
            }
            const val = window.nrFormatStat
              ? window.nrFormatStat(cat.format, top.value, cat.unit)
              : String(top.value);
            return (
              '<a class="home-stat" href="/player/' +
              encodeURIComponent(top.name) +
              '/"><img src="' +
              HEADS +
              "/" +
              encodeURIComponent(top.name) +
              '/32" alt="" width="32" height="32"><span>' +
              cat.title +
              "</span><b>" +
              top.name +
              "</b><em>" +
              val +
              "</em></a>"
            );
          })
          .join("");
      }
    })
    .catch(function () {
      if (legendsRoot) legendsRoot.innerHTML = "<p class='lede'>Could not load legends.</p>";
    });
})();
