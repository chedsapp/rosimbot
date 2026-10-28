export class OAuthError extends Error {
	constructor(
		public code: string,
		public status = 400,
	) {
		super(code);
	}
}

export const ERRORS: Record<string, [heading: string, message: string]> = {
	access_denied: ["Access denied", "You declined the request. Nothing was changed."],
	state_mismatch: ["Session expired", "This login link is stale or was tampered with. Please start again."],
	missing_code: ["Something went wrong", "The provider did not return an authorization code."],
	token_exchange_failed: ["Could not sign you in", "The provider rejected the login. Please try again."],
	temporarily_unavailable: ["Provider unavailable", "The sign-in service is busy. Try again in a moment."],
	server_error: ["Provider error", "The sign-in service had a problem. Try again shortly."],
	internal_error: ["Unexpected error", "Something broke on our end. Please try again."],
};
