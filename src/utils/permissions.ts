import { APIRole, PermissionFlagsBits } from "discord-api-types/v10";

export function hasPermission(perms: string | undefined, flag: bigint): boolean {
	if (perms == undefined) {
		return false;
	}
	const bits = BigInt(perms);
	// Administrator implies everything
	if ((bits & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator) return true;
	return (bits & flag) === flag;
}

export function sortRole(a: APIRole, b: APIRole): number {
	if (a.position !== b.position) return a.position - b.position;
	const aId = BigInt(a.id);
	const bId = BigInt(b.id);
	return aId === bId ? 0 : aId > bId ? -1 : 1;
}
