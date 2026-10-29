import { ActionRowBuilder, ContainerBuilder, RoleSelectMenuBuilder, SlashCommandBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { getGuildConfig } from "../../db/guild";
import * as select_guildConfigRole from "../components/selects/guildConfigRole";

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

	const select = new RoleSelectMenuBuilder(select_guildConfigRole.COMPONENT);
	if (config.verifiedRoleId !== null) {
		select.setDefaultRoles(config.verifiedRoleId);
	}

	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			components: [
				new ContainerBuilder()
					.addTextDisplayComponents(new TextDisplayBuilder().setContent("# Guild Config\n## Verified Role"))
					.addActionRowComponents(new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(select))
					.toJSON(),
			],
			allowed_mentions: { parse: [] },
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		},
	};
};
