import { normalizeName, normalizeGroup } from '../../dogVote/normalize.js';
import { groupStyle } from './groups.js';

/** @typedef {{ breed: string, group: string, imageUrl: string }} Breed */

/**
 * Build a case-insensitive breed lookup. Unknown (free-text) breeds come back
 * with no group or image so they render with the fallback avatar.
 * @param {Breed[]} breeds
 * @returns {(name: string) => Breed}
 */
export function makeLookup(breeds) {
	const byName = new Map(breeds.map((b) => [normalizeName(b.breed), b]));
	return (name) => byName.get(normalizeName(name)) ?? { breed: name, group: '', imageUrl: '' };
}

/** Object and possessive pronouns for copy like "what's in him?". */
export const PRONOUNS = {
	he: { obj: 'him', poss: 'his' },
	she: { obj: 'her', poss: 'her' },
	they: { obj: 'them', poss: 'their' }
};

/**
 * Breeds grouped for the browse view: groups in the order they first appear
 * in the sheet, breeds alphabetical within each, ungrouped breeds last.
 * @param {Breed[]} breeds
 * @returns {Array<{ id: string, label: string, emoji: string, color: string, breeds: Breed[] }>}
 */
export function groupBreeds(breeds) {
	/** @type {Map<string, Breed[]>} */
	const byGroup = new Map();
	for (const b of breeds) {
		const key = normalizeGroup(b.group);
		byGroup.set(key, [...(byGroup.get(key) ?? []), b]);
	}
	const keys = [...byGroup.keys()].filter((k) => k !== '');
	if (byGroup.has('')) keys.push('');
	return keys.map((key) => {
		const members = /** @type {Breed[]} */ (byGroup.get(key));
		// groupStyle labels known groups; unknown ones keep the sheet's spelling.
		const style = groupStyle(members[0].group);
		return {
			id: `group-${key.replace(/[^a-z0-9]+/g, '-') || 'other'}`,
			label: key ? style.label.replace(/ group$/i, '') : 'Other',
			emoji: style.emoji,
			color: style.color,
			breeds: [...members].sort((a, b) => a.breed.localeCompare(b.breed))
		};
	});
}
