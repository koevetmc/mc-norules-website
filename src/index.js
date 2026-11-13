/**
 * NO RULES SURVIVAL account API (2026-11-06).
 * Static pages stay in public/ and are served by the ASSETS binding.
 * This worker only owns /api/* (see wrangler run_worker_first).
 *
 * First milestone: email magic-link login, HMAC-issued /link codes, one UUID
 * per site account. No map, no polls, no stats ingest.
 */

const enc = new TextEncoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }
    try {
      return await route(request, env, url);
    } catch (err) {
      console.error("api", err);
      return json({ error: "Something went wrong." }, 500);
    }
  },
};

async function route(request, env, url) {
  const path = url.pathname;
  const method = request.method;
  if (method === "GET" && path === "/api/auth/callback") return callback(request, env, url);
  if (method === "POST" && path === "/api/auth/request") return requestLink(request, env);
  if (method === "POST" && path === "/api/auth/logout") return logout(request, env);
  if (method === "GET" && path === "/api/me") return me(request, env);
  if (method === "POST" && path === "/api/link/redeem") return redeem(request, env);
  if (method === "POST" && path === "/api/link/issue") return issue(request, env);
  if (method === "POST" && path === "/api/stats/ingest") return ingestStats(request, env);
  if (method === "GET" && path === "/api/map/index") return mapIndex(request, env, url);
  if (method === "GET" && path === "/api/map/tile") return mapTile(request, env, url);
  if (method === "POST" && path === "/api/map/tile") return mapPut(request, env);
  if (method === "GET" && path === "/api/polls") return polls(request, env);
  if (method === "POST" && path === "/api/polls/open") return pollOpen(request, env);
  if (method === "POST" && path === "/api/polls/close") return pollClose(request, env);
  if (method === "POST" && path === "/api/polls/vote") return vote(request, env);
  return json({ error: "Not found." }, 404);
}

async function requestLink(request, env) {
  if (!isJson(request)) return json({ error: "Expected JSON." }, 415);
  const ip = clientIp(request);
  if (!(await allow(env, "login:ip:" + ip, 900, 20))) return json({ error: "Too many sign-in attempts." }, 429);
  const body = await readJson(request);
  const email = normalizeEmail(body && body.email);
  if (!email) return json({ error: "Enter a real email address." }, 400);
  if (!(await allow(env, "login:email:" + email, 900, 5))) {
    return json({ ok: true, message: sentMessage() });
  }
  // No mail provider and not a local wrangler box: do not mint a token nobody can open.
  const localDev = env.DEV_MAGIC_LINKS === "1" && isLocalHost(request);
  if (!env.RESEND_API_KEY && !localDev) {
    return json({ error: "Sign-in mail is not set up yet. Tell an admin." }, 503);
  }

  const now = nowSec();
  let account = await env.DB.prepare("SELECT id FROM accounts WHERE email = ?").bind(email).first();
  if (!account) {
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO accounts (id, email, created_at) VALUES (?, ?, ?)").bind(id, email, now).run();
    account = { id };
  }
  await env.DB.prepare("DELETE FROM magic_links WHERE account_id = ? AND used_at IS NULL").bind(account.id).run();

  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const exp = now + 15 * 60;
  await env.DB.prepare("INSERT INTO magic_links (token_hash, account_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, account.id, exp).run();

  const link = new URL("/api/auth/callback?token=" + token, request.url).toString();
  const mailed = await sendMagic(env, email, link);
  // No verified domain yet: Resend's shared sender only delivers to the
  // account inbox. Say that, instead of telling the player to retry.
  if (env.RESEND_API_KEY && !mailed.ok) {
    const sandbox = /testing email|verify a domain|only send/i.test(mailed.error || "");
    return json({
      error: sandbox
        ? "Sign-in mail can only reach the admin inbox until a domain is added."
        : "Could not send mail. Try again shortly.",
    }, sandbox ? 403 : 502);
  }
  const payload = { ok: true, message: sentMessage() };
  // Local wrangler only. Production must not set DEV_MAGIC_LINKS.
  if (localDev) payload.devLink = link;
  return json(payload);
}

async function callback(request, env, url) {
  const token = url.searchParams.get("token") || "";
  const fail = Response.redirect(new URL("/login.html?e=link", request.url), 302);
  if (token.length < 20 || token.length > 128) return fail;
  const now = nowSec();
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT account_id FROM magic_links WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
  ).bind(tokenHash, now).first();
  if (!row) return fail;
  const used = await env.DB.prepare(
    "UPDATE magic_links SET used_at = ? WHERE token_hash = ? AND used_at IS NULL"
  ).bind(now, tokenHash).run();
  if (!used.meta || used.meta.changes !== 1) return fail;

  const session = await createSession(env, row.account_id, now);
  const headers = new Headers({ Location: new URL("/me.html", request.url).toString() });
  headers.append("Set-Cookie", sessionCookie(session.token, request, 14 * 24 * 3600));
  headers.set("Cache-Control", "no-store");
  return new Response(null, { status: 302, headers });
}

async function me(request, env) {
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  const account = await env.DB.prepare(
    "SELECT email, mc_uuid, mc_name, linked_at FROM accounts WHERE id = ?"
  ).bind(session.account_id).first();
  if (!account) return json({ error: "Sign in required." }, 401);
  let stats = null;
  let waypoints = [];
  if (account.mc_uuid) {
    stats = await env.DB.prepare(
      "SELECT play_ticks, deaths, player_kills, mob_kills, arena_wins, arena_losses, arena_waves, endless_best, updated_at, last_world, last_x, last_z FROM player_stats WHERE mc_uuid = ?"
    ).bind(account.mc_uuid).first();
    const marks = await env.DB.prepare(
      "SELECT name, world, x, y, z, color FROM waypoints WHERE owner_uuid = ? ORDER BY world, name"
    ).bind(account.mc_uuid).all();
    waypoints = marks.results || [];
  }
  return json({
    ok: true,
    email: account.email,
    mcUuid: account.mc_uuid || null,
    mcName: account.mc_name || null,
    linked: Boolean(account.mc_uuid),
    csrf: session.csrf,
    stats: stats || null,
    waypoints,
    self: stats && stats.last_world ? { world: stats.last_world, x: stats.last_x, z: stats.last_z } : null,
  });
}

async function logout(request, env) {
  if (!isJson(request)) return json({ error: "Expected JSON." }, 415);
  const session = await sessionFrom(request, env);
  if (!session) return json({ ok: true });
  const body = await readJson(request);
  if (!csrfOk(session, body)) return json({ error: "Page expired. Reload and try again." }, 403);
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(session.token_hash).run();
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", sessionCookie("", request, 0));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function redeem(request, env) {
  if (!isJson(request)) return json({ error: "Expected JSON." }, 415);
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  if (!(await allow(env, "redeem:" + session.account_id, 600, 10))) {
    return json({ error: "Too many attempts. Wait a few minutes." }, 429);
  }
  const body = await readJson(request);
  if (!csrfOk(session, body)) return json({ error: "Page expired. Reload and try again." }, 403);
  const code = String(body.code || "").trim().toUpperCase();
  if (!/^[A-Z2-9]{8}$/.test(code)) return json({ error: "Enter the 8-character code from chat." }, 400);

  const now = nowSec();
  const account = await env.DB.prepare("SELECT id, mc_uuid FROM accounts WHERE id = ?").bind(session.account_id).first();
  if (!account) return json({ error: "Sign in required." }, 401);
  const codeHash = await sha256(code);
  const row = await env.DB.prepare(
    "SELECT mc_uuid, mc_name FROM link_codes WHERE code_hash = ? AND consumed_at IS NULL AND expires_at > ?"
  ).bind(codeHash, now).first();
  if (!row) return json({ error: "That code is expired or already used." }, 400);
  if (account.mc_uuid && account.mc_uuid !== row.mc_uuid) {
    return json({ error: "This site account is already linked to a different Minecraft account." }, 409);
  }
  const other = await env.DB.prepare("SELECT id FROM accounts WHERE mc_uuid = ?").bind(row.mc_uuid).first();
  if (other && other.id !== account.id) {
    return json({ error: "That Minecraft account is already linked." }, 409);
  }
  const taken = await env.DB.prepare(
    "UPDATE link_codes SET consumed_at = ?, consumed_by = ? WHERE code_hash = ? AND consumed_at IS NULL"
  ).bind(now, account.id, codeHash).run();
  if (!taken.meta || taken.meta.changes !== 1) return json({ error: "That code is expired or already used." }, 400);
  await env.DB.prepare("UPDATE accounts SET mc_uuid = ?, mc_name = ?, linked_at = ? WHERE id = ?")
    .bind(row.mc_uuid, row.mc_name, now, account.id).run();
  return json({ ok: true, mcUuid: row.mc_uuid, mcName: row.mc_name, linked: true });
}

/** Game server only. One row per known player. Counters only. */
async function ingestStats(request, env) {
  const raw = await readRaw(request, 512 * 1024);
  if (raw == null) return json({ error: "Rejected." }, 400);
  if (!(await hmacOk(request, env, raw))) return json({ error: "Rejected." }, 401);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Rejected." }, 400); }
  const rows = Array.isArray(body.players) ? body.players : null;
  if (!rows || rows.length > 500) return json({ error: "Rejected." }, 400);
  // 2026-11-06: the open account page polls every few seconds. The server
  // push is about every 20s, so this window has to allow that, not one an hour.
  if (!(await allow(env, "stats:ingest", 15, 4))) return json({ error: "Slow down." }, 429);
  const now = nowSec();
  let n = 0;
  for (const row of rows) {
    const mcUuid = String(row.uuid || "").toLowerCase();
    const name = String(row.name || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(mcUuid)) continue;
    if (name && !/^[A-Za-z0-9_]{1,16}$/.test(name)) continue;
    const nums = ["playTicks", "deaths", "playerKills", "mobKills", "arenaWins", "arenaLosses", "arenaWaves", "endlessBest"]
      .map((k) => num(row[k]));
    if (nums.some((v) => v == null)) continue;
    await env.DB.prepare(
      `INSERT INTO player_stats (mc_uuid, mc_name, play_ticks, deaths, player_kills, mob_kills, arena_wins, arena_losses, arena_waves, endless_best, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(mc_uuid) DO UPDATE SET
         mc_name = COALESCE(excluded.mc_name, player_stats.mc_name),
         play_ticks = excluded.play_ticks,
         deaths = excluded.deaths,
         player_kills = excluded.player_kills,
         mob_kills = excluded.mob_kills,
         arena_wins = excluded.arena_wins,
         arena_losses = excluded.arena_losses,
         arena_waves = excluded.arena_waves,
         endless_best = excluded.endless_best,
         updated_at = excluded.updated_at`
    ).bind(mcUuid, name || null, ...nums, now).run();
    n++;
  }
  let marks = 0;
  if (Array.isArray(body.waypoints)) {
    const clean = [];
    for (const w of body.waypoints) {
      const owner = String(w.uuid || "").toLowerCase();
      const name = String(w.name || "").slice(0, 32);
      const world = String(w.world || "");
      const color = String(w.color || "white").toLowerCase();
      const x = Number(w.x), y = Number(w.y), z = Number(w.z);
      if (!/^[0-9a-f-]{36}$/.test(owner)) continue;
      if (!/^[\w .'-]{1,32}$/.test(name)) continue;
      if (!/^[A-Za-z0-9_]{1,32}$/.test(world)) continue;
      if (![x, y, z].every((n) => Number.isFinite(n) && Math.abs(n) < 3e7)) continue;
      clean.push({ owner, name, world, x, y, z, color: /^[a-z0-9_]{1,16}$/.test(color) ? color : "white" });
    }
    await env.DB.prepare("DELETE FROM waypoints").run();
    for (const w of clean) {
      await env.DB.prepare(
        "INSERT INTO waypoints (owner_uuid, name, world, x, y, z, color, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(w.owner, w.name, w.world, w.x, w.y, w.z, w.color, now).run();
      marks++;
    }
  }
  if (Array.isArray(body.online)) {
    for (const p of body.online) {
      const id = String(p.uuid || "").toLowerCase();
      const world = String(p.world || "");
      const x = Number(p.x), z = Number(p.z);
      if (!/^[0-9a-f-]{36}$/.test(id) || !/^[A-Za-z0-9_]{1,32}$/.test(world)) continue;
      if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
      await env.DB.prepare(
        "UPDATE player_stats SET last_world = ?, last_x = ?, last_z = ? WHERE mc_uuid = ?"
      ).bind(world, x, z, id).run();
    }
  }
  return json({ ok: true, updated: n, waypoints: marks });
}

const MAP_WORLDS = new Set(["world", "world_nether", "world_the_end"]);

async function mapIndex(request, env, url) {
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  const account = await env.DB.prepare("SELECT mc_uuid FROM accounts WHERE id = ?").bind(session.account_id).first();
  if (!account || !account.mc_uuid) return json({ ok: true, tiles: [], worlds: [] });
  const worlds = await env.DB.prepare(
    "SELECT DISTINCT world FROM map_tiles WHERE owner_uuid = ?"
  ).bind(account.mc_uuid).all();
  const world = url.searchParams.get("world") || "world";
  if (!MAP_WORLDS.has(world)) return json({ error: "Rejected." }, 400);
  const tiles = await env.DB.prepare(
    "SELECT tx, tz, updated_at FROM map_tiles WHERE owner_uuid = ? AND world = ?"
  ).bind(account.mc_uuid, world).all();
  return json({
    ok: true,
    world,
    worlds: (worlds.results || []).map((r) => r.world),
    tiles: tiles.results || [],
  });
}

async function mapTile(request, env, url) {
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  const account = await env.DB.prepare("SELECT mc_uuid FROM accounts WHERE id = ?").bind(session.account_id).first();
  if (!account || !account.mc_uuid) return json({ error: "Link your Minecraft account first." }, 404);
  const world = url.searchParams.get("world") || "";
  const tx = Number(url.searchParams.get("tx"));
  const tz = Number(url.searchParams.get("tz"));
  if (!MAP_WORLDS.has(world) || !Number.isInteger(tx) || !Number.isInteger(tz)) return json({ error: "Rejected." }, 400);
  if (!(await allow(env, "mapget:" + account.mc_uuid, 10, 80))) return json({ error: "Slow down." }, 429);
  const row = await env.DB.prepare(
    "SELECT png FROM map_tiles WHERE owner_uuid = ? AND world = ? AND tx = ? AND tz = ?"
  ).bind(account.mc_uuid, world, tx, tz).first();
  if (!row || !row.png) return json({ error: "Not explored." }, 404);
  const bytes = Uint8Array.from(atob(row.png), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=15" },
  });
}

async function mapPut(request, env) {
  const raw = await readRaw(request, 400000);
  if (raw == null) return json({ error: "Rejected." }, 400);
  if (!(await hmacOk(request, env, raw))) return json({ error: "Rejected." }, 401);
  if (!(await allow(env, "mapput", 15, 40))) return json({ error: "Slow down." }, 429);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Rejected." }, 400); }
  const id = String(body.uuid || "").toLowerCase();
  const world = String(body.world || "");
  const tx = Number(body.tx), tz = Number(body.tz);
  const png = String(body.png || "");
  if (!/^[0-9a-f-]{36}$/.test(id) || !MAP_WORLDS.has(world)) return json({ error: "Rejected." }, 400);
  if (!Number.isInteger(tx) || !Number.isInteger(tz)) return json({ error: "Rejected." }, 400);
  if (png.length < 32 || png.length > 300000) return json({ error: "Rejected." }, 400);
  await env.DB.prepare(
    `INSERT INTO map_tiles (owner_uuid, world, tx, tz, png, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(owner_uuid, world, tx, tz) DO UPDATE SET png = excluded.png, updated_at = excluded.updated_at`
  ).bind(id, world, tx, tz, png, nowSec()).run();
  return json({ ok: true });
}

async function polls(request, env) {
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  const account = await env.DB.prepare("SELECT mc_uuid FROM accounts WHERE id = ?").bind(session.account_id).first();
  const now = nowSec();
  const rows = await env.DB.prepare(
    "SELECT id, title, body, closes_at FROM polls WHERE closes_at IS NULL OR closes_at > ? ORDER BY created_at DESC"
  ).bind(now).all();
  const out = [];
  for (const poll of rows.results || []) {
    const options = await env.DB.prepare(
      "SELECT idx, label FROM poll_options WHERE poll_id = ? ORDER BY idx"
    ).bind(poll.id).all();
    const counts = await env.DB.prepare(
      "SELECT option_idx, COUNT(*) AS n FROM poll_votes WHERE poll_id = ? GROUP BY option_idx"
    ).bind(poll.id).all();
    let mine = null;
    if (account && account.mc_uuid) {
      const voteRow = await env.DB.prepare(
        "SELECT option_idx FROM poll_votes WHERE poll_id = ? AND mc_uuid = ?"
      ).bind(poll.id, account.mc_uuid).first();
      mine = voteRow ? voteRow.option_idx : null;
    }
    const tally = {};
    for (const c of counts.results || []) tally[c.option_idx] = c.n;
    out.push({
      id: poll.id,
      title: poll.title,
      body: poll.body,
      closesAt: poll.closes_at,
      mine,
      options: (options.results || []).map((o) => ({ idx: o.idx, label: o.label, votes: tally[o.idx] || 0 })),
    });
  }
  return json({ ok: true, polls: out });
}

async function pollOpen(request, env) {
  const raw = await readRaw(request, 8000);
  if (raw == null) return json({ error: "Rejected." }, 400);
  if (!(await hmacOk(request, env, raw))) return json({ error: "Rejected." }, 401);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Rejected." }, 400); }
  const title = String(body.title || "").trim().slice(0, 140);
  const options = (Array.isArray(body.options) ? body.options : [])
    .map((s) => String(s).trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 8);
  if (title.length < 3 || options.length < 2) return json({ error: "Need a question and two options." }, 400);
  const days = Math.min(30, Math.max(1, Math.floor(Number(body.days) || 7)));
  const now = nowSec();
  let id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "poll";
  const taken = await env.DB.prepare("SELECT id FROM polls WHERE id = ?").bind(id).first();
  if (taken) id = (id.slice(0, 24) + "-" + now.toString(36)).slice(0, 40);
  await env.DB.prepare(
    "INSERT INTO polls (id, title, body, closes_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, title, "", now + days * 86400, now).run();
  for (let i = 0; i < options.length; i++) {
    await env.DB.prepare(
      "INSERT INTO poll_options (poll_id, idx, label) VALUES (?, ?, ?)"
    ).bind(id, i, options[i]).run();
  }
  return json({ ok: true, id, closesAt: now + days * 86400 });
}

async function pollClose(request, env) {
  const raw = await readRaw(request, 2000);
  if (raw == null) return json({ error: "Rejected." }, 400);
  if (!(await hmacOk(request, env, raw))) return json({ error: "Rejected." }, 401);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Rejected." }, 400); }
  const id = String(body.id || "");
  if (!/^[a-z0-9-]{1,40}$/.test(id)) return json({ error: "Rejected." }, 400);
  await env.DB.prepare("UPDATE polls SET closes_at = ? WHERE id = ?").bind(nowSec(), id).run();
  return json({ ok: true, id });
}

async function vote(request, env) {
  if (!isJson(request)) return json({ error: "Expected JSON." }, 415);
  const session = await sessionFrom(request, env);
  if (!session) return json({ error: "Sign in required." }, 401);
  const body = await readJson(request);
  if (!csrfOk(session, body)) return json({ error: "Page expired. Reload and try again." }, 403);
  const account = await env.DB.prepare("SELECT mc_uuid FROM accounts WHERE id = ?").bind(session.account_id).first();
  if (!account || !account.mc_uuid) return json({ error: "Link your Minecraft account first." }, 409);
  if (!(await allow(env, "vote:" + account.mc_uuid, 60, 10))) return json({ error: "Slow down." }, 429);
  const pollId = String(body.pollId || "");
  const option = Number(body.option);
  if (!/^[a-z0-9-]{1,40}$/.test(pollId) || !Number.isInteger(option)) return json({ error: "Rejected." }, 400);
  const now = nowSec();
  const poll = await env.DB.prepare(
    "SELECT id FROM polls WHERE id = ? AND (closes_at IS NULL OR closes_at > ?)"
  ).bind(pollId, now).first();
  if (!poll) return json({ error: "That poll is closed." }, 409);
  const opt = await env.DB.prepare(
    "SELECT idx FROM poll_options WHERE poll_id = ? AND idx = ?"
  ).bind(pollId, option).first();
  if (!opt) return json({ error: "Rejected." }, 400);
  await env.DB.prepare(
    "INSERT INTO poll_votes (poll_id, mc_uuid, option_idx, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(poll_id, mc_uuid) DO UPDATE SET option_idx = excluded.option_idx, created_at = excluded.created_at"
  ).bind(pollId, account.mc_uuid, option, now).run();
  return polls(request, env);
}

function num(v) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1e15) return null;
  return Math.floor(v);
}

/** Game server only. Body bytes are the HMAC payload. */
async function issue(request, env) {
  const raw = await readRaw(request, 2048);
  if (raw == null) return json({ error: "Rejected." }, 400);
  if (!(await hmacOk(request, env, raw))) return json({ error: "Rejected." }, 401);
  const now = nowSec();

  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Rejected." }, 400); }
  const mcUuid = String(body.uuid || "").toLowerCase();
  const name = String(body.name || "");
  const code = String(body.code || "").toUpperCase();
  const exp = Number(body.exp);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(mcUuid)) {
    return json({ error: "Rejected." }, 400);
  }
  if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) return json({ error: "Rejected." }, 400);
  if (!/^[A-Z2-9]{8}$/.test(code)) return json({ error: "Rejected." }, 400);
  if (!Number.isFinite(exp) || exp < now || exp > now + 15 * 60) return json({ error: "Rejected." }, 400);
  if (!(await allow(env, "issue:" + mcUuid, 600, 6))) return json({ error: "Slow down." }, 429);

  const codeHash = await sha256(code);
  await env.DB.prepare("DELETE FROM link_codes WHERE mc_uuid = ? AND consumed_at IS NULL").bind(mcUuid).run();
  await env.DB.prepare(
    "INSERT INTO link_codes (code_hash, mc_uuid, mc_name, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(codeHash, mcUuid, name, Math.min(exp, now + 10 * 60)).run();
  return json({ ok: true });
}

async function createSession(env, accountId, now) {
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const csrf = base64url(crypto.getRandomValues(new Uint8Array(24)));
  const tokenHash = await sha256(token);
  const exp = now + 14 * 24 * 3600;
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, account_id, csrf, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(tokenHash, accountId, csrf, exp, now).run();
  return { token, csrf };
}

async function sessionFrom(request, env) {
  const token = readCookie(request, "nr_session");
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT token_hash, account_id, csrf, expires_at FROM sessions WHERE token_hash = ?"
  ).bind(tokenHash).first();
  if (!row || row.expires_at < nowSec()) return null;
  return row;
}

function csrfOk(session, body) {
  // JSON body, not a cookie. A cross-site form cannot set Content-Type: application/json.
  const fromBody = body && typeof body.csrf === "string" ? body.csrf : "";
  return fromBody.length > 0 && safeEqual(session.csrf, fromBody);
}

function sessionCookie(token, request, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `nr_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}

async function sendMagic(env, email, link) {
  if (!env.RESEND_API_KEY) return { ok: false, error: "" };
  const from = env.EMAIL_FROM || "NO RULES SURVIVAL <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Sign in to NO RULES SURVIVAL",
      text: "This link works once and expires in 15 minutes:\n" + link + "\n\nIf you did not ask for this, ignore it.",
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data.message || "" };
}

async function allow(env, bucket, windowSec, limit) {
  const now = nowSec();
  const windowStart = now - (now % windowSec);
  const row = await env.DB.prepare("SELECT window_start, hits FROM rate_limits WHERE bucket = ?").bind(bucket).first();
  if (!row || row.window_start !== windowStart) {
    await env.DB.prepare(
      "INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, hits = 1"
    ).bind(bucket, windowStart).run();
    return true;
  }
  if (row.hits >= limit) return false;
  await env.DB.prepare("UPDATE rate_limits SET hits = hits + 1 WHERE bucket = ?").bind(bucket).run();
  return true;
}

function sentMessage() {
  return "If that inbox can receive mail, a one-time sign-in link is on the way.";
}

function isLocalHost(request) {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "local";
}

function isJson(request) {
  const ct = request.headers.get("Content-Type") || "";
  return ct.toLowerCase().includes("application/json");
}

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 4096) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function nowSec() { return Math.floor(Date.now() / 1000); }

function base64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return hex(new Uint8Array(buf));
}

async function readRaw(request, max) {
  const raw = await request.text();
  if (raw.length > max) return null;
  return raw;
}

async function hmacOk(request, env, raw) {
  if (!env.LINK_HMAC) return false;
  const ts = request.headers.get("X-Timestamp") || "";
  const sig = (request.headers.get("X-Signature") || "").toLowerCase();
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec() - tsNum) > 120) return false;
  const expected = await hmacHex(env.LINK_HMAC, ts + "." + raw);
  return safeEqual(expected, sig);
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return hex(new Uint8Array(buf));
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ea = enc.encode(a);
  const eb = enc.encode(b);
  if (ea.length !== eb.length) return false;
  return crypto.subtle.timingSafeEqual(ea, eb);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
