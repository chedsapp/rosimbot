import {
	ActionRowBuilder,
	ButtonBuilder,
	ContainerBuilder,
	SectionBuilder,
	SlashCommandBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "@discordjs/builders";
import { ApplicationIntegrationType, ButtonStyle, InteractionContextType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { generateAuthorizationURL } from "../../oauth/roblox";
import { env } from "cloudflare:workers";
import { generateVerifyComponents } from "../../utils/verify";

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
