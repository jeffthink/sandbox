import { describe, it, expect } from 'vitest';
import { isValidSlugFormat, discoverSlugs, getFamilyConfig, authenticateFamily, loadFamilyData } from './families.js';

describe('isValidSlugFormat', () => {
	it('accepts lowercase alphanumeric slugs of valid length', () => {
		expect(isValidSlugFormat('riverside')).toBe(true);
		expect(isValidSlugFormat('team42')).toBe(true);
	});
	it('rejects uppercase, punctuation, spaces, and bad length', () => {
		expect(isValidSlugFormat('Riverside')).toBe(false);
		expect(isValidSlugFormat('river_side')).toBe(false);
		expect(isValidSlugFormat('river side')).toBe(false);
		expect(isValidSlugFormat('a')).toBe(false);
		expect(isValidSlugFormat('x'.repeat(33))).toBe(false);
	});
	it('rejects non-strings', () => {
		expect(isValidSlugFormat(undefined)).toBe(false);
		expect(isValidSlugFormat(null)).toBe(false);
		expect(isValidSlugFormat(42)).toBe(false);
	});
	it('accepts the min (2) and max (32) length boundaries', () => {
		expect(isValidSlugFormat('ab')).toBe(true);
		expect(isValidSlugFormat('x'.repeat(32))).toBe(true);
	});
});

describe('discoverSlugs', () => {
	it('finds slugs from SWIM_<SLUG>_PASSWORD keys, lowercased', () => {
		const env = {
			SWIM_RIVERSIDE_PASSWORD: 'pw1',
			SWIM_LAKEVIEW_PASSWORD: 'pw2',
			SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/m'
		};
		expect(discoverSlugs(env).sort()).toEqual(['lakeview', 'riverside']);
	});
	it('ignores the legacy SWIM_PASSWORD and unrelated keys', () => {
		const env = { SWIM_PASSWORD: 'old', NODE_ENV: 'test' };
		expect(discoverSlugs(env)).toEqual([]);
	});
	it('ignores a password key whose value is empty', () => {
		const env = { SWIM_RIVERSIDE_PASSWORD: '' };
		expect(discoverSlugs(env)).toEqual([]);
	});
});

describe('getFamilyConfig', () => {
	const env = {
		SWIM_RIVERSIDE_PASSWORD: 'secret',
		SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/meets',
		SWIM_RIVERSIDE_RACES_URL: 'http://example.test/races',
		SWIM_RIVERSIDE_SWIMMERS_URL: 'http://example.test/swimmers'
	};
	it('returns the full config for a configured slug', () => {
		expect(getFamilyConfig(env, 'riverside')).toEqual({
			password: 'secret',
			meetsUrl: 'http://example.test/meets',
			racesUrl: 'http://example.test/races',
			swimmersUrl: 'http://example.test/swimmers'
		});
	});
	it('returns null for an unconfigured slug', () => {
		expect(getFamilyConfig(env, 'lakeview')).toBe(null);
	});
	it('returns null for an invalid slug format', () => {
		expect(getFamilyConfig(env, 'River_Side')).toBe(null);
	});
});

describe('authenticateFamily (no enumeration)', () => {
	const env = {
		SWIM_RIVERSIDE_PASSWORD: 'secret',
		SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/meets',
		SWIM_RIVERSIDE_RACES_URL: 'http://example.test/races'
	};

	it('succeeds with a correct family + password', () => {
		const res = authenticateFamily(env, { family: 'riverside', password: 'secret' });
		expect(res.ok).toBe(true);
		expect(res.config.meetsUrl).toBe('http://example.test/meets');
		expect(res.config.password).toBeUndefined();
	});

	it('returns an identical failure for wrong password and unknown family', () => {
		const wrongPw = authenticateFamily(env, { family: 'riverside', password: 'nope' });
		const unknown = authenticateFamily(env, { family: 'lakeview', password: 'secret' });
		const badFormat = authenticateFamily(env, { family: 'River_Side', password: 'secret' });
		expect(wrongPw).toEqual({ ok: false });
		expect(unknown).toEqual({ ok: false });
		expect(badFormat).toEqual({ ok: false });
	});

	it('fails when family is missing or not a string', () => {
		expect(authenticateFamily(env, { family: undefined, password: 'secret' })).toEqual({ ok: false });
		expect(authenticateFamily(env, { family: 42, password: 'secret' })).toEqual({ ok: false });
	});
});

describe('loadFamilyData', () => {
	function fakeFetch(map) {
		return async (url) => {
			if (!(url in map)) return { ok: false, status: 404, text: async () => '' };
			return { ok: true, status: 200, text: async () => map[url] };
		};
	}

	it('loads and parses meets, races, and swimmers via the config', async () => {
		const config = {
			password: 'secret',
			meetsUrl: 'http://example.test/meets',
			racesUrl: 'http://example.test/races',
			swimmersUrl: 'http://example.test/swimmers'
		};
		const fetchImpl = fakeFetch({
			'http://example.test/meets': 'Name,Date\nSpring Invite,2026-05-01',
			'http://example.test/races': 'Swimmer,Time\nAva,30.12',
			'http://example.test/swimmers': 'Name,Emoji\nAva,🐬'
		});
		const data = await loadFamilyData(config, fetchImpl);
		expect(data.meets).toEqual([{ Name: 'Spring Invite', Date: '2026-05-01' }]);
		expect(data.races).toEqual([{ Swimmer: 'Ava', Time: '30.12' }]);
		expect(data.swimmers).toEqual([{ Name: 'Ava', Emoji: '🐬' }]);
	});
});
