import { normalizeName, normalizeGroup, consensus } from './rules.js';

/** @typedef {import('./rules.js').Guess} Guess */
/** @typedef {import('./rules.js').Vote} Vote */
/** @typedef {import('./rules.js').Breed} Breed */
/** @typedef {import('./rules.js').ResultRow} ResultRow */
/** @typedef {import('./rules.js').Results} Results */
/** @typedef {Vote & { score: number, rank: number }} RankedVote */

/**
 * Split result rows into breed rows and group rows, and build the
 * breed → group lookup from the breeds tab.
 * @param {ResultRow[]} results
 * @param {Breed[]} breeds
 */
function classify(results, breeds) {
	/** @type {Map<string, string>} normalized breed → normalized group */
	const groupOf = new Map(breeds.map((b) => [normalizeName(b.breed), normalizeGroup(b.group)]));
	const knownGroups = new Set(groupOf.values());
	const breedRows = [];
	const groupRows = [];
	for (const row of results) {
		const group = normalizeGroup(row.name);
		if (knownGroups.has(group)) groupRows.push({ group, pct: row.pct });
		else breedRows.push({ breed: normalizeName(row.name), pct: row.pct });
	}
	return { groupOf, breedRows, groupRows };
}

/**
 * Overlap score (0–100) of one guess against the actual results. Breed rows
 * are matched first; whatever share of a guessed breed wasn't used there
 * counts toward its group's row, summed across the group before the min.
 * @param {Guess[]} guesses
 * @param {ResultRow[]} results
 * @param {Breed[]} breeds
 * @returns {number}
 */
export function scoreGuess(guesses, results, breeds) {
	const { groupOf, breedRows, groupRows } = classify(results, breeds);
	/** @type {Map<string, number>} normalized breed → unused guessed pct */
	const remaining = new Map();
	for (const g of guesses) {
		const key = normalizeName(g.breed);
		remaining.set(key, (remaining.get(key) ?? 0) + g.pct);
	}

	let score = 0;
	for (const row of breedRows) {
		const guessed = remaining.get(row.breed) ?? 0;
		const used = Math.min(guessed, row.pct);
		score += used;
		if (guessed > 0) remaining.set(row.breed, guessed - used);
	}
	for (const row of groupRows) {
		let inGroup = 0;
		for (const [breed, pct] of remaining) {
			if (groupOf.get(breed) === row.group) inGroup += pct;
		}
		score += Math.min(inGroup, row.pct);
	}
	// Round to the displayed precision so float noise (10.1 + 20.2 ≠ 30.3)
	// can't break ties that look equal on screen.
	return Math.round(Math.min(score, 100) * 10) / 10;
}

/**
 * Leaderboard and callouts for reveal mode.
 * @param {Vote[]} votes - latest-per-name votes
 * @param {Results} results
 * @param {Breed[]} breeds
 * @returns {{ leaderboard: RankedVote[], closest: RankedVote | null, wildest: RankedVote | null, crowdScore: number | null, popularMiss: { breed: string, voters: number, avgPct: number } | null }}
 */
export function buildReveal(votes, results, breeds) {
	if (votes.length === 0) {
		return { leaderboard: [], closest: null, wildest: null, crowdScore: null, popularMiss: null };
	}
	const rows = results.rows;
	const scored = votes.map((v) => ({ ...v, score: scoreGuess(v.guesses, rows, breeds) }));

	const leaderboard = [...scored]
		.sort((a, b) => b.score - a.score || compareTime(a.timestamp, b.timestamp))
		.map((v, i) => ({ ...v, rank: i + 1 }));

	// Wildest: lowest score; ties go to the later vote.
	const wildest = [...leaderboard].sort(
		(a, b) => a.score - b.score || compareTime(b.timestamp, a.timestamp)
	)[0];

	return {
		leaderboard,
		closest: leaderboard[0],
		wildest,
		crowdScore: scoreGuess(consensus(votes).all, rows, breeds),
		popularMiss: findPopularMiss(votes, rows, breeds)
	};
}

/**
 * @param {string} a
 * @param {string} b
 */
function compareTime(a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The breed picked by the most voters that isn't in the dog at all (neither
 * a result breed row nor in a result group). Ties → higher average pct.
 * @param {Vote[]} votes
 * @param {ResultRow[]} results
 * @param {Breed[]} breeds
 */
function findPopularMiss(votes, results, breeds) {
	const { groupOf, breedRows, groupRows } = classify(results, breeds);
	const hitBreeds = new Set(breedRows.map((r) => r.breed));
	const hitGroups = new Set(groupRows.map((r) => r.group));

	/** @type {Map<string, { breed: string, voters: number, total: number }>} */
	const misses = new Map();
	for (const v of votes) {
		for (const g of v.guesses) {
			const key = normalizeName(g.breed);
			const group = groupOf.get(key);
			if (hitBreeds.has(key) || (group !== undefined && hitGroups.has(group))) continue;
			const entry = misses.get(key) ?? { breed: g.breed.trim(), voters: 0, total: 0 };
			entry.voters += 1;
			entry.total += g.pct;
			misses.set(key, entry);
		}
	}

	let best = null;
	for (const m of misses.values()) {
		const avgPct = m.total / m.voters;
		if (!best || m.voters > best.voters || (m.voters === best.voters && avgPct > best.avgPct)) {
			best = { breed: m.breed, voters: m.voters, avgPct };
		}
	}
	return best;
}
