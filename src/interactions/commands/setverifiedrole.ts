import { SlashCommandBuilder, SlashCommandRoleOption } from "@discordjs/builders";
import { ApplicationCommandOptionType, InteractionResponseType } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { editOriginal } from "../utils";
import { setVerifiedRole } from "../../db/guild";

export const COMMAND = new SlashCommandBuilder()
	.setName("setverifiedrole")
	.setDescription("Set the guild's verification role")
	.addRoleOption(new SlashCommandRoleOption().setName("role").setDescription("The role to set").setRequired(true))
    .setDefaultMemberPermissions(0)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	const roleOpt = interaction.data.options?.find((o) => o.name === "role");
	if (roleOpt?.type !== ApplicationCommandOptionType.Role) {
		throw new CommandParseError("Invalid type for role option");
	}

    const guildId = interaction.guild_id;
    if (guildId == null) {
        throw new CommandParseError("Guild ID is null");
    }

	ctx.waitUntil(
		(async () => {
			try {
				await setVerifiedRole(guildId, roleOpt.value);
				await editOriginal(interaction, {
					content: `Verified role set to <@&${roleOpt.value}>.`,
					allowed_mentions: { parse: [] },
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
