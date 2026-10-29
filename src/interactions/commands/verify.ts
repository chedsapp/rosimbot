import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationIntegrationType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { generateVerifyComponents } from "../../utils/verify";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";

export const COMMAND = new SlashCommandBuilder()
	.setName("verify")
	.setDescription("Verify your Roblox account")
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	const invokerId = interaction.member?.user.id ?? interaction.user?.id;
	if (invokerId == null) {
		throw new CommandParseError("Failed to get command invoker ID.");
	}
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: await generateVerifyComponents(invokerId),
		},
	};
};
