import { ButtonBuilder } from "@discordjs/builders";
import { APIButtonComponentWithCustomId, ButtonStyle, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { generateVerifyComponents } from "../../../utils/verify";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";

export const COMPONENT = new ButtonBuilder()
	.setLabel("Verify")
	.setEmoji({ name: "✅" })
	.setStyle(ButtonStyle.Success)
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
