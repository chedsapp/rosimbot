import { ButtonBuilder } from "@discordjs/builders";
import {
	APIButtonComponentWithCustomId,
	APIGuild,
	ButtonStyle,
	InteractionResponseType,
	MessageFlags,
	Routes,
} from "discord-api-types/v10";
import { DISCORD_REST } from "../../../api/discord";
import { getAllGuildConfigs } from "../../../db/guild";
import { getRobloxFromDiscord } from "../../../db/linking";
import { generateVerifyComponents } from "../../../utils/verify";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { editOriginal, genericSuccessCV2 } from "../../utils";

export const COMPONENT = new ButtonBuilder()
	.setLabel("Sync Roles")
	.setEmoji({ name: "🔄" })
	.setStyle(ButtonStyle.Secondary)
	.setCustomId("buttons/syncRoles")
	.toJSON() as APIButtonComponentWithCustomId satisfies ComponentDefinition;

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
			const requests: Promise<string>[] = [];

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
							return `**${roleName}** in ${guild.name}`;
						} catch {
							return `<@&${roleId}>`;
						}
					})(),
				);
			}

			const results = await Promise.allSettled(requests);
			const addedRoles: string[] = [];
			for (const result of results) {
				// TODO: show failed role adds/removes
				// TODO: nicknames
				if (result.status === "fulfilled") addedRoles.push(result.value);
				else console.error("role update failed", result.reason);
			}

			const message =
				addedRoles.length > 0
					? `Your roles have been updated! Roles added:\n${addedRoles.map((role) => `- ${role}`).join("\n")}`
					: "No roles were added.";

			await editOriginal(interaction, {
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				...(await genericSuccessCV2(message)),
			});
			return;
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
