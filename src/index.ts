import { IttyRouter } from "itty-router";
import { handleGatewayEvent } from "./routes/gateway";
import handleInteraction from "./routes/interaction";
import { handleRobloxCallback } from "./routes/roblox/callback";
import page from "./liquid";
import { API_ROUTER } from "./routes/api";

const router = IttyRouter();

router
	.get("/", () => new Response("Ok"))
	.all("/api/*", API_ROUTER.fetch)
	// .post("/", handleInteraction) // deprocketet
	.post("/interaction", handleInteraction)
	.get("/roblox/callback", handleRobloxCallback)
	.post("/gateway", handleGatewayEvent)
	.get("/terms", (_, ctx) => page("terms", ctx, 200))
	.get("/privacy", (_, ctx) => page("privacy", ctx, 200))
	.all("*", () => new Response("Not Found", { status: 404 }));

export default {
	async fetch(request, _, ctx): Promise<Response> {
		return await router.fetch(request, ctx);
	},
} satisfies ExportedHandler<Env>;
