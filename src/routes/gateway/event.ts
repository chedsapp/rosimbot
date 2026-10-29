import { GatewayDispatchPayload } from "discord-api-types/v10";

export async function handleGatewayEvent(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	if (req.headers.get("x-gateway-secret") !== env.DISCORD_TOKEN) {
		return new Response("unauthorized", { status: 401 });
	}

	const payload = (await req.json()) as GatewayDispatchPayload;
	// do shit

	return new Response(null, { status: 204 });
}
