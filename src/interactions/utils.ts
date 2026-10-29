import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { DiscordAPIError } from "@discordjs/rest";
import {
	type APIInteraction,
	APIMessageComponentInteraction,
	ComponentType,
	type RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPatchAPIWebhookWithTokenMessageResult,
	RESTPostAPIChannelMessageJSONBody,
	Routes,
} from "discord-api-types/v10";
import { DISCORD_REST } from "../api/discord";
import { ComponentParseError, RoleSelectInteraction } from "./types";

export async function editOriginal(
	interaction: APIInteraction,
	body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
	retries = 3,
): Promise<RESTPatchAPIWebhookWithTokenMessageResult> {
	const route = Routes.webhookMessage(interaction.application_id, interaction.token, "@original");

	for (let attempt = 0; ; attempt++) {
		try {
			return (await DISCORD_REST.patch(route, { body, auth: false })) as RESTPatchAPIWebhookWithTokenMessageResult;
		} catch (err) {
			// sometimes this can run before the http handler has returned (probably not very often)
			// so we retry
			const notReadyYet = err instanceof DiscordAPIError && err.status === 404;
			if (!notReadyYet || attempt >= retries) throw err;
			await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
		}
	}
}

export function genericErrorCV2(message: string): RESTPostAPIChannelMessageJSONBody {
	return {
		components: [
			new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(message)).setAccentColor(0xe74c3c).toJSON(),
		],
	};
}

export function genericSuccessCV2(message: string): RESTPostAPIChannelMessageJSONBody {
	return {
		components: [
			new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(message)).setAccentColor(0x2ecc71).toJSON(),
		],
	};
}

export function assertRoleSelect(interaction: APIMessageComponentInteraction): asserts interaction is RoleSelectInteraction {
	if (interaction.data.component_type !== ComponentType.RoleSelect) {
		throw new ComponentParseError("Expected a role select");
	}
}
