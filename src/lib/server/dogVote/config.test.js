import { describe, it, expect } from 'vitest';
import { isValidSlugFormat, getDogConfig, getServiceAccount, getDefaultSlug, SetupError } from './config.js';

describe('isValidSlugFormat', () => {
	it('accepts lowercase alphanumeric slugs of 2–32 chars', () => {
		expect(isValidSlugFormat('biscuit')).toBe(true);
		expect(isValidSlugFormat('ab')).toBe(true);
		expect(isValidSlugFormat('x'.repeat(32))).toBe(true);
	});
	it('rejects uppercase, punctuation, bad length and non-strings', () => {
		expect(isValidSlugFormat('Biscuit')).toBe(false);
		expect(isValidSlugFormat('bis-cuit')).toBe(false);
		expect(isValidSlugFormat('a')).toBe(false);
		expect(isValidSlugFormat('x'.repeat(33))).toBe(false);
		expect(isValidSlugFormat(undefined)).toBe(false);
	});
});

describe('getDogConfig', () => {
	it('returns the sheet id for a configured dog', () => {
		expect(getDogConfig({ DOGVOTE_BISCUIT_SHEET_ID: 'abc' }, 'biscuit')).toEqual({ sheetId: 'abc' });
	});
	it('returns null for a bad slug or a missing sheet id', () => {
		expect(getDogConfig({ DOGVOTE_BISCUIT_SHEET_ID: 'abc' }, 'Biscuit')).toBeNull();
		expect(getDogConfig({}, 'biscuit')).toBeNull();
		expect(getDogConfig({ DOGVOTE_BISCUIT_SHEET_ID: '' }, 'biscuit')).toBeNull();
	});
});

describe('getServiceAccount', () => {
	it('names the missing variable', () => {
		expect(() => getServiceAccount({})).toThrow(SetupError);
		expect(() => getServiceAccount({})).toThrow(/GOOGLE_SERVICE_ACCOUNT_EMAIL/);
		expect(() => getServiceAccount({ GOOGLE_SERVICE_ACCOUNT_EMAIL: 'a@b' })).toThrow(/GOOGLE_PRIVATE_KEY/);
	});
	it('turns literal \\n sequences in the key into newlines', () => {
		expect(getServiceAccount({ GOOGLE_SERVICE_ACCOUNT_EMAIL: 'a@b', GOOGLE_PRIVATE_KEY: 'A\\nB' })).toEqual({
			email: 'a@b',
			privateKey: 'A\nB'
		});
	});
});

describe('getDefaultSlug', () => {
	it('returns a valid default slug or null', () => {
		expect(getDefaultSlug({ DOGVOTE_DEFAULT_SLUG: 'biscuit' })).toBe('biscuit');
		expect(getDefaultSlug({ DOGVOTE_DEFAULT_SLUG: 'Bad Slug' })).toBeNull();
		expect(getDefaultSlug({})).toBeNull();
	});
});
