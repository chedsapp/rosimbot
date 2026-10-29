import { env } from "cloudflare:workers";

const DB = env.rosimbot;

export async function linkAccount(discordId: string, robloxId: string): Promise<string | undefined> {
	const [removed] = await DB.batch<{ discord_id: string }>([
		DB.prepare("DELETE FROM links WHERE roblox_id = ?1 AND discord_id != ?2 RETURNING discord_id").bind(robloxId, discordId),
		DB
			.prepare(
				`INSERT INTO links (discord_id, roblox_id, verified_at) VALUES (?1, ?2, ?3) ON CONFLICT(discord_id) DO UPDATE SET roblox_id = excluded.roblox_id, verified_at = excluded.verified_at`,
			)
			.bind(discordId, robloxId, Date.now()),
	]);

	return removed.results[0]?.discord_id; // so you can remove roles from prev user if any
}

export async function getRobloxFromDiscord(discordId: string): Promise<string | null> {
	const find = await DB.prepare("SELECT roblox_id FROM links WHERE discord_id = ?1").bind(discordId).first<{ roblox_id: string }>();

	return find?.roblox_id ?? null;
}
