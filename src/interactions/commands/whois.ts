import { SlashCommandBuilder, SlashCommandUserOption } from "@discordjs/builders";
import { ApplicationCommandOptionType, InteractionResponseType } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { getRobloxFromDiscord } from "../../db/linking";
import { editOriginal } from "../utils";

export const COMMAND = new SlashCommandBuilder()
	.setName("whois")
	.setDescription("Check what a Discord user's Roblox link is")
	.addUserOption(new SlashCommandUserOption().setName("user").setDescription("The user to search"))
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx, env) => {
	const userOpt = interaction.data.options?.find((o) => o.name === "user");
	if (userOpt?.type !== ApplicationCommandOptionType.String) {
		// option missing or wrong type: reply with an error
		throw new CommandParseError("Invalid type for option");
	}
	const searchDiscordId = userOpt.value;

	ctx.waitUntil(
		(async () => {
			try {
				const foundRobloxId = await getRobloxFromDiscord(env.rosimbot, searchDiscordId);
				await editOriginal(interaction, {
					content:
						foundRobloxId == null
							? `brother. im sorry brother. i couldn't find ${searchDiscordId} in my database brother. maybe they didn't sign up.`
							: `yo bro. thank you brother. you sent me a discord id of ${searchDiscordId}. i think their roblox id is ${foundRobloxId}`,
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
