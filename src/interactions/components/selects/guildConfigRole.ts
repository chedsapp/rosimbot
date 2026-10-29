import { RoleSelectMenuBuilder } from "@discordjs/builders";
import { APIGuild, APIRole, InteractionResponseType, MessageFlags, PermissionFlagsBits, Routes } from "discord-api-types/v10";
import { DISCORD_REST } from "../../../api/discord";
import { setVerifiedRole } from "../../../db/guild";
import { hasPermission, sortRole } from "../../../utils/permissions";
import { ComponentCallback, ComponentDefinition, ComponentParseError } from "../../types";
import { assertRoleSelect, editOriginal, genericErrorCV2, genericSuccessCV2 } from "../../utils";

export const COMPONENT = new RoleSelectMenuBuilder()
	.setPlaceholder("Select a role...")
	.setMaxValues(1)
	.setMinValues(0)
	.setCustomId("selects/guildConfigRole")
	.toJSON() satisfies ComponentDefinition;

export const callback: ComponentCallback = async (interaction, ctx) => {
	assertRoleSelect(interaction);
	const invokerId = interaction.member?.user.id ?? interaction.user?.id;
	if (invokerId !== interaction.message.interaction_metadata?.user.id) {
		return { type: InteractionResponseType.DeferredMessageUpdate }; // ignore
	}
	const permissions = interaction.member?.permissions;
	const guildId = interaction.guild_id;
	if (guildId === undefined) {
		throw new ComponentParseError("Not in a guild");
	}
	const roleId = interaction.data?.values ? interaction.data?.values[0] : null;
	let resolvedRole: APIRole | undefined;
	if (roleId !== null) {
		resolvedRole = interaction.data?.resolved.roles[roleId];
		if (resolvedRole === undefined) {
			throw new ComponentParseError("Role did not resolve");
		}
	}

	ctx.waitUntil(
		(async () => {
			const guild: APIGuild = (await DISCORD_REST.get(Routes.guild(guildId))) as APIGuild;
			if (resolvedRole) {
				if (guild.owner_id !== invokerId) {
					if (!hasPermission(permissions, PermissionFlagsBits.ManageRoles)) {
						await editOriginal(interaction, {
							flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
							...genericErrorCV2("You do not have permission use this menu!"),
						});
						return;
					}
					const guildRoles: APIRole[] = (await DISCORD_REST.get(Routes.guildRoles(guildId))) as APIRole[];
					const roleById = new Map(guildRoles.map((role) => [role.id, role]));
					const memberRoleIds = interaction.member?.roles;
					const memberRoles: APIRole[] = (memberRoleIds ?? [])
						.map((id) => roleById.get(id))
						.filter((role): role is APIRole => role !== undefined);
					const topMemberRole = memberRoles.toSorted((a, b) => sortRole(a, b))[0];
					if (sortRole(resolvedRole, topMemberRole) !== -1) {
						await editOriginal(interaction, {
							flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
							...genericErrorCV2("You do not have permission to assign that role!"),
						});
						return;
					}
				}
			}
			await setVerifiedRole(guildId, roleId);
			await editOriginal(interaction, {
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				...genericSuccessCV2(`Set <@&${roleId}> as the verified role for ${guild.name}`),
				allowed_mentions: {},
			});
			return;
		})(),
	);

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: { flags: MessageFlags.Ephemeral },
	};
};
