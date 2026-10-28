-- 0001_init.sql was recorded as applied before the links table was added to it,
-- so neither database ever got the table.
CREATE TABLE IF NOT EXISTS links(
	discord_id TEXT PRIMARY KEY,
	roblox_id TEXT NOT NULL UNIQUE,
	verified_at INTEGER NOT NULL
);
