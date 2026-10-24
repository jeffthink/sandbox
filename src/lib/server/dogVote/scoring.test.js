import { describe, it, expect } from 'vitest';
import { scoreGuess, buildReveal } from './scoring.js';

const breeds = [
	{ breed: 'Jack Russell Terrier', group: 'Terrier group', imageUrl: '' },
	{ breed: 'Rat Terrier', group: 'Terrier group', imageUrl: '' },
	{ breed: 'Beagle', group: 'Scent Hound group', imageUrl: '' },
	{ breed: 'Poodle', group: 'Toy and Companion group', imageUrl: '' }
];
const results = [
	{ name: 'Beagle', pct: 50 },
	{ name: 'Jack Russell Terrier', pct: 30 },
	{ name: 'terrier', pct: 20 }
];

describe('scoreGuess', () => {
	it('adds min(guessed, actual) for an exact breed match', () => {
		expect(scoreGuess([{ breed: 'Beagle', pct: 100 }], results, breeds)).toBe(50);
	});

	it('sends a breed’s unused share to its group row', () => {
		const guess = [
			{ breed: 'Jack Russell Terrier', pct: 50 },
			{ breed: 'Beagle', pct: 50 }
		];
		expect(scoreGuess(guess, results, breeds)).toBe(50 + 30 + 20);
	});

	it('sums guessed breeds within a group before taking the min', () => {
		const guess = [
			{ breed: 'Rat Terrier', pct: 15 },
			{ breed: 'Jack Russell Terrier', pct: 40 },
			{ breed: 'Beagle', pct: 45 }
		];
		expect(scoreGuess(guess, results, breeds)).toBe(45 + 30 + 20);
	});

	it('matches breed names case-insensitively', () => {
		expect(scoreGuess([{ breed: 'beagle', pct: 100 }], results, breeds)).toBe(50);
	});

	it('gives free-text breeds with no group credit only for exact breed rows', () => {
		expect(scoreGuess([{ breed: 'Mystery Mutt', pct: 100 }], results, breeds)).toBe(0);
		expect(scoreGuess([{ breed: 'Mystery Mutt', pct: 100 }], [{ name: 'mystery mutt', pct: 10 }], breeds)).toBe(10);
	});

	it('never exceeds 100 even when results over-sum', () => {
		expect(scoreGuess([{ breed: 'Beagle', pct: 100 }], [{ name: 'Beagle', pct: 120 }], breeds)).toBe(100);
	});
});

/** @returns {import('./rules.js').Vote} */
function vote(name, timestamp, guesses) {
	return { name, timestamp, guesses, comment: '' };
}

describe('buildReveal', () => {
	const votes = [
		vote('Ava', '2026-10-02T00:00:00Z', [{ breed: 'Beagle', pct: 100 }]),
		vote('Ben', '2026-10-01T00:00:00Z', [{ breed: 'Beagle', pct: 100 }]),
		vote('Cy', '2026-10-03T00:00:00Z', [{ breed: 'Poodle', pct: 100 }]),
		vote('Di', '2026-10-04T00:00:00Z', [
			{ breed: 'Poodle', pct: 60 },
			{ breed: 'Beagle', pct: 40 }
		])
	];
	const revealed = { revealed: true, rows: results };

	it('ranks by score, breaking ties by earlier vote', () => {
		const r = buildReveal(votes, revealed, breeds);
		expect(r.leaderboard.map((v) => [v.name, v.rank, v.score])).toEqual([
			['Ben', 1, 50],
			['Ava', 2, 50],
			['Di', 3, 40],
			['Cy', 4, 0]
		]);
	});

	it('calls out closest, wildest, crowd score and the most popular miss', () => {
		const r = buildReveal(votes, revealed, breeds);
		expect(r.closest.name).toBe('Ben');
		expect(r.wildest.name).toBe('Cy');
		expect(r.popularMiss).toEqual({ breed: 'Poodle', voters: 2, avgPct: 80 });
		expect(r.crowdScore).toBe(
			scoreGuess(
				[
					{ breed: 'Beagle', pct: 60 },
					{ breed: 'Poodle', pct: 40 }
				],
				results,
				breeds
			)
		);
	});

	it('breaks wildest ties toward the later vote', () => {
		const withEd = [...votes, vote('Ed', '2026-10-05T00:00:00Z', [{ breed: 'Poodle', pct: 100 }])];
		expect(buildReveal(withEd, revealed, breeds).wildest.name).toBe('Ed');
	});

	it('has no popular miss when every guessed breed is in the results', () => {
		const r = buildReveal([votes[0]], revealed, breeds);
		expect(r.popularMiss).toBeNull();
	});

	it('does not count a breed as a miss when its group is in the results', () => {
		const r = buildReveal([vote('Gus', 't', [{ breed: 'Rat Terrier', pct: 100 }])], revealed, breeds);
		expect(r.popularMiss).toBeNull();
	});

	it('returns empty results with zero votes', () => {
		expect(buildReveal([], revealed, breeds)).toEqual({
			leaderboard: [],
			closest: null,
			wildest: null,
			crowdScore: null,
			popularMiss: null
		});
	});
});

describe('floating-point ties', () => {
	it('treats scores that display the same as tied, so the earlier vote wins', () => {
		const fractional = [
			{ name: 'Beagle', pct: 10.1 },
			{ name: 'Rat Terrier', pct: 20.2 },
			{ name: 'Poodle', pct: 30.3 }
		];
		const early = vote('Early', '2026-10-01T00:00:00Z', [
			{ breed: 'Beagle', pct: 50 },
			{ breed: 'Rat Terrier', pct: 50 }
		]);
		const late = vote('Late', '2026-10-02T00:00:00Z', [{ breed: 'Poodle', pct: 100 }]);
		const r = buildReveal([late, early], { revealed: true, rows: fractional }, breeds);
		expect(r.leaderboard.map((v) => v.name)).toEqual(['Early', 'Late']);
		expect(r.leaderboard[0].score).toBe(30.3);
	});
});
