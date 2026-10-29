import { GatewayDispatchPayload } from "discord-api-types/v10";
import { env } from "cloudflare:workers";

export async function handleGatewayEvent(req: Request, ctx: ExecutionContext): Promise<Response> {
	if (req.headers.get("x-gateway-secret") !== env.GATEWAY_TOKEN) {
		return new Response("unauthorized", { status: 401 });
	}

	const payload = (await req.json()) as GatewayDispatchPayload;
	// do shit
	console.log(payload);

	return new Response(null, { status: 204 });
}
