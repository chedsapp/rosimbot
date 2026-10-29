import {
	ActionRowBuilder,
	ButtonBuilder,
	ContainerBuilder,
	SectionBuilder,
	SlashCommandBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "@discordjs/builders";
import { ButtonStyle, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { generateAuthorizationURL } from "../../oauth/roblox";
import { env } from "cloudflare:workers";

export const COMMAND = new SlashCommandBuilder()
	.setName("verify")
	.setDescription("Verify your Roblox account")
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
			components: [
				new ContainerBuilder()
					.addSectionComponents(
						new SectionBuilder()
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(
									"# Verify to access RoSim\nClick the button below to verify your Roblox account.\nDo not share this link.",
								),
							)
							.setThumbnailAccessory(
								new ThumbnailBuilder().setURL("https://cdn.discordapp.com/icons/1393308664151932938/7ab93dfc9958cbe2bd620d0f46280a33.webp"),
							),
					)
					.toJSON(),
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setURL(await generateAuthorizationURL(invokerId, env))
							.setLabel("Verify"),
					)
					.toJSON(),
			],
		},
	};
};
