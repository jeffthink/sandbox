import { createSign, createPrivateKey } from 'node:crypto';
import { SetupError } from './config.js';

/**
 * Dependency-free Google service-account auth: sign a JWT with node:crypto
 * and exchange it for an OAuth access token.
 * https://developers.google.com/identity/protocols/oauth2/service-account#httprest
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const EXPIRY_MARGIN_MS = 60_000;

/** @type {Map<string, { token: string, expiresAt: number }>} */
const cache = new Map();

/** @param {unknown} value */
function base64url(value) {
	return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
}

/**
 * @param {{ email: string, privateKey: string, scope: string, nowSec: number }} opts
 * @returns {string}
 */
export function buildJwt({ email, privateKey, scope, nowSec }) {
	const unsigned = `${base64url({ alg: 'RS256', typ: 'JWT' })}.${base64url({
		iss: email,
		scope,
		aud: TOKEN_URL,
		iat: nowSec,
		exp: nowSec + 3600
	})}`;
	const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url');
	return `${unsigned}.${signature}`;
}

/**
 * Get a (cached) access token for the service account.
 * @param {{ email: string, privateKey: string, fetch: typeof fetch, now?: () => number }} opts
 * @returns {Promise<string>}
 */
export async function getAccessToken({ email, privateKey, fetch, now = Date.now }) {
	const cached = cache.get(email);
	if (cached && now() < cached.expiresAt - EXPIRY_MARGIN_MS) return cached.token;

	try {
		createPrivateKey(privateKey);
	} catch {
		throw new SetupError(
			'GOOGLE_PRIVATE_KEY could not be parsed. Copy the private_key value from the JSON key file, keeping the \\n sequences, wrapped in double quotes.'
		);
	}

	const assertion = buildJwt({ email, privateKey, scope: SCOPE, nowSec: Math.floor(now() / 1000) });
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion
		}).toString()
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.access_token) {
		throw new SetupError(
			`Google rejected the service-account login: ${body.error_description || body.error || res.status}`
		);
	}
	cache.set(email, { token: body.access_token, expiresAt: now() + (body.expires_in ?? 3600) * 1000 });
	return body.access_token;
}

/** Test helper. */
export function _resetTokenCache() {
	cache.clear();
}
