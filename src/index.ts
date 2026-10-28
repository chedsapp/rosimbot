import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import {
	exchangeCodeForToken,
	generateAuthorizationURL,
	ObtainTokenResponse,
	StateToken,
	verifyRobloxJWT,
	verifyStateJWT,
} from './oauth/roblox/index';
import { JWTExpired } from 'jose/errors';
import { linkAccount } from './db/linking';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// if (url.pathname == "/test-auth") {
		// 	let user_id: string | null = url.searchParams.get("user");
		// 	if (user_id == null) {
		// 		return new Response(null, {status: 400})
		// 	}
		// 	return Response.redirect(await generateAuthorizationURL(user_id, env))
		// }

		if (url.pathname == '/roblox/callback') {
			let code: string | null = url.searchParams.get('code');
			let state: string | null = url.searchParams.get('state');
			if (code == null || state == null) {
				return new Response('invalid request', { status: 400 });
			}
			let state_token: StateToken;
			try {
				state_token = await verifyStateJWT(state, env.JWT_SECRET);
			} catch (err) {
				if (err instanceof JWTExpired) {
					return new Response('Login expired, try again', { status: 400 });
				} else {
					return new Response('invalid state', { status: 400 });
				}
			}

			let token: ObtainTokenResponse = await exchangeCodeForToken(code, env);

			const idToken = await verifyRobloxJWT(token.id_token, env);
			const previous = await linkAccount(env.rosimbot, state_token.userid, idToken.sub);

			return new Response(`Linked to ${idToken.preferred_username}! You can close this fucking tab.`);
		}

		if (request.method !== 'POST') return new Response('Ok');

		const signature = request.headers.get('X-Signature-Ed25519');
		const timestamp = request.headers.get('X-Signature-Timestamp');
		const body = await request.text();

		const valid = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
		if (!valid) return new Response('Bad request signature', { headers: { 'Content-Type': 'application/json' }, status: 401 });

		const interaction = JSON.parse(body);

		if (interaction.type === InteractionType.PING) {
			// bing bong bing bing bong
			return Response.json({ type: InteractionResponseType.PONG });
		}

		if (interaction.type === InteractionType.APPLICATION_COMMAND) {
			switch (interaction.data.name) {
				case 'ping':
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: { content: 'pong' },
					});
				case 'verify':
					// idk which one to use
					const discordId = interaction.member?.user.id ?? interaction.user.id;
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							flags: 64, // ephemeral
							content: 'Click below to link your fucking Roblox account',
							components: [
								{ type: 1, components: [{ type: 2, style: 5, label: 'Verify', url: await generateAuthorizationURL(discordId, env) }] },
							],
						},
					});
			}
		}

		return new Response('Unknown interaction', { status: 400 });
	},
} satisfies ExportedHandler<Env>;
