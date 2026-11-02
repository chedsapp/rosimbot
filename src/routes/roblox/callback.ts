import { DiscordAPIError } from "@discordjs/rest";
import { APIDMChannel, MessageFlags, Routes } from "discord-api-types/v10";
import { DISCORD_REST } from "../../api/discord";
import { getRobloxUserThumbnail } from "../../api/roblox";
import { linkAccount } from "../../db/linking";
import page from "../../liquid";
import { ERRORS, OAuthError } from "../../oauth/constants";
import { ObtainTokenResponse, StateToken, exchangeCodeForToken, verifyRobloxJWT, verifyStateJWT } from "../../oauth/roblox";
import { buildRoleDiffContainer, updateVerifiedRoles } from "../../utils/roles";

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
				if (previous) {
					await updateVerifiedRoles(previous, "remove");
				}
				const changes = await updateVerifiedRoles(state_token.userid, "add");
				const footer = changes.length > 0 ? `${changes.length} role${changes.length === 1 ? "" : "s"} synced!` : "You're already up to date!";

				let dmChannel: APIDMChannel | null;
				try {
					dmChannel = (await DISCORD_REST.post(Routes.userChannels(), { body: { recipient_id: state_token.userid } })) as APIDMChannel;
				} catch (e) {
					if (e instanceof DiscordAPIError && [404, 403].includes(e.status)) {
						// probably has dms closed, ignore
						dmChannel = null;
					} else {
						throw e;
					}
				}
				if (dmChannel) {
					try {
						await DISCORD_REST.post(Routes.channelMessages(dmChannel.id), {
							body: {
								flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
								components: [buildRoleDiffContainer(
									"✅ Verified", 
									changes, 
									footer, 
									`You have been linked to [${idToken.preferred_username}](https://roblox.com/users/${idToken.sub}/profile).\n## 🔄️ Roles Synced`
								).toJSON()],
							},
						});
					} catch (e) {
						// probably has dms closed, ignore
						if (!(e instanceof DiscordAPIError && [404, 403].includes(e.status))) {
							throw e;
						}
					}
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
