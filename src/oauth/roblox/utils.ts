import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

const encoder = new TextEncoder();

export interface StateToken {
	userid: string;
}

export async function generateStateJWT(data: StateToken, secret: string): Promise<string> {
	return await new SignJWT({ ...data })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(encoder.encode(secret));
}

export async function verifyStateJWT(state: string, secret: string): Promise<StateToken> {
	const { payload } = await jwtVerify<StateToken>(state, encoder.encode(secret), {
		algorithms: ["HS256"],
	});
	return payload;
}

export async function generateAuthorizationURL(userid: string, env: Env): Promise<string> {
	const url = new URL(`${env.ROBLOX_BASE_API_URI}/authorize`);
	url.search = new URLSearchParams({
		client_id: env.ROBLOX_CLIENT_ID,
		redirect_uri: env.ROBLOX_REDIRECT_URI,
		scope: "openid profile",
		response_type: "code",
		state: await generateStateJWT({ userid }, env.JWT_SECRET),
	}).toString();
	return url.toString();
}
