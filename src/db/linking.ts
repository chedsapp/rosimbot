export async function linkAccount(db: D1Database, discordId: string, robloxId: string) {
	const previous = await db
		.prepare('SELECT discord_id FROM links WHERE roblox_id = ?1 AND discord_id != ?2')
		.bind(robloxId, discordId)
		.first<{ discord_id: string }>();

	// remove old
	await db.batch([
		db.prepare('DELETE FROM links WHERE roblox_id = ?1 AND discord_id != ?2').bind(robloxId, discordId),
		db
			.prepare(
				`INSERT INTO links (discord_id, roblox_id, verified_at) VALUES (?1, ?2, ?3) ON CONFLICT(discord_id) DO UPDATE SET roblox_id = excluded.roblox_id, verified_at = excluded.verified_at`,
			)
			.bind(discordId, robloxId, Date.now()),
	]);

	return previous?.discord_id; // so you can remove roles from prev user if any
}
