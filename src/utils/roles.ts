import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { DiscordAPIError } from "@discordjs/rest";
import { APIGuild, RESTJSONErrorCodes, Routes } from "discord-api-types/v10";
import { DISCORD_REST } from "../api/discord";
import { getAllGuildConfigs } from "../db/guild";

export type RoleAction = "add" | "remove";

export interface RoleChange {
	action: RoleAction;
	guildName: string;
	roleName: string;
}

export async function updateVerifiedRoles(userId: string, action: RoleAction): Promise<RoleChange[]> {
	const allGuildConfigs = await getAllGuildConfigs();
	const requests: Promise<RoleChange>[] = [];

	for (const [guildId, config] of allGuildConfigs) {
		const roleId = config.verifiedRoleId;
		if (roleId == null) {
			continue;
		}
		requests.push(
			(async () => {
				const route = Routes.guildMemberRole(guildId, userId, roleId);
				await (action === "add" ? DISCORD_REST.put(route) : DISCORD_REST.delete(route));
				try {
					const guild = (await DISCORD_REST.get(Routes.guild(guildId))) as APIGuild;
					const roleName = guild.roles.find((role) => role.id === roleId)?.name ?? roleId;
					return { action, guildName: guild.name, roleName };
				} catch {
					return { action, guildName: guildId, roleName: roleId };
				}
			})(),
		);
	}

	const results = await Promise.allSettled(requests);
	const changes: RoleChange[] = [];
	for (const result of results) {
		// TODO: show failed role adds/removes
		// TODO: nicknames
		if (result.status === "fulfilled") {
			changes.push(result.value);
		} else if (!(result.reason instanceof DiscordAPIError && result.reason.code === RESTJSONErrorCodes.UnknownMember)) {
			// UnknownMember just means the user isn't in that server
			console.error(`role ${action} failed`, result.reason);
		}
	}
	return changes;
}

function sanitize(text: string): string {
	// the funny
	return text; // text.replaceAll("`", "'");
}

const ACCENT_ADD = 0x2ecc71;
const ACCENT_REMOVE = 0xe74c3c;
const ACCENT_NONE = 0x95a5a6;

export function buildRoleDiffContainer(title: string, changes: RoleChange[], footer: string): ContainerBuilder {
	const byGuild = Map.groupBy(changes, (change) => change.guildName);
	const lines: string[] = [];
	for (const [guildName, guildChanges] of byGuild) {
		lines.push(`@@ ${sanitize(guildName)} @@`);
		for (const change of guildChanges) lines.push(`${change.action === "add" ? "+" : "-"} ${sanitize(change.roleName)}`);
	}
	if (lines.length === 0) lines.push("  No role changes");

	const accent = changes.length === 0 ? ACCENT_NONE : changes.every((change) => change.action === "remove") ? ACCENT_REMOVE : ACCENT_ADD;

	return new ContainerBuilder()
		.setAccentColor(accent)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent([`## ${title}`, "```diff", ...lines, "```", `-# ${footer}`].join("\n")));
}
