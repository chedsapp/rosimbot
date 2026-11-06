import { IRequest } from "itty-router";
import { getUser, getUserByDiscord } from "../../db/linking";

export async function handleGetUserById(request: IRequest, ctx: ExecutionContext): Promise<Response> {
	const { id } = request.params;
	const foundUser = await getUser(id);
	if (foundUser === null) {
		return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
	} else {
		return new Response(JSON.stringify(foundUser), { status: 200 });
	}
}

export async function handleGetUserByDiscordId(request: IRequest, ctx: ExecutionContext): Promise<Response> {
	const { id } = request.params;
	const foundUser = await getUserByDiscord(id);
	if (foundUser === null) {
		return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
	} else {
		return new Response(JSON.stringify(foundUser), { status: 200 });
	}
}
