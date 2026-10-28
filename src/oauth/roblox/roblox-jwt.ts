import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

export interface RobloxIdToken extends JWTPayload {
	sub: string;
	name?: string;
	nickname?: string;
	preferred_username?: string;
	created_at?: number;
	profile?: string;
	picture?: string | null;
	nonce?: string;
}

// Created once at module scope so the keys are cached between requests
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getRobloxJWKs(env: Env) {
	jwks ??= createRemoteJWKSet(new URL(`${env.ROBLOX_BASE_API_URI}/certs`));
	return jwks;
}

export async function verifyRobloxJWT(token: string, env: Env): Promise<RobloxIdToken> {
	const { payload } = await jwtVerify<RobloxIdToken>(token, getRobloxJWKs(env), {
		issuer: "https://apis.roblox.com/oauth/",
		audience: env.ROBLOX_CLIENT_ID,
		clockTolerance: 5,
	});
	return payload;
}
