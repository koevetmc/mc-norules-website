/* 2026-11-03: single place to retarget the site after Cloudflare deploy.
   Set origin to your custom domain (or the *.workers.dev URL wrangler prints)
   so Open Graph / sitemap absolute URLs stay correct. */
window.NR = {
  origin: "",
  name: "NO RULES SURVIVAL",
  javaHost: "76.176.218.251",
  javaPort: 25565,
  bedrockPort: 19132,
  statusApi: "https://api.mcsrvstat.us/3/76.176.218.251",
  // Fairness: the status API may include an online-player name list.
  // Never render it. Count + up/down only.
  heads: "https://mc-heads.net/avatar",
  body: "https://mc-heads.net/body"
};
