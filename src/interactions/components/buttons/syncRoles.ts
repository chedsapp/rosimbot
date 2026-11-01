import { ButtonBuilder, ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { DiscordAPIError } from "@discordjs/rest";
import {
	APIButtonComponentWithCustomId,
	APIGuild,
	ButtonStyle,
	InteractionResponseType,
	MessageFlags,
	RESTJSONErrorCodes,
	Routes,
} from "discord-api-types/v10";
import { DISCORD_REST } from "../../../api/discord";
import { getAllGuildConfigs } from "../../../db/guild";
import { getRobloxFromDiscord } from "../../../db/linking";
import { generateVerifyComponents } from "../../../utils/verify";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { editOriginal } from "../../utils";

export const COMPONENT = new ButtonBuilder()
	.setLabel("Sync Roles")
	.setEmoji({ name: "🔄" })
	.setStyle(ButtonStyle.Secondary)
	.setCustomId("buttons/syncRoles")
	.toJSON() as APIButtonComponentWithCustomId satisfies ComponentDefinition;

interface AddedRole {
	guildName: string;
	roleName: string;
}

function sanitize(text: string): string {
	// the funny
	return text; // text.replaceAll("`", "'");
}

function buildSyncResultContainer(addedRoles: AddedRole[]): ContainerBuilder {
	const byGuild = Map.groupBy(addedRoles, (role) => role.guildName);
	const lines: string[] = [];
	for (const [guildName, roles] of byGuild) {
		lines.push(`@@ ${sanitize(guildName)} @@`);
		for (const role of roles) lines.push(`+ ${sanitize(role.roleName)}`);
	}
	if (lines.length === 0) lines.push("  No role changes");

	const summary =
		addedRoles.length > 0 ? `-# ${addedRoles.length} role${addedRoles.length === 1 ? "" : "s"} synced` : "-# You're already up to date";

	return new ContainerBuilder()
		.setAccentColor(addedRoles.length > 0 ? 0x2ecc71 : 0x95a5a6)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(["## 🔄 Roles Synced", "```diff", ...lines, "```", summary].join("\n")));
}

export const callback: ComponentCallback = async (interaction, ctx) => {
	const invokerId = interaction.member?.user.id ?? interaction.user?.id;
	if (invokerId == null) {
		throw new ComponentParseError("Failed to get invoker ID.");
	}

	ctx.waitUntil(
		(async () => {
			const foundRobloxId = await getRobloxFromDiscord(invokerId);
			if (foundRobloxId === null) {
				await editOriginal(interaction, {
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
					components: await generateVerifyComponents(invokerId),
				});
				return;
			}

			const allGuildConfigs = await getAllGuildConfigs();
			const requests: Promise<AddedRole>[] = [];

			for (const [guildId, config] of allGuildConfigs) {
				const roleId = config.verifiedRoleId;
				if (roleId == null) {
					continue;
				}
				requests.push(
					(async () => {
						await DISCORD_REST.put(Routes.guildMemberRole(guildId, invokerId, roleId));
						try {
							const guild = (await DISCORD_REST.get(Routes.guild(guildId))) as APIGuild;
							const roleName = guild.roles.find((role) => role.id === roleId)?.name ?? roleId;
							return { guildName: guild.name, roleName };
						} catch {
							return { guildName: guildId, roleName: roleId };
						}
					})(),
				);
			}

			const results = await Promise.allSettled(requests);
			const addedRoles: AddedRole[] = [];
			for (const result of results) {
				// TODO: show failed role adds/removes
				// TODO: nicknames
				if (result.status === "fulfilled") {
					addedRoles.push(result.value);
				} else if (!(result.reason instanceof DiscordAPIError && result.reason.code === RESTJSONErrorCodes.UnknownMember)) {
					// UnknownMember just means the user isn't in that server
					console.error("role update failed", result.reason);
				}
			}

			await editOriginal(interaction, {
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [buildSyncResultContainer(addedRoles).toJSON()],
			});
			return;
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
