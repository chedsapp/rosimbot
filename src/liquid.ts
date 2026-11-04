import { Liquid } from "liquidjs";

import errorView from "../views/verify/error.liquid";
import layoutView from "../views/verify/layout.liquid";
import successView from "../views/verify/success.liquid";
import baseView from "../views/base.liquid";
import privacyView from "../views/privacy.liquid";

const engine = new Liquid({
	templates: {
		verify_layout: layoutView,
		verify_error: errorView,
		verify_success: successView,
		base: baseView,
		privacy: privacyView,
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
