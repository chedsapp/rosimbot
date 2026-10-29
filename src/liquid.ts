import { Liquid } from "liquidjs";

import errorView from "../views/error.liquid";
import layoutView from "../views/layout.liquid";
import successView from "../views/success.liquid";

const engine = new Liquid({
	templates: {
		layout: layoutView,
		error: errorView,
		success: successView,
	},
	cache: true,
	outputEscape: "escape",
});

export default async function page(name: string, ctx: Record<string, unknown>, status = 200) {
	const html = await engine.renderFile(name, ctx);
	return new Response(html, {
		status,
		headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
	});
}
