CREATE TABLE links(
	discord_id TEXT PRIMARY KEY,
	roblox_id TEXT NOT NULL UNIQUE,
	verified_at INTEGER NOT NULL
);
