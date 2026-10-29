import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationIntegrationType, InteractionResponseType } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition } from "../types";

export const COMMAND = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Check if the bot is alive")
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: `Pong!`,
		},
	};
};
