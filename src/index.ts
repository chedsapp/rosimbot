import { IttyRouter } from "itty-router";
import handleInteraction from "./routes/interaction";
import { handleRobloxCallback } from "./routes/roblox/callback";

const router = IttyRouter();

router
	.get("/", () => new Response("Ok"))
	.post("/", handleInteraction)
	.get("/roblox/callback", handleRobloxCallback);

export default {
	async fetch(request, env, ctx): Promise<esponse> {
		return await router.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
