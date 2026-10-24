import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { buildJwt, getAccessToken, _resetTokenCache } from './googleAuth.js';
import { SetupError } from './config.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
	modulusLength: 2048,
	privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
	publicKeyEncoding: { type: 'spki', format: 'pem' }
});
const email = 'svc@example-project.iam.gserviceaccount.com';

/** @param {string} part */
const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

describe('buildJwt', () => {
	it('produces a verifiable RS256 JWT with the expected claims', () => {
		const jwt = buildJwt({ email, privateKey, scope: 'scope-x', nowSec: 1000 });
		const [header, payload, signature] = jwt.split('.');
		expect(decode(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
		expect(decode(payload)).toEqual({
			iss: email,
			scope: 'scope-x',
			aud: 'https://oauth2.googleapis.com/token',
			iat: 1000,
			exp: 4600
		});
		const ok = createVerify('RSA-SHA256')
			.update(`${header}.${payload}`)
			.verify(publicKey, Buffer.from(signature, 'base64url'));
		expect(ok).toBe(true);
	});
});

describe('getAccessToken', () => {
	beforeEach(() => _resetTokenCache());

	function tokenFetch(body = { access_token: 't1', expires_in: 3600 }, status = 200) {
		return vi.fn(async () => new Response(JSON.stringify(body), { status }));
	}

	it('exchanges a JWT for a token and caches it', async () => {
		const fetch = tokenFetch();
		let now = 1_000_000;
		const opts = { email, privateKey, fetch, now: () => now };
		expect(await getAccessToken(opts)).toBe('t1');
		expect(await getAccessToken(opts)).toBe('t1');
		expect(fetch).toHaveBeenCalledTimes(1);

		const [url, init] = fetch.mock.calls[0];
		expect(url).toBe('https://oauth2.googleapis.com/token');
		const params = new URLSearchParams(init.body);
		expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
		expect(decode(params.get('assertion').split('.')[1]).scope).toBe(
			'https://www.googleapis.com/auth/spreadsheets'
		);

		now += 3550 * 1000; // within 60s of expiry
		await getAccessToken(opts);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('throws a SetupError carrying Google’s explanation', async () => {
		const fetch = tokenFetch({ error: 'invalid_grant', error_description: 'Invalid JWT' }, 400);
		const attempt = getAccessToken({ email, privateKey, fetch });
		await expect(attempt).rejects.toBeInstanceOf(SetupError);
		await expect(getAccessToken({ email, privateKey, fetch })).rejects.toThrow(/Invalid JWT/);
	});

	it('throws a SetupError when the key cannot be parsed', async () => {
		const fetch = tokenFetch();
		await expect(getAccessToken({ email, privateKey: 'not a key', fetch })).rejects.toThrow(
			/GOOGLE_PRIVATE_KEY/
		);
		expect(fetch).not.toHaveBeenCalled();
	});
});
