import { linkAccount } from "../../db/linking";
import page from "../../liquid";
import { ERRORS, OAuthError } from "../../oauth/constants";
import { StateToken, verifyStateJWT, ObtainTokenResponse, exchangeCodeForToken, verifyRobloxJWT } from "../../oauth/roblox";

export async function handleRobloxCallback(request: Request, env: Env, ctx: ExecutionContext) {
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
		const previous = await linkAccount(env.rosimbot, state_token.userid, idToken.sub);

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
			},
			known ? e.status : 500,
		);
	}
}
