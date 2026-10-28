CREATE TABLE links (
  discord_id  TEXT PRIMARY KEY,
  roblox_id   TEXT NOT NULL UNIQUE,
  verified_at INTEGER NOT NULL
);

CREATE TABLE pending_verifications (
  state         TEXT PRIMARY KEY,
  discord_id    TEXT NOT NULL,
  expires_at    INTEGER NOT NULL
);
