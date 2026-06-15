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
 * Return a family's data-source config, or null if the slug is invalid or not
 * configured. A family is "configured" when its SWIM_<SLUG>_PASSWORD is set.
 * @param {Record<string, string|undefined>} env
 * @param {string} slug
 * @returns {{ password: string, meetsUrl: string|undefined, racesUrl: string|undefined, swimmersUrl: string|undefined } | null}
 */
export function getFamilyConfig(env, slug) {
	if (!isValidSlugFormat(slug)) return null;
	const prefix = envPrefix(slug);
	const password = env[`${prefix}_PASSWORD`];
	if (!password) return null;
	return {
		password,
		meetsUrl: env[`${prefix}_MEETS_URL`],
		racesUrl: env[`${prefix}_RACES_URL`],
		swimmersUrl: env[`${prefix}_SWIMMERS_URL`]
	};
}
