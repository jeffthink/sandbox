/**
 * Per-dog configuration from env vars. Mirrors the swim tracker's families.js:
 * dogs are discovered from DOGVOTE_<SLUG>_SHEET_ID, so no dog identifier
 * needs to live in code.
 */

/** Friendly slugs: lowercase alphanumeric, 2-32 chars (same as families.js). */
const SLUG_PATTERN = /^[a-z0-9]{2,32}$/;

/**
 * A configuration problem the site owner can fix (missing env var, missing
 * tab, sheet not shared). `message` is developer-facing detail; callers show
 * it only in dev and fall back to a generic message in production.
 */
export class SetupError extends Error {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = 'SetupError';
	}
}

/**
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidSlugFormat(slug) {
	return typeof slug === 'string' && SLUG_PATTERN.test(slug);
}

/**
 * @param {Record<string, string|undefined>} env
 * @param {string} slug
 * @returns {{ sheetId: string } | null}
 */
export function getDogConfig(env, slug) {
	if (!isValidSlugFormat(slug)) return null;
	const sheetId = env[`DOGVOTE_${slug.toUpperCase()}_SHEET_ID`];
	return sheetId ? { sheetId } : null;
}

/**
 * The shared service account used for every dog's sheet. Private keys pasted
 * into .env / Vercel usually keep literal "\n" sequences; turn them back into
 * newlines so the PEM parses.
 * @param {Record<string, string|undefined>} env
 * @returns {{ email: string, privateKey: string }}
 */
export function getServiceAccount(env) {
	const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	if (!email) throw new SetupError('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');
	const key = env.GOOGLE_PRIVATE_KEY;
	if (!key) throw new SetupError('GOOGLE_PRIVATE_KEY is not set.');
	return { email, privateKey: key.replace(/\\n/g, '\n') };
}

/**
 * @param {Record<string, string|undefined>} env
 * @returns {string | null}
 */
export function getDefaultSlug(env) {
	const slug = env.DOGVOTE_DEFAULT_SLUG;
	return isValidSlugFormat(slug) ? /** @type {string} */ (slug) : null;
}
