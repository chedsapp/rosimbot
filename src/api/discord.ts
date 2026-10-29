import { REST, RESTOptions } from "@discordjs/rest";

export const DISCORD_REST = new REST({
	version: "10",
	makeRequest: fetch.bind(globalThis) as unknown as RESTOptions["makeRequest"],
	hashSweepInterval: 0,
	handlerSweepInterval: 0,
});
