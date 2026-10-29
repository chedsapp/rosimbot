import { REST, RESTOptions } from "@discordjs/rest";
import { RESTPutAPIApplicationCommandsResult, Routes } from "discord-api-types/v10";
import { commands } from "../src/interactions/command-handler";

const { DISCORD_APPLICATION_ID, DISCORD_TOKEN } = process.env;

const publish_commands = commands.map((c) => c.COMMAND);

const discordRest = new REST({
	version: "10",
	makeRequest: fetch as unknown as RESTOptions["makeRequest"],
	hashSweepInterval: 0,
	handlerSweepInterval: 0,
});

discordRest.setToken(DISCORD_TOKEN);

const res = (await discordRest.put(Routes.applicationCommands(DISCORD_APPLICATION_ID), {
	body: publish_commands,
})) as RESTPutAPIApplicationCommandsResult;

console.log(res);
