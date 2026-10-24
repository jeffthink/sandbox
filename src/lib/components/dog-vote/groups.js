import { normalizeGroup } from '../../dogVote/normalize.js';

/**
 * Breed-group emoji and colors, keyed by normalized Wisdom Panel group name
 * (https://www.wisdompanel.com/en-us/dog-breed-groups). The eight most common groups in mixes get the dataviz reference
 * categorical slots in fixed order; rarer groups share the neutral color and
 * are told apart by emoji and text label (labels are always shown).
 */
const NEUTRAL = '#8a8378';

/** @type {Record<string, { emoji: string, color: string, label: string }>} */
const GROUPS = {
	herding: { emoji: '🐑', color: '#2a78d6', label: 'Herding' },
	sporting: { emoji: '🦆', color: '#eb6834', label: 'Sporting' },
	terrier: { emoji: '🦴', color: '#1baf7a', label: 'Terrier' },
	guard: { emoji: '🛡️', color: '#eda100', label: 'Guard' },
	hound: { emoji: '👃', color: '#e87ba4', label: 'Hound' },
	'asian and oceanian': { emoji: '🐺', color: '#008300', label: 'Asian and Oceanian' },
	companion: { emoji: '🎀', color: '#6250d6', label: 'Companion' },
	'mountain dogs': { emoji: '🏔️', color: '#e34948', label: 'Mountain Dogs' },
	sighthound: { emoji: '💨', color: NEUTRAL, label: 'Sighthound' },
	'middle eastern and african': { emoji: '🏜️', color: NEUTRAL, label: 'Middle Eastern and African' },
	'street dogs': { emoji: '🏘️', color: NEUTRAL, label: 'Street Dogs' },
	'wild canids': { emoji: '🦊', color: NEUTRAL, label: 'Wild Canids' }
};

/**
 * @param {string | undefined} group
 * @returns {{ emoji: string, color: string, label: string }}
 */
export function groupStyle(group) {
	const key = normalizeGroup(group ?? '');
	return GROUPS[key] ?? { emoji: '🐕', color: NEUTRAL, label: (group ?? '').trim() || 'Other' };
}
