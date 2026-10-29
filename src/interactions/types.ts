import type {
	APIChatInputApplicationCommandInteraction,
	APIInteractionResponse,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

export type CommandDefinition = RESTPostAPIChatInputApplicationCommandsJSONBody;

export interface CommandContext {
	waitUntil: (p: Promise<unknown>) => void;
}

export type CommandCallback = (
	interaction: APIChatInputApplicationCommandInteraction,
	ctx: CommandContext,
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
