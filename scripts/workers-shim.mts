import { registerHooks } from "node:module";

const STUB_URL = new URL("./cloudflare-workers-stub.cjs", import.meta.url).href;

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier === "cloudflare:workers") {
			return { url: STUB_URL, format: "commonjs", shortCircuit: true };
		}
		return nextResolve(specifier, context);
	},
});
