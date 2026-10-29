import { IttyRouter } from "itty-router";
import handleInteraction from "./routes/interaction";
import { handleRobloxCallback } from "./routes/roblox/callback";
import { handleGatewayEvent } from "./routes/gateway";

const router = IttyRouter();

router
	.get("/", () => new Response("Ok"))
	.post("/", handleInteraction) // deprocketet
	.post("/interaction", handleInteraction)
	.get("/roblox/callback", handleRobloxCallback)
	.post("/gateway", handleGatewayEvent)
	.all("*", () => new Response("Not Found", { status: 404 }));

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return await router.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
