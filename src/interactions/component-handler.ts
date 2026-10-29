import {
	type APIInteractionResponse,
	InteractionResponseType,
	MessageFlags,
	APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { CommandParseError, type ComponentModule } from "./types";
import { genericErrorCV2 } from "./utils";

import * as select_guildConfigRole from "./components/selects/guildConfigRole";

export const components = [select_guildConfigRole] satisfies ComponentModule[];

export class ComponentHandler {
	private readonly map: Map<string, ComponentModule>;

	constructor(readonly components: ComponentModule[]) {
		this.map = new Map(components.map((c) => [c.COMPONENT.custom_id, c]));
	}

	fetch = async (interaction: APIMessageComponentInteraction, ctx: ExecutionContext): Promise<Response> => {
		const component = this.map.get(interaction.data.custom_id);
		if (!component) return this.reply(this.error("Unknown component"));

		try {
			const res = await component.callback(interaction, { waitUntil: (p) => ctx.waitUntil(p) });
			return this.reply(res);
		} catch (err) {
			console.error(`component ${component.COMPONENT.custom_id} failed:`, err);
			if (err instanceof CommandParseError) {
				return this.reply(this.error(err.message));
			}
			return this.reply(this.error("Internal server error."));
		}
	};

	private reply(res: APIInteractionResponse) {
		return Response.json(res);
	}

	private error(content: string): APIInteractionResponse {
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { ...genericErrorCV2(content), flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 },
		};
	}
}

const COMPONENT_HANDLER = new ComponentHandler(components);
export default COMPONENT_HANDLER;
