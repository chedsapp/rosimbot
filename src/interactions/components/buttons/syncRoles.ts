import { ButtonBuilder, formatEmoji } from "@discordjs/builders";
import { APIButtonComponentWithCustomId, ButtonStyle, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { generateVerifyComponents } from "../../../utils/verifyComponents";

export const COMMAND = new ButtonBuilder()
	.setLabel("Sync Roles")
	.setEmoji({ name: "🔄️" })
	.setStyle(ButtonStyle.Primary)
	.setCustomId("buttons/verify")
	.toJSON() as APIButtonComponentWithCustomId satisfies ComponentDefinition;

export const callback: ComponentCallback = async (interaction, ctx) => {
	const invokerId = interaction.member?.user.id ?? interaction.user?.id;
	if (invokerId == null) {
		throw new ComponentParseError("Failed to get invoker ID.");
	}
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: await generateVerifyComponents(invokerId),
		},
	};
};
