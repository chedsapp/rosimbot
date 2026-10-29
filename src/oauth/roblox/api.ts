import { env } from "cloudflare:workers";

export interface ObtainTokenResponse {
	access_token: string;
	refresh_token: string;
	id_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		throw new Error(`${url} failed: ${response.status} ${await response.text()}`);
	}
	return (await response.json()) as T;
}

export function exchangeCodeForToken(code: string): Promise<ObtainTokenResponse> {
	return fetchJson(`${env.ROBLOX_BASE_API_URI}/token`, {
		method: "POST",
		body: new URLSearchParams({
			code,
			grant_type: "authorization_code",
			redirect_uri: env.ROBLOX_REDIRECT_URI,
			client_id: env.ROBLOX_CLIENT_ID,
			client_secret: env.ROBLOX_CLIENT_SECRET,
		}),
	});
}

export function exchangeRefreshToken(refresh_token: string): Promise<ObtainTokenResponse> {
	return fetchJson(`${env.ROBLOX_BASE_API_URI}/token`, {
		method: "POST",
		body: new URLSearchParams({
			refresh_token,
			grant_type: "refresh_token",
			client_id: env.ROBLOX_CLIENT_ID,
			client_secret: env.ROBLOX_CLIENT_SECRET,
		}),
	});
}
