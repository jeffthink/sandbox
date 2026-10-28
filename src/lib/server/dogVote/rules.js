import { normalizeName, normalizeGroup } from '../../dogVote/normalize.js';

export { normalizeName, normalizeGroup };

/** @typedef {{ breed: string, pct: number }} Guess */
/** @typedef {{ name: string, guesses: Guess[], comment: string, timestamp: string }} Vote */
/** @typedef {{ breed: string, group: string, imageUrl: string, credit?: string, creditUrl?: string }} Breed */
/** @typedef {{ dogName: string, pronoun: 'he'|'she'|'they', intro: string, photos: string[] }} Settings */
/** @typedef {{ name: string, pct: number }} ResultRow */
/** @typedef {{ revealed: boolean, rows: ResultRow[] }} Results */
/** @typedef {{ settings: Settings, breeds: Breed[], votes: Vote[], results: Results }} DogData */

export const MAX_NAME = 50;
export const MAX_COMMENT = 280;
export const MAX_BREED = 60;
export const MAX_GUESSES = 5;
const TOP_N = 8;

/**
 * Validate a submitted vote. Every rule here is enforced server-side; the
 * client mirrors them only for convenience.
 * @param {unknown} input
 * @param {Breed[]} breeds - the breeds tab; guesses must come from this list
 * @returns {{ ok: true, vote: { name: string, guesses: Guess[], comment: string } } | { ok: false, errors: { name?: string, guesses?: string, comment?: string } }}
 */
export function validateVote(input, breeds) {
	/** @type {{ name?: string, guesses?: string, comment?: string }} */
	const errors = {};
	const body = input && typeof input === 'object' ? /** @type {Record<string, unknown>} */ (input) : {};

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	if (!name) errors.name = 'Please enter your name.';
	else if (name.length > MAX_NAME) errors.name = `Names can be at most ${MAX_NAME} characters.`;

	const comment = body.comment === undefined || body.comment === null ? '' : body.comment;
	if (typeof comment !== 'string') errors.comment = 'Comment must be text.';
	else if (comment.length > MAX_COMMENT) errors.comment = `Comments can be at most ${MAX_COMMENT} characters.`;

	const canonical = new Map(breeds.map((b) => [normalizeName(b.breed), b.breed]));
	/** @type {Guess[]} */
	const guesses = [];
	const raw = body.guesses;
	if (!Array.isArray(raw) || raw.length === 0) {
		errors.guesses = 'Pick at least one breed.';
	} else if (raw.length > MAX_GUESSES) {
		errors.guesses = `Pick at most ${MAX_GUESSES} breeds.`;
	} else {
		const seen = new Set();
		for (const g of raw) {
			const breed = g && typeof g.breed === 'string' ? g.breed.trim() : '';
			const pct = g?.pct;
			if (!breed) {
				errors.guesses = 'Every breed needs a name.';
				break;
			}
			if (breed.length > MAX_BREED) {
				errors.guesses = `Breed names can be at most ${MAX_BREED} characters.`;
				break;
			}
			if (typeof pct !== 'number' || !Number.isInteger(pct) || pct < 1 || pct > 100) {
				errors.guesses = 'Each percentage must be a whole number from 1 to 100.';
				break;
			}
			const key = normalizeName(breed);
			if (!canonical.has(key)) {
				errors.guesses = `"${breed}" isn't on the breed list.`;
				break;
			}
			if (seen.has(key)) {
				errors.guesses = `"${breed}" is listed twice.`;
				break;
			}
			seen.add(key);
			guesses.push({ breed: /** @type {string} */ (canonical.get(key)), pct });
		}
		if (!errors.guesses) {
			const total = guesses.reduce((sum, g) => sum + g.pct, 0);
			if (total !== 100) errors.guesses = `Percentages must add up to 100 (now ${total}).`;
		}
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors };
	return { ok: true, vote: { name, guesses, comment: /** @type {string} */ (comment) } };
}

/**
 * Parse raw `votes` tab rows (header excluded). Hand-edited or malformed rows
 * are skipped with a warning rather than failing the whole load.
 * @param {string[][]} rows
 * @returns {Vote[]}
 */
export function parseVoteRows(rows) {
	/** @type {Vote[]} */
	const votes = [];
	rows.forEach((row, i) => {
		const [timestamp = '', name = '', guessesJson = '', comment = ''] = row ?? [];
		if (!timestamp.trim() && !name.trim() && !guessesJson.trim()) return; // blank row
		const guesses = parseGuesses(guessesJson);
		if (!timestamp.trim() || !name.trim() || !guesses) {
			console.warn(`[dog-vote] skipping malformed votes row ${i + 2}`);
			return;
		}
		votes.push({ timestamp: timestamp.trim(), name: name.trim(), guesses, comment });
	});
	return votes;
}

/**
 * @param {string} json
 * @returns {Guess[] | null}
 */
function parseGuesses(json) {
	let parsed;
	try {
		parsed = JSON.parse(json);
	} catch {
		return null;
	}
	if (!Array.isArray(parsed)) return null;
	/** @type {Map<string, Guess>} hand-edited cells may repeat a breed; merge them */
	const byBreed = new Map();
	for (const g of parsed) {
		const pct = typeof g?.pct === 'string' && g.pct.trim() !== '' ? Number(g.pct) : g?.pct;
		if (typeof g?.breed !== 'string' || typeof pct !== 'number' || !Number.isFinite(pct)) return null;
		const key = normalizeName(g.breed);
		const prev = byBreed.get(key);
		if (prev) prev.pct += pct;
		else byBreed.set(key, { breed: g.breed.trim(), pct });
	}
	return [...byBreed.values()];
}

/**
 * Keep only each voter's latest row, comparing names case-insensitively.
 * Equal timestamps fall back to sheet order (later row wins).
 * @param {Vote[]} votes
 * @returns {Vote[]}
 */
export function latestVotesByName(votes) {
	/** @type {Map<string, Vote>} */
	const latest = new Map();
	for (const v of votes) {
		const key = normalizeName(v.name);
		const prev = latest.get(key);
		if (!prev || v.timestamp >= prev.timestamp) {
			latest.delete(key); // re-insert so map order follows the latest row
			latest.set(key, { ...v, name: v.name.trim() });
		}
	}
	return [...latest.values()];
}

/**
 * Crowd consensus: average pct per breed across all voters (0 where a voter
 * didn't pick it). `top` keeps the first `topN` and folds the rest into Other.
 * @param {Vote[]} votes
 * @param {number} [topN]
 * @returns {{ all: Guess[], top: Array<Guess & { other?: true }> }}
 */
export function consensus(votes, topN = TOP_N) {
	if (votes.length === 0) return { all: [], top: [] };
	/** @type {Map<string, { breed: string, sum: number }>} */
	const totals = new Map();
	for (const v of votes) {
		for (const g of v.guesses) {
			const key = normalizeName(g.breed);
			const entry = totals.get(key) ?? { breed: g.breed.trim(), sum: 0 };
			entry.sum += g.pct;
			totals.set(key, entry);
		}
	}
	const all = [...totals.values()]
		.map(({ breed, sum }) => ({ breed, pct: sum / votes.length }))
		.sort((a, b) => b.pct - a.pct || a.breed.localeCompare(b.breed));
	/** @type {Array<Guess & { other?: true }>} */
	const top = all.slice(0, topN);
	const rest = all.slice(topN).reduce((sum, g) => sum + g.pct, 0);
	if (rest > 0) top.push({ breed: 'Other', pct: rest, other: true });
	return { all, top };
}

/**
 * What the crowd endpoint returns. Consensus and individual guesses are only
 * included for someone whose name has a vote (casual anti-peeking, not auth).
 * The name may come from a URL, so dashes/underscores also match spaces
 * when no saved name matches exactly.
 * @param {Vote[]} votes - latest-per-name votes
 * @param {string | null} name
 * @returns {{ count: number, voted: boolean, name?: string, consensus?: Array<Guess & { other?: true }>, votes?: Vote[] }}
 */
export function crowdView(votes, name) {
	const count = votes.length;
	const key = name ? normalizeName(name) : '';
	/** @param {string} k */
	const find = (k) => (k === '' ? undefined : votes.find((v) => normalizeName(v.name) === k));
	const match = find(key) ?? find(normalizeName(key.replace(/[-_]+/g, ' ')));
	if (!match) return { count, voted: false };
	return {
		count,
		voted: true,
		name: match.name,
		consensus: consensus(votes).top,
		votes: [...votes].sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))
	};
}
