import { describe, it, expect } from 'vitest';
import { fitLabel } from './fitLabel.js';

// Fake measurer: every character is 10px wide.
const measure = (/** @type {string} */ s) => s.length * 10;

describe('fitLabel', () => {
	it('leaves labels that fit unchanged', () => {
		expect(fitLabel('Beagle', 100, measure)).toBe('Beagle');
	});
	it('truncates with an ellipsis to fit the width', () => {
		const out = fitLabel('A very long made up breed name', 100, measure);
		expect(out.endsWith('…')).toBe(true);
		expect(measure(out)).toBeLessThanOrEqual(100);
	});
	it('returns just an ellipsis when nothing fits', () => {
		expect(fitLabel('Beagle', 5, measure)).toBe('…');
	});
});
