import { normalizeName } from '../../dogVote/normalize.js';

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
