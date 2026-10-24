import { describe, it, expect } from 'vitest';
import { groupBreeds } from './lookup.js';

const b = (breed, group) => ({ breed, group, imageUrl: '' });

describe('groupBreeds', () => {
	it('groups breeds in sheet order of first appearance, alphabetical within a group', () => {
		const sections = groupBreeds([
			b('Collie', 'Herding group'),
			b('Beagle', 'Hound group'),
			b('Border Collie', 'herding'),
			b('Akita', 'Asian and Oceanian group')
		]);
		expect(sections.map((s) => [s.label, s.breeds.map((x) => x.breed)])).toEqual([
			['Herding', ['Border Collie', 'Collie']],
			['Hound', ['Beagle']],
			['Asian and Oceanian', ['Akita']]
		]);
		expect(sections[0].emoji).toBe('🐑');
		expect(sections[0].id).toBe('group-herding');
	});

	it('puts breeds with no group last under Other', () => {
		const sections = groupBreeds([b('Mutt', ''), b('Beagle', 'Hound group')]);
		expect(sections.map((s) => s.label)).toEqual(['Hound', 'Other']);
	});
});
