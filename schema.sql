-- NO RULES SURVIVAL player accounts (2026-11-06).
-- UUID is the Minecraft identity. Email is only the site login.
-- Link codes and session tokens are stored as SHA-256 hex, never plaintext.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  mc_uuid TEXT UNIQUE,
  mc_name TEXT,
  created_at INTEGER NOT NULL,
  linked_at INTEGER
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE IF NOT EXISTS link_codes (
  code_hash TEXT PRIMARY KEY,
  mc_uuid TEXT NOT NULL,
  mc_name TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consumed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_codes_uuid ON link_codes (mc_uuid);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  csrf TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Public counters only. No coordinates, no location, no online list.
CREATE TABLE IF NOT EXISTS player_stats (
  mc_uuid TEXT PRIMARY KEY,
  mc_name TEXT,
  play_ticks INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  player_kills INTEGER NOT NULL DEFAULT 0,
  mob_kills INTEGER NOT NULL DEFAULT 0,
  arena_wins INTEGER NOT NULL DEFAULT 0,
  arena_losses INTEGER NOT NULL DEFAULT 0,
  arena_waves INTEGER NOT NULL DEFAULT 0,
  endless_best INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Owner-only marks. The account API returns rows for the signed-in UUID only.
CREATE TABLE IF NOT EXISTS waypoints (
  owner_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  world TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  color TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner_uuid, name)
);

-- One PNG per visited 128-block square, keyed by the walking player's UUID.
CREATE TABLE IF NOT EXISTS map_tiles (
  owner_uuid TEXT NOT NULL,
  world TEXT NOT NULL,
  tx INTEGER NOT NULL,
  tz INTEGER NOT NULL,
  png TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner_uuid, world, tx, tz)
);

CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  closes_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_options (
  poll_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (poll_id, idx)
);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id TEXT NOT NULL,
  mc_uuid TEXT NOT NULL,
  option_idx INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (poll_id, mc_uuid)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL
);
