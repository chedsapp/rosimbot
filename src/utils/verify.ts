import {
	ActionRowBuilder,
	ButtonBuilder,
	ContainerBuilder,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "@discordjs/builders";
import { ButtonStyle } from "discord-api-types/v10";
import { generateAuthorizationURL } from "../oauth/roblox";

export async function generateVerifyComponents(invokerId: string) {
	return [
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
					.setURL(await generateAuthorizationURL(invokerId))
					.setLabel("Verify"),
			)
			.toJSON(),
	];
}
