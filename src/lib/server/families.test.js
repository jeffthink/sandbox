import { describe, it, expect } from 'vitest';
import { isValidSlugFormat, discoverSlugs, getFamilyConfig } from './families.js';

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
