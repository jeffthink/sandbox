import { describe, it, expect } from 'vitest';
import { parseCSV } from './googleSheetsCSV.js';

describe('parseCSV', () => {
	it('parses headers and rows into objects', () => {
		const csv = 'Name,Time\nMarlin Waters,35.20\nPip Splash,38.40';
		expect(parseCSV(csv)).toEqual([
			{ Name: 'Marlin Waters', Time: '35.20' },
			{ Name: 'Pip Splash', Time: '38.40' }
		]);
	});

	it('handles quoted values containing commas', () => {
		const csv = 'Name,Note\n"Reef, Coral","fast, very fast"';
		expect(parseCSV(csv)).toEqual([
			{ Name: 'Reef, Coral', Note: 'fast, very fast' }
		]);
	});

	it('returns an empty array for empty input', () => {
		expect(parseCSV('')).toEqual([]);
	});
});
