const { DISCORD_APPLICATION_ID, DISCORD_TOKEN } = process.env;

const commands = [
	{ name: "ping", type: 1, description: "Hello bro" },
]

const res = await fetch(
	`https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`,
	{
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bot ${DISCORD_TOKEN}` },
		body: JSON.stringify(commands),
	},
);

console.log(res.status, JSON.stringify(await res.json()));