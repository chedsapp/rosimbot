import { ComponentType, ButtonStyle } from "discord-api-types/v10";
import { verifyKey, InteractionType, InteractionResponseType, InteractionResponseFlags } from "discord-interactions";
import { generateAuthorizationURL } from "../oauth/roblox";
import { getRobloxFromDiscord } from "../db/linking";

export default async function handleInteraction(request: Request, env: Env, ctx: ExecutionContext) {
	const signature = request.headers.get("X-Signature-Ed25519");
	const timestamp = request.headers.get("X-Signature-Timestamp");
	const body = await request.text();

	const valid = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!valid) return new Response("Bad request signature", { headers: { "Content-Type": "application/json" }, status: 401 });

	const interaction = JSON.parse(body);

	if (interaction.type === InteractionType.PING) {
		// bing bong bing bing bong
		return Response.json({ type: InteractionResponseType.PONG });
	}

	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		switch (interaction.data.name) {
			case "whois":
				const searchDiscordId = interaction.data.options[0].value;
				const foundRobloxId = await getRobloxFromDiscord(env.rosimbot, searchDiscordId);

				if (foundRobloxId == null) {
					return Response.json({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							content: `brother. im sorry brother. i couldn't find ${searchDiscordId} in my database brother. maybe they didn't sign up.`,
						},
					});
				}

				return Response.json({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `yo bro. thank you brother. you sent me a discord id of ${searchDiscordId}. i think their roblox id is ${foundRobloxId}`,
					},
				});

			case "ping":
				return Response.json({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: { content: "pong" },
				});
			case "verify":
				// idk which one to use
				const discordId = interaction.member?.user.id ?? interaction.user.id;
				return Response.json({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
						components: [
							{
								type: ComponentType.Container,
								components: [
									{
										type: ComponentType.Section,
										components: [
											{
												type: ComponentType.TextDisplay,
												content: "# Verify to access RoSim\nClick the button below to verify your Roblox account.\nDo not share this link.",
											},
										],
										accessory: {
											type: ComponentType.Thumbnail,
											media: { url: `https://cdn.discordapp.com/icons/1393308664151932938/7ab93dfc9958cbe2bd620d0f46280a33.webp` },
										},
									},
								],
							},
							{
								type: ComponentType.ActionRow,
								components: [
									{
										type: ComponentType.Button,
										style: ButtonStyle.Link,
										label: "Verify",
										url: await generateAuthorizationURL(discordId, env),
									},
								],
							},
						],
					},
				});
		}
	}

	return new Response("Unknown interaction", { status: 400 });
}
