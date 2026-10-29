import { REST, RESTOptions } from "@discordjs/rest";
import { env } from "cloudflare:workers";

export const DISCORD_REST = new REST({
	version: "10",
	makeRequest: fetch.bind(globalThis) as unknown as RESTOptions["makeRequest"],
	hashSweepInterval: 0,
	handlerSweepInterval: 0,
});

DISCORD_REST.setToken(env.DISCORD_TOKEN);
