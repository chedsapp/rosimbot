import {
    ActionRowBuilder,
	ButtonBuilder,
	ContainerBuilder,
	SectionBuilder,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	TextDisplayBuilder,
    ThumbnailBuilder,
} from "@discordjs/builders";
import { APIButtonComponent, APIButtonComponentWithCustomId, ApplicationCommandOptionType, ApplicationIntegrationType, ChannelType, InteractionContextType, InteractionResponseType, MessageFlags, Routes } from "discord-api-types/v10";
import { CommandCallback, CommandDefinition, CommandParseError } from "../types";
import { DISCORD_REST } from "../../api/discord";

import * as button_verify from "../components/buttons/verify";
import * as button_syncRoles from "../components/buttons/syncRoles";
import { editOriginal, genericErrorCV2, genericSuccessCV2 } from "../utils";

export const COMMAND = new SlashCommandBuilder()
	.setName("send-button")
	.setDescription("Send a button for verification to a channel")
	.setDefaultMemberPermissions(0)
    .addChannelOption(
        new SlashCommandChannelOption().addChannelTypes(ChannelType.GuildText).setName("channel").setDescription("The channel to send the button in.")
    )
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
	.toJSON() satisfies CommandDefinition;

export const callback: CommandCallback = async (interaction, ctx) => {
    const channelOpt = interaction.data.options?.find((o) => o.name === "channel");
    if (channelOpt?.type !== ApplicationCommandOptionType.Channel) {
        // option missing or wrong type: reply with an error
        throw new CommandParseError("Invalid type for channel option");
    }
    const channelId = channelOpt.value;
    
    ctx.waitUntil((async () => {
        try {
            await DISCORD_REST.post(Routes.channelMessages(channelId), {
                body: {
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                        .addTextDisplayComponents(
                        )
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(    
                                    new TextDisplayBuilder().setContent("# RoSim Verification"),
                                    new TextDisplayBuilder().setContent("Click Verify to link your Roblox account."),
                                    new TextDisplayBuilder().setContent("Click Sync Roles to synchronize your roles."),
                                )
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL("https://cdn.discordapp.com/icons/1393308664151932938/7ab93dfc9958cbe2bd620d0f46280a33.webp")),
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(
                                    new ButtonBuilder(button_verify.COMPONENT),
                                    new ButtonBuilder(button_syncRoles.COMPONENT),
                                )
                        )
                    ]
                }
            })
        } catch (e) {
            console.error(e);
            await editOriginal(interaction, {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                ...await genericErrorCV2("something broke brother")
            })
            return;
        }
        await editOriginal(interaction, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            ...await genericSuccessCV2("Message sent!")
        })
    })())

	return {
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: {
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		},
	};
};
