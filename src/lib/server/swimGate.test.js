import { describe, it, expect } from 'vitest';
import { verifyPassword } from './swimGate.js';

describe('verifyPassword', () => {
	it('returns true when the password matches', () => {
		expect(verifyPassword('correct horse', 'correct horse')).toBe(true);
	});

	it('returns false when the password does not match', () => {
		expect(verifyPassword('wrong', 'correct horse')).toBe(false);
	});

	it('returns false when the expected password is empty', () => {
		expect(verifyPassword('anything', '')).toBe(false);
	});

	it('returns false for non-string input', () => {
		expect(verifyPassword(undefined, 'correct horse')).toBe(false);
		expect(verifyPassword(null, 'correct horse')).toBe(false);
	});
});
