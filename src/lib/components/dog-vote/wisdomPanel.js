import { normalizeName } from '../../dogVote/normalize.js';

const BASE = 'https://www.wisdompanel.com/en-us/dog-breeds/';

/** Breeds whose Wisdom Panel page slug isn't just their name, dash-separated. */
const SLUGS = {
	'american bulldog': 'bulldog-american',
	bulldog: 'bulldog-standard',
	'black and tan coonhound': 'coonhound-black-and-tan',
	'doberman pinscher': 'dobermann-pinscher',
	'jack russell terrier': 'russell-terrier',
	'miniature schnauzer': 'schnauzer-miniature',
	poodle: 'poodle-medium-standard',
	'shiba inu': 'japanese-shiba-inu',
	wolf: 'gray-wolf'
};

/**
 * Link to a breed's Wisdom Panel page, or '' for result rows that are
 * groups ("Terrier group") rather than breeds.
 * @param {string} name
 */
export function wisdomPanelUrl(name) {
	const key = normalizeName(name);
	if (key === '' || /\bgroup$/.test(key)) return '';
	const slug = SLUGS[/** @type {keyof typeof SLUGS} */ (key)] ?? key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	return BASE + slug;
}
