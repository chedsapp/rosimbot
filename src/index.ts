import { verifyKey, InteractionType, InteractionResponseType, InteractionResponseFlags } from "discord-interactions";
import {
	exchangeCodeForToken,
	generateAuthorizationURL,
	ObtainTokenResponse,
	StateToken,
	verifyRobloxJWT,
	verifyStateJWT,
} from "./oauth/roblox/index";
import { JWTExpired } from "jose/errors";
import { linkAccount } from "./db/linking";
import { Liquid } from "liquidjs";
import { ERRORS, OAuthError } from "./oauth/constants";
import layoutView from "../views/layout.liquid";
import errorView from "../views/error.liquid";
import successView from "../views/success.liquid";
import { APIBaseInteraction, ButtonStyle, ComponentType } from "discord-api-types/v9";
import { isApplicationCommandGuildInteraction } from "discord-api-types/utils";

// Workers have no filesystem, so templates are bundled as text and served from memory
export const engine = new Liquid({
	templates: {
		layout: layoutView,
		error: errorView,
		success: successView,
	},
	cache: true,
	outputEscape: "escape",
});

export async function page(name: string, ctx: Record<string, unknown>, status = 200) {
	const html = await engine.renderFile(name, ctx);
	return new Response(html, {
		status,
		headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
	});
}

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

		if (url.pathname == "/roblox/callback") {
			let code: string | null = url.searchParams.get("code");
			let state: string | null = url.searchParams.get("state");

			try {
				const providerError = url.searchParams.get("error");
				if (providerError) throw new OAuthError(providerError);

				if (code == null) {
					throw new OAuthError("missing_code", 400);
				}
				if (state == null) {
					throw new OAuthError("state_mismatch", 403);
				}

				let state_token: StateToken;
				try {
					state_token = await verifyStateJWT(state, env.JWT_SECRET);
				} catch (err) {
					throw new OAuthError("state_mismatch", 403);
				}

				let token: ObtainTokenResponse;
				try {
					token = await exchangeCodeForToken(code, env);
				} catch (err) {
					console.error("token exchange failed", err);
					throw new OAuthError("token_exchange_failed", 502);
				}

				const idToken = await verifyRobloxJWT(token.id_token, env);
				//const previous = await linkAccount(env.rosimbot, state_token.userid, idToken.sub);

				return page("success", { title: "verified", kind: "ok", user: idToken.preferred_username });
			} catch (e) {
				const known = e instanceof OAuthError;
				if (!known) console.error("oauth callback failed", e);

				const code = known && ERRORS[e.code] ? e.code : "internal_error";
				const [heading, message] = ERRORS[code];
				return page(
					"error",
					{
						title: heading,
						kind: "err",
						heading,
						message,
						code,
						retry_url: "/login",
					},
					known ? e.status : 500,
				);
			}
		}

		if (request.method !== "POST") return new Response("Ok");

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
			switch (interaction.data.name) {
				case "ping":
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: { content: "pong" },
					});
				case "verify":
					// idk which one to use
					const discordId = interaction.member?.user.id ?? interaction.user.id;
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
							components: [
								{ type: ComponentType.Container, components: [
									{ 
										type: ComponentType.Section, 
										components: [{ type: ComponentType.TextDisplay, text: "Click the button below to verify your Roblox account.\nDo not share this link." }],
										accessory: {type: ComponentType.Thumbnail, media: {url: `https://cdn.discordapp.com/icons/${interaction.guild_id}/${interaction.guild.icon}.webp`}}
									},
								]},
								{ type: ComponentType.ActionRow, components: [{ type: ComponentType.Button, style: ButtonStyle.Link, label: "Verify", url: await generateAuthorizationURL(discordId, env) }] },
							],
						},
					});
			}
		}

		return new Response("Unknown interaction", { status: 400 });
	},
} satisfies ExportedHandler<Env>;
