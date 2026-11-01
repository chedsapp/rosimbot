import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationIntegrationType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { unlinkAccount } from "../../db/linking";
import { buildRoleDiffContainer, updateVerifiedRoles } from "../../utils/roles";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { editOriginal, genericErrorCV2 } from "../utils";

export const COMMAND = new SlashCommandBuilder()
	.setName("unverify")
	.setDescription("Unlink your Roblox account and remove your verified roles")
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
	const invokerId = interaction.member?.user.id ?? interaction.user?.id;
	if (invokerId == null) {
		throw new CommandParseError("Failed to get command invoker ID.");
	}

	ctx.waitUntil(
		(async () => {
			try {
				const removedRobloxId = await unlinkAccount(invokerId);
				if (removedRobloxId === null) {
					await editOriginal(interaction, {
						flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
						...genericErrorCV2("You aren't verified brother"),
					});
					return;
				}

				const changes = await updateVerifiedRoles(invokerId, "remove");
				await editOriginal(interaction, {
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
					components: [
						buildRoleDiffContainer("🔓 Unverified", changes, "Your Roblox account has been unlinked. Use /verify to link again.").toJSON(),
					],
				});
			} catch (err) {
				console.error("/unverify failed", err);
				await editOriginal(interaction, {
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
					...genericErrorCV2("Something went wrong while unverifying. Please try again."),
				}).catch(() => {});
			}
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
