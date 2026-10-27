import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== "POST") return new Response("Ok")

		const signature = request.headers.get("X-Signature-Ed25519");
		const timestamp = request.headers.get("X-Signature-Timestamp");
		const body = await request.text();

		const valid = signature && timestamp &&
			(await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
		if (!valid) return new Response('Bad request signature', { headers: { "Content-Type": "application/json" }, status: 401 });

		const interaction = JSON.parse(body);

		if (interaction.type === InteractionType.PING) { // bing bong bing bing bong
			return Response.json({ type: InteractionResponseType.PONG });
		}

		if (interaction.type === InteractionType.APPLICATION_COMMAND) {
			switch (interaction.data.name) {
				case 'ping':
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: { content: 'pong' },
					});
			}
		}

		return new Response('Unknown interaction', { status: 400 });
	},
} satisfies ExportedHandler<Env>;
