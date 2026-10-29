import { env } from "cloudflare:workers";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export interface StateToken {
	userid: string;
}

export async function generateStateJWT(data: StateToken): Promise<string> {
	return await new SignJWT({ ...data })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(encoder.encode(env.JWT_SECRET));
}

export async function verifyStateJWT(state: string): Promise<StateToken> {
	const { payload } = await jwtVerify<StateToken>(state, encoder.encode(env.JWT_SECRET), {
		algorithms: ["HS256"],
	});
	return payload;
}

export async function generateAuthorizationURL(userid: string): Promise<string> {
	const url = new URL(`${env.ROBLOX_BASE_OAUTH_URL}/authorize`);
	url.search = new URLSearchParams({
		client_id: env.ROBLOX_CLIENT_ID,
		redirect_uri: env.ROBLOX_REDIRECT_URI,
		scope: "openid profile",
		response_type: "code",
		state: await generateStateJWT({ userid }),
	}).toString();
	return url.toString();
}
