import { Routes } from "discord-api-types/v10";
import { DISCORD_REST } from "../../api/discord";
import { getRobloxUserThumbnail } from "../../api/roblox";
import { getAllGuildConfigs } from "../../db/guild";
import { linkAccount } from "../../db/linking";
import page from "../../liquid";
import { ERRORS, OAuthError } from "../../oauth/constants";
import { StateToken, verifyStateJWT, ObtainTokenResponse, exchangeCodeForToken, verifyRobloxJWT } from "../../oauth/roblox";

export async function handleRobloxCallback(request: Request, ctx: ExecutionContext) {
	const url = new URL(request.url);

	const code: string | null = url.searchParams.get("code");
	const state: string | null = url.searchParams.get("state");

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
			state_token = await verifyStateJWT(state);
		} catch (err) {
			throw new OAuthError("state_mismatch", 403);
		}

		let token: ObtainTokenResponse;
		try {
			token = await exchangeCodeForToken(code);
		} catch (err) {
			console.error("token exchange failed", err);
			throw new OAuthError("token_exchange_failed", 502);
		}

		const idToken = await verifyRobloxJWT(token.id_token);
		const previous = await linkAccount(state_token.userid, idToken.sub);

		ctx.waitUntil(
			(async () => {
				const allGuildConfigs = await getAllGuildConfigs();

				for (const [guildId, config] of allGuildConfigs) {
					const roleId = config.verifiedRoleId;
					if (roleId == null) {
						continue;
					}
					if (previous) {
						DISCORD_REST.delete(Routes.guildMemberRole(guildId, previous, roleId));
					}
					DISCORD_REST.put(Routes.guildMemberRole(guildId, state_token.userid, roleId));
				}
			})(),
		);

		let headshot: string | undefined;
		try {
			headshot = await getRobloxUserThumbnail(idToken.sub, { size: 352, format: "PNG", shape: "ROUND" });
		} catch (err) {
			console.error("headshot fetch failed", err);
		}

		return page("success", { title: "RoSim Verification", kind: "ok", user: idToken.preferred_username, headshot });
	} catch (e) {
		const known = e instanceof OAuthError;
		if (!known) console.error("oauth callback failed", e);

		const code = known && ERRORS[e.code] ? e.code : "internal_error";
		const [heading, message] = ERRORS[code];
		return page(
			"error",
			{
				title: "RoSim Verification",
				kind: "err",
				heading,
				message,
				code,
			},
			known ? e.status : 500,
		);
	}
}
