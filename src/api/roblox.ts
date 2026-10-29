import { env } from "cloudflare:workers";
import { GenerateThumbnailOperation, GenerateThumbnailOptions, RobloxUser } from "./types/roblox";

const DEFAULT_HEADER = { "x-api-key": env.ROBLOX_API_KEY };


class RobloxAPIError extends Error {
    constructor(
		public message: string,
		public status = 400,
	) {
		super(message);
	}
}

async function fetchRoblox(
	url: string | URL | Request<unknown, CfProperties<unknown>>,
	options: RequestInit<CfProperties<unknown>> | undefined = undefined,
): Promise<unknown> {
	url = env.ROBLOX_BASE_API_URL + url;
	if (options) {
		options.headers = { ...options.headers, ...DEFAULT_HEADER };
	} else {
		options = { headers: DEFAULT_HEADER };
	}
	const res = await fetch(url, options);
    if (!res.ok) {
        throw new RobloxAPIError(await res.text(), res.status)
    }
    return await res.json()
}

export async function getRobloxUser(userid: string): Promise<RobloxUser> {
	return (await fetchRoblox(`/v2/users/${userid}`)) as RobloxUser;
}

export async function getRobloxUserThumbnail(userid: string, options: GenerateThumbnailOptions | undefined = undefined): Promise<string> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options ?? {})) {
        if (value !== undefined) params.set(key, String(value));
    }
	let operation: GenerateThumbnailOperation = (await fetchRoblox(`/v2/users/${userid}:generateThumbnail?${params.toString()}`)) as GenerateThumbnailOperation;
    console.log(operation)
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 100)) // sleep 100ms
        operation = (await fetchRoblox(operation.path)) as GenerateThumbnailOperation
    }
    if (operation.error) {
        throw new RobloxAPIError(`code ${operation.error.code}: ${operation.error.message}`, 500)
    }
    return operation.response.imageUri;
}
