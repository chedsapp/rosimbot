import {
	ContainerBuilder,
	SectionBuilder,
	SlashCommandBuilder,
	SlashCommandUserOption,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "@discordjs/builders";
import { ApplicationCommandOptionType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { getRobloxFromDiscord } from "../../db/linking";
import { editOriginal } from "../utils";
import { getRobloxUser, getRobloxUserThumbnail } from "../../api/roblox";

export const COMMAND = new SlashCommandBuilder()
	.setName("whois")
	.setDescription("Check what a Discord user's Roblox link is")
	.addUserOption(new SlashCommandUserOption().setName("user").setDescription("The user to search").setRequired(true))
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	const userOpt = interaction.data.options?.find((o) => o.name === "user");
	if (userOpt?.type !== ApplicationCommandOptionType.User) {
		// option missing or wrong type: reply with an error
		throw new CommandParseError("Invalid type for user option");
	}
	const searchDiscordId = userOpt.value;

	const resolvedUser = interaction.data.resolved?.users?.[searchDiscordId];
	if (resolvedUser == null) {
		throw new CommandParseError("Failed to resolve user " + searchDiscordId);
	}

	ctx.waitUntil(
		(async () => {
			try {
				const foundRobloxId = await getRobloxFromDiscord(searchDiscordId);
				if (foundRobloxId != null) {
					const robloxUserInfo = await getRobloxUser(foundRobloxId);
					await editOriginal(interaction, {
						flags: MessageFlags.IsComponentsV2,
						components: [
							new ContainerBuilder()
								.addSectionComponents(
									new SectionBuilder()
										.addTextDisplayComponents(
											new TextDisplayBuilder().setContent(
												`<@${searchDiscordId}> is linked to [${robloxUserInfo.displayName}](https://roblox.com/users/${foundRobloxId}}/profile).`,
											),
										)
										.setThumbnailAccessory(new ThumbnailBuilder().setURL(await getRobloxUserThumbnail(foundRobloxId))),
								)
								.toJSON(),
						],
					});
				}
				await editOriginal(interaction, {
					flags: MessageFlags.IsComponentsV2,
					components: [
						new ContainerBuilder()
							.addTextDisplayComponents(new TextDisplayBuilder().setContent(`<@${searchDiscordId}> is linked to FUCKING nobody! FUCK YOU!`))
							.toJSON(),
					],
				});
			} catch (err) {
				console.error(err);
				await editOriginal(interaction, { content: "something broke brother" }).catch(() => {});
			}
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
	};
};
