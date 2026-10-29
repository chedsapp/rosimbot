import {
	type APIInteractionResponse,
	InteractionResponseType,
	MessageFlags,
	APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { CommandParseError, type CommandModule } from "./types";
import { genericErrorCV2 } from "./utils";
import * as verify from "./commands/verify";
import * as whois from "./commands/whois";
import * as ping from "./commands/ping";
import * as setverifiedrole from "./commands/setverifiedrole";
import * as guildconfig from "./commands/guildconfig";

export const commands = [verify, whois, ping, setverifiedrole, guildconfig] satisfies CommandModule[];

export class CommandHandler {
	private readonly map: Map<string, CommandModule>;

	constructor(readonly commands: CommandModule[]) {
		this.map = new Map(commands.map((c) => [c.COMMAND.name, c]));
	}

	fetch = async (interaction: APIChatInputApplicationCommandInteraction, ctx: ExecutionContext): Promise<Response> => {
		const command = this.map.get(interaction.data.name);
		if (!command) return this.reply(this.error("Unknown command."));

		try {
			const res = await command.callback(interaction, { waitUntil: (p) => ctx.waitUntil(p) });
			return this.reply(res);
		} catch (err) {
			console.error(`/${interaction.data.name} failed:`, err);
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

	private async verify(publicKey: string, body: string, sig: string | null, ts: string | null) {
		if (!sig || !ts) return false;
		const hex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (b) => parseInt(b, 16));
		const key = await crypto.subtle.importKey("raw", hex(publicKey), { name: "Ed25519" }, false, ["verify"]);
		return crypto.subtle.verify("Ed25519", key, hex(sig), new TextEncoder().encode(ts + body));
	}
}

const COMMAND_HANDLER = new CommandHandler(commands);
export default COMMAND_HANDLER;
