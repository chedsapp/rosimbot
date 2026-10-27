import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";
import { exchangeCodeForToken, generateAuthorizationURL, ObtainTokenResponse, StateToken, verifyStateJWT } from "./oauth/roblox";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname == "/test-auth") {
			let user_id: string | null = url.searchParams.get("user");
			if (user_id == null) {
				return new Response(null, {status: 400})
			}
			return Response.redirect(generateAuthorizationURL(user_id, env))
		}

		if (url.pathname == "/roblox/callback") {
			let code: string | null = url.searchParams.get("code");
			let state: string | null = url.searchParams.get("state");
			if (code == null || state == null) {
				return new Response("invalid request", {status: 400})
			}
			let state_token: StateToken;
			try {
				state_token = verifyStateJWT(state, env.JWT_SECRET);
			} catch (err) {
				if (err instanceof TokenExpiredError) {
					return new Response("Login expired, try again", {status: 400})
				} else {
					return new Response("invalid state", {status: 400})
				}
			}

			let token: ObtainTokenResponse = await exchangeCodeForToken(code, env);

			console.log(token)

			return new Response(null);
		}

		if (request.method !== "POST") return new Response("Ok")

		const signature = request.headers.get("X-Signature-Ed25519");
		const timestamp = request.headers.get("X-Signature-Timestamp");
		const body = await request.text();

		const valid = signature && timestamp &&
			(await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
		if (!valid) return new Response('Bad request signature', { status: 401 });

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
