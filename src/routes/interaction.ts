import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";
import {} from "@discordjs/builders";
import COMMAND_HANDLER from "../interactions";
import { env } from "cloudflare:workers";

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

	return new Response("Unknown interaction", { status: 400 });
}
