import { IttyRouter } from "itty-router";
import { handleGatewayEvent } from "./routes/gateway";
import handleInteraction from "./routes/interaction";
import { handleRobloxCallback } from "./routes/roblox/callback";

const router = IttyRouter();

router
	.get("/", () => new Response("Ok"))
	// .post("/", handleInteraction) // deprocketet
	.post("/interaction", handleInteraction)
	.get("/roblox/callback", handleRobloxCallback)
	.post("/gateway", handleGatewayEvent)
	// .get("/roblox-avatar/:userid", async ({params}) => {return new Response(await getRobloxUserThumbnail(params.userid, {}), {status: 200})})
	.all("*", () => new Response("Not Found", { status: 404 }));

export default {
	async fetch(request, _, ctx): Promise<Response> {
		return await router.fetch(request, ctx);
	},
} satisfies ExportedHandler<Env>;
