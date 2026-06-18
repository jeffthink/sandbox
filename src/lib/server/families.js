import { verifyPassword, loadSwimData } from './swimGate.js';

/** Friendly slugs: lowercase alphanumeric, 2-32 chars. Keeps a clean,
 *  unambiguous mapping to the uppercase env-var prefix. */
const SLUG_PATTERN = /^[a-z0-9]{2,32}$/;

/**
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidSlugFormat(slug) {
	return typeof slug === 'string' && SLUG_PATTERN.test(slug);
}

// Exported for a possible future admin/index view; not called in production yet.
// Its test also pins the invariant that the legacy SWIM_PASSWORD is ignored.
/**
 * Discover configured family slugs by scanning env keys of the form
 * SWIM_<SLUG>_PASSWORD (non-empty value). Returns lowercased slugs.
 * The legacy single-family SWIM_PASSWORD does not match and is ignored.
 * @param {Record<string, string|undefined>} env
 * @returns {string[]}
 */
export function discoverSlugs(env) {
	const slugs = [];
	for (const key of Object.keys(env)) {
		const match = /^SWIM_([A-Z0-9]+)_PASSWORD$/.exec(key);
		if (match && env[key]) {
			slugs.push(match[1].toLowerCase());
		}
	}
	return slugs;
}

/**
 * Build the uppercase env-var prefix for a slug.
 * @param {string} slug e.g. "riverside"
 * @returns {string} e.g. "SWIM_RIVERSIDE"
 */
function envPrefix(slug) {
	return `SWIM_${slug.toUpperCase()}`;
}

/**
 * Return a family's data-source config, or null if the slug is invalid or the
 * family is not fully configured. A family is usable only when its password and
 * BOTH required data URLs (meets, races) are set; the swimmers tab is optional.
 * Treating a half-configured family as unconfigured yields a uniform auth
 * failure at the gate instead of a confusing post-login 500.
 * @param {Record<string, string|undefined>} env
 * @param {string} slug
 * @returns {{ password: string, meetsUrl: string, racesUrl: string, swimmersUrl: string|undefined } | null}
 */
export function getFamilyConfig(env, slug) {
	if (!isValidSlugFormat(slug)) return null;
	const prefix = envPrefix(slug);
	const password = env[`${prefix}_PASSWORD`];
	const meetsUrl = env[`${prefix}_MEETS_URL`];
	const racesUrl = env[`${prefix}_RACES_URL`];
	if (!password || !meetsUrl || !racesUrl) return null;
	return {
		password,
		meetsUrl,
		racesUrl,
		swimmersUrl: env[`${prefix}_SWIMMERS_URL`]
	};
}

/**
 * Authenticate a family request. Returns a UNIFORM failure for all of:
 * invalid slug format, unknown/unconfigured family, and wrong password — so a
 * caller cannot distinguish them (no enumeration).
 * @param {Record<string, string|undefined>} env
 * @param {{ family: unknown, password: unknown }} body
 * @returns {{ ok: true, slug: string, config: { meetsUrl: string, racesUrl: string, swimmersUrl: string|undefined } } | { ok: false }}
 */
export function authenticateFamily(env, { family, password }) {
	const config = typeof family === 'string' ? getFamilyConfig(env, family) : null;
	if (!config || !verifyPassword(password, config.password)) {
		return { ok: false };
	}
	// Strip the stored credential — callers (the data loader) only need the URLs,
	// and this keeps the password from ever leaking downstream.
	const { password: _password, ...safeConfig } = config;
	return { ok: true, slug: family, config: safeConfig };
}

/**
 * Load a family's swim data via the configured data source. This is the swap
 * point: to move one family to a database later, branch here on config.
 * @param {{ meetsUrl: string|undefined, racesUrl: string|undefined, swimmersUrl: string|undefined }} config
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ meets: Array, races: Array, swimmers: Array }>}
 */
export function loadFamilyData(config, fetchImpl) {
	return loadSwimData({
		meetsUrl: config.meetsUrl,
		racesUrl: config.racesUrl,
		swimmersUrl: config.swimmersUrl,
		fetch: fetchImpl
	});
}
