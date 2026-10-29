import { env } from "cloudflare:workers";

const DEFAULT_HEADER = {"x-api-key": env.ROBLOX_API_KEY}

function fetchRoblox(url: string | URL | Request<unknown, CfProperties<unknown>>, options: RequestInit<CfProperties<unknown>> | undefined = undefined): Promise<Response> {
    url = env.ROBLOX_BASE_API_URL + url
    if (options) {
        options.headers = {...options.headers, ...DEFAULT_HEADER}
    } else {
        options = {headers: DEFAULT_HEADER}
    }
    return fetch(url, options)
}

function getUser(userid: string): Promise<Response> {
    return fetchRoblox(`/users/${userid}`)
}