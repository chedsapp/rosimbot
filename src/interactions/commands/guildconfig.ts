import { SlashCommandBuilder } from "@discordjs/builders";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { getGuildConfig } from "../../db/guild";

export const COMMAND = new SlashCommandBuilder()
	.setName("guildconfig")
	.setDescription("Show the guild's configuration")
	.setDefaultMemberPermissions(0)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	const guildId = interaction.guild_id;
	if (guildId == null) {
		throw new CommandParseError("Guild ID is null");
	}

	const config = await getGuildConfig(guildId);
	const verifiedRole = config.verifiedRoleId == null ? "Not set" : `<@&${config.verifiedRoleId}>`;

	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: `**Guild config**\nVerified role: ${verifiedRole}`,
			allowed_mentions: { parse: [] },
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		},
	};
};
