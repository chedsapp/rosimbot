import { SlashCommandBuilder } from "@discordjs/builders";
import { InteractionResponseType } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition } from "../types";
import { env } from "cloudflare:workers";

export const COMMAND = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Check if the bot is alive")
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: `Pong!`,
		},
	};
};
