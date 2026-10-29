import { env } from "cloudflare:workers";
import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import COMMAND_HANDLER from "../interactions/command-handler";
import COMPONENT_HANDLER from "../interactions/component-handler";

export default async function handleInteraction(request: Request, ctx: ExecutionContext) {
	const signature = request.headers.get("X-Signature-Ed25519");
	const timestamp = request.headers.get("X-Signature-Timestamp");
	const body = await request.text();

	const valid = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!valid) return new Response("Bad request signature", { headers: { "Content-Type": "application/json" }, status: 401 });

	const interaction = JSON.parse(body);

	if (interaction.type === InteractionType.PING) {
		// bing bong bing bing bong
		return Response.json({ type: InteractionResponseType.PONG });
	}

	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		return await COMMAND_HANDLER.fetch(interaction, ctx);
	}

	if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
		return await COMPONENT_HANDLER.fetch(interaction, ctx);
	}

	return new Response("Unknown interaction", { status: 400 });
}
