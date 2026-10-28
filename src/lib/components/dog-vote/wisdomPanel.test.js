import { describe, it, expect } from 'vitest';
import { wisdomPanelUrl } from './wisdomPanel.js';

const BASE = 'https://www.wisdompanel.com/en-us/dog-breeds/';

describe('wisdomPanelUrl', () => {
	it('slugs ordinary breed names', () => {
		expect(wisdomPanelUrl('German Shepherd Dog')).toBe(`${BASE}german-shepherd-dog`);
		expect(wisdomPanelUrl("  Cavalier King Charles Spaniel ")).toBe(`${BASE}cavalier-king-charles-spaniel`);
	});

	it('uses Wisdom Panel’s own slug where its name differs', () => {
		expect(wisdomPanelUrl('Doberman Pinscher')).toBe(`${BASE}dobermann-pinscher`);
		expect(wisdomPanelUrl('american bulldog')).toBe(`${BASE}bulldog-american`);
		expect(wisdomPanelUrl('Wolf')).toBe(`${BASE}gray-wolf`);
	});

	it('has no link for groups or blanks', () => {
		expect(wisdomPanelUrl('Terrier group')).toBe('');
		expect(wisdomPanelUrl('')).toBe('');
	});
});
