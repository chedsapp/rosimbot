import { IttyRouter } from "itty-router";
import { env } from "cloudflare:workers";
import { timingSafeEqual, createHash } from "node:crypto";
import { handleGetUserByDiscordId, handleGetUserById } from "./user";

export const API_ROUTER = IttyRouter({ base: "/api" });

function safeEqual(a: string, b: string): boolean {
	// Hash both so the buffers are always the same length
	// (timingSafeEqual throws if lengths differ, and checking length first leaks it)
	const ha = createHash("sha256").update(a).digest();
	const hb = createHash("sha256").update(b).digest();
	return timingSafeEqual(ha, hb);
}

function authMiddleware(request: Request, _: ExecutionContext) {
	const token = request.headers.get("Authorization");

	if (token === null) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
	}

	if (!safeEqual(token, env.ROSIM_API_KEY)) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
	}
}

API_ROUTER.all("*", authMiddleware)
	.get("/", () => new Response(JSON.stringify({ message: "OK" })))
	.get("/users/discord/:id", handleGetUserByDiscordId)
	.get("/users/:id", handleGetUserById)
	.all("*", () => new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }));
