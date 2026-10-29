import { ButtonBuilder, ComponentBuilder, SelectMenuBuilder } from "@discordjs/builders";
import {
	APIButtonComponentWithCustomId,
	APIMessageRoleSelectInteractionData,
	APISelectMenuComponent,
	ButtonStyle,
	type APIChatInputApplicationCommandInteraction,
	type APIInteractionResponse,
	type APIMessageComponentInteraction,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

export interface InteractionContext {
	waitUntil: (p: Promise<unknown>) => void;
}

// Commands
export type CommandDefinition = RESTPostAPIChatInputApplicationCommandsJSONBody;

export type CommandCallback = (
	interaction: APIChatInputApplicationCommandInteraction,
	ctx: InteractionContext,
) => Promise<APIInteractionResponse>;

export interface CommandModule {
	COMMAND: CommandDefinition;
	callback: CommandCallback;
}

export class CommandParseError extends Error {
	constructor(public message: string) {
		super(message);
	}
}

// Components
export type ComponentDefinition = APIButtonComponentWithCustomId | APISelectMenuComponent;

export type ComponentCallback = (
	interaction: APIMessageComponentInteraction,
	ctx: InteractionContext,
) => Promise<APIInteractionResponse>;

export interface ComponentModule {
	COMPONENT: ComponentDefinition;
	callback: ComponentCallback;
}

export class ComponentParseError extends Error {
	constructor(public message: string) {
		super(message);
	}
}

export type RoleSelectInteraction = APIMessageComponentInteraction & {
  data: APIMessageRoleSelectInteractionData;
};