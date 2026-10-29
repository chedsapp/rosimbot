interface GuildConfigRow {
	guild_id: string;
	verified_role_id: string | null;
}

export interface GuildConfig {
	verifiedRoleId: string | null;
}

function toGuildConfig(row: GuildConfigRow | null): GuildConfig {
	return {
		verifiedRoleId: row?.verified_role_id ?? null,
	};
}

export async function getGuildConfig(db: D1Database, guildId: string): Promise<GuildConfig> {
	const row = await db.prepare("SELECT * FROM guild_config WHERE guild_id = ?1").bind(guildId).first<GuildConfigRow>();

	return toGuildConfig(row);
}

export async function getAllGuildConfigs(db: D1Database): Promise<Map<string, GuildConfig>> {
	const { results } = await db.prepare("SELECT * FROM guild_config").all<GuildConfigRow>();

	return new Map(results.map((row) => [row.guild_id, toGuildConfig(row)]));
}
export async function setVerifiedRole(db: D1Database, guildId: string, roleId: string | null): Promise<void> {
	await db
		.prepare(
			"INSERT INTO guild_config (guild_id, verified_role_id) VALUES (?1, ?2) ON CONFLICT(guild_id) DO UPDATE SET verified_role_id = excluded.verified_role_id",
		)
		.bind(guildId, roleId)
		.run();
}
