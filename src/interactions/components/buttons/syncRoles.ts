import { ButtonBuilder } from "@discordjs/builders";
import { APIButtonComponentWithCustomId, ButtonStyle, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { getRobloxFromDiscord } from "../../../db/linking";
import { buildRoleDiffContainer, updateVerifiedRoles } from "../../../utils/roles";
import { generateVerifyComponents } from "../../../utils/verify";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { editOriginal } from "../../utils";

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

			const changes = await updateVerifiedRoles(invokerId, "add");
			const footer = changes.length > 0 ? `${changes.length} role${changes.length === 1 ? "" : "s"} synced` : "You're already up to date";

			await editOriginal(interaction, {
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [buildRoleDiffContainer("🔄 Roles Synced", changes, footer).toJSON()],
			});
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
