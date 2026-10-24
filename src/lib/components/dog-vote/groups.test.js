import { describe, it, expect } from 'vitest';
import { groupStyle } from './groups.js';

describe('groupStyle', () => {
	it('matches group names however they are written', () => {
		expect(groupStyle('Terrier group')).toEqual(groupStyle('terrier'));
		expect(groupStyle(' Mountain Dogs GROUP ').label).toBe('Mountain Dogs');
	});
	it('falls back to a neutral dog for unknown or missing groups', () => {
		expect(groupStyle('Wolfdog-ish').emoji).toBe('🐕');
		expect(groupStyle('').emoji).toBe('🐕');
		expect(groupStyle(undefined).color).toBe(groupStyle('Wolfdog-ish').color);
	});
	it('gives the eight colored groups distinct colors', () => {
		const colors = ['herding', 'sporting', 'terrier', 'guard', 'hound', 'asian and oceanian', 'companion', 'mountain dogs'].map(
			(g) => groupStyle(g).color
		);
		expect(new Set(colors).size).toBe(8);
	});
});
