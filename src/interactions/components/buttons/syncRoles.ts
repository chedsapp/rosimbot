import { ButtonBuilder } from "@discordjs/builders";
import { APIButtonComponentWithCustomId, ButtonStyle, InteractionResponseType, MessageFlags, Routes } from "discord-api-types/v10";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { generateVerifyComponents } from "../../../utils/verify";
import { DISCORD_REST } from "../../../api/discord";
import { getAllGuildConfigs } from "../../../db/guild";
import { getRobloxFromDiscord } from "../../../db/linking";
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
			const requests: Promise<unknown>[] = [];

			for (const [guildId, config] of allGuildConfigs) {
				const roleId = config.verifiedRoleId;
				if (roleId == null) {
					continue;
				}
				requests.push(DISCORD_REST.put(Routes.guildMemberRole(guildId, invokerId, foundRobloxId)));
			}

			const results = await Promise.allSettled(requests);
			for (const result of results) {
                // TODO: expose failed/successful role adds/removes
                // TODO: nicknames
				if (result.status === "rejected") console.error("role update failed", result.reason);
			}

			await editOriginal(interaction, {
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				...(await genericSuccessCV2("Your roles have been updated!")),
			});
			return;
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
