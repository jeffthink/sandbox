import { describe, it, expect, vi } from 'vitest';
import {
	normalizeName,
	normalizeGroup,
	validateVote,
	parseVoteRows,
	latestVotesByName,
	consensus,
	crowdView
} from './rules.js';

const breeds = [
	{ breed: 'Beagle', group: 'Scent Hound group', imageUrl: '' },
	{ breed: 'Boxer', group: 'Working group', imageUrl: '' }
];

/** @param {Record<string, unknown>} overrides */
function input(overrides = {}) {
	return { name: 'Ava', guesses: [{ breed: 'Boxer', pct: 100 }], comment: '', ...overrides };
}

describe('normalizeName / normalizeGroup', () => {
	it('trims, lowercases and collapses whitespace', () => {
		expect(normalizeName('  Aunt   Sue ')).toBe('aunt sue');
	});
	it('strips a trailing " group" for groups only', () => {
		expect(normalizeGroup('Terrier group')).toBe('terrier');
		expect(normalizeGroup(' terrier  GROUP ')).toBe('terrier');
		expect(normalizeGroup('Terrier')).toBe('terrier');
		expect(normalizeName('Terrier group')).toBe('terrier group');
	});
});

describe('validateVote', () => {
	it('trims the name and canonicalizes listed breeds, keeping free text', () => {
		expect(
			validateVote(
				{
					name: '  Ava ',
					guesses: [
						{ breed: 'beagle ', pct: 60 },
						{ breed: 'Mystery Mutt', pct: 40 }
					],
					comment: ''
				},
				breeds
			)
		).toEqual({
			ok: true,
			vote: {
				name: 'Ava',
				guesses: [
					{ breed: 'Beagle', pct: 60 },
					{ breed: 'Mystery Mutt', pct: 40 }
				],
				comment: ''
			}
		});
	});

	it('keeps spreadsheet-formula-looking text verbatim', () => {
		const result = validateVote(input({ name: '=HYPERLINK("x")', comment: '+1 @x' }), breeds);
		expect(result.ok).toBe(true);
		expect(result.vote.name).toBe('=HYPERLINK("x")');
		expect(result.vote.comment).toBe('+1 @x');
	});

	it('treats a missing comment as empty', () => {
		const { comment, ...noComment } = input();
		expect(validateVote(noComment, breeds).vote.comment).toBe('');
	});

	it.each([[''], ['   '], ['x'.repeat(51)], [undefined]])('rejects name %j', (name) => {
		const result = validateVote(input({ name }), breeds);
		expect(result.ok).toBe(false);
		expect(result.errors.name).toBeTruthy();
	});

	const five20 = ['Beagle', 'Boxer', 'Pug', 'Akita', 'Vizsla'].map((breed) => ({ breed, pct: 20 }));
	it.each([
		['no guesses', []],
		['six guesses', [...five20.map((g) => ({ ...g, pct: 16 })), { breed: 'Puli', pct: 20 }]],
		['sum 99', [{ breed: 'Beagle', pct: 99 }]],
		['pct 0', [{ breed: 'Beagle', pct: 0 }, { breed: 'Boxer', pct: 100 }]],
		['fractional pct', [{ breed: 'Beagle', pct: 50.5 }, { breed: 'Boxer', pct: 49.5 }]],
		['string pct', [{ breed: 'Beagle', pct: '50' }, { breed: 'Boxer', pct: 50 }]],
		['duplicate breed', [{ breed: 'Boxer', pct: 50 }, { breed: 'boxer', pct: 50 }]],
		['breed too long', [{ breed: 'x'.repeat(61), pct: 100 }]],
		['blank breed', [{ breed: '  ', pct: 100 }]],
		['not an array', 'Beagle']
	])('rejects guesses: %s', (_label, guesses) => {
		const result = validateVote(input({ guesses }), breeds);
		expect(result.ok).toBe(false);
		expect(result.errors.guesses).toBeTruthy();
	});

	it.each([['x'.repeat(281)], [5]])('rejects comment %#', (comment) => {
		const result = validateVote(input({ comment }), breeds);
		expect(result.ok).toBe(false);
		expect(result.errors.comment).toBeTruthy();
	});

	it.each([[null], ['str']])('rejects a non-object body %j', (body) => {
		const result = validateVote(body, breeds);
		expect(result.ok).toBe(false);
		expect(result.errors.name).toBeTruthy();
	});

	it('accepts the boundaries: 50-char name, 280-char comment, 5 guesses', () => {
		const result = validateVote(
			input({ name: 'x'.repeat(50), comment: 'x'.repeat(280), guesses: five20 }),
			breeds
		);
		expect(result.ok).toBe(true);
	});

	it('reports the running total when the sum is off', () => {
		const result = validateVote(input({ guesses: [{ breed: 'Beagle', pct: 99 }] }), breeds);
		expect(result.errors.guesses).toMatch(/99/);
	});
});

describe('parseVoteRows', () => {
	it('parses good rows and skips malformed ones without throwing', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const rows = [
			['2026-10-01T10:00:00Z', 'Ava', '[{"breed":"Beagle","pct":100}]', 'hi'],
			[],
			['2026-10-01T11:00:00Z', '', '[]', ''],
			['2026-10-01T12:00:00Z', 'Ben', 'not json', ''],
			['2026-10-01T13:00:00Z', 'Cy', '[{"breed":"Boxer","pct":"100"}]'],
			['', 'Di', '[{"breed":"Boxer","pct":100}]', ''],
			['2026-10-01T14:00:00Z', 'Ed', '{"breed":"Boxer"}', ''],
			['2026-10-01T15:00:00Z', 'Flo', '[{"breed":"Boxer","pct":"lots"}]', '']
		];
		expect(parseVoteRows(rows)).toEqual([
			{ timestamp: '2026-10-01T10:00:00Z', name: 'Ava', guesses: [{ breed: 'Beagle', pct: 100 }], comment: 'hi' },
			{ timestamp: '2026-10-01T13:00:00Z', name: 'Cy', guesses: [{ breed: 'Boxer', pct: 100 }], comment: '' }
		]);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

/** @returns {import('./rules.js').Vote} */
function vote(name, timestamp, guesses = [{ breed: 'Beagle', pct: 100 }], comment = '') {
	return { name, timestamp, guesses, comment };
}

describe('latestVotesByName', () => {
	it('keeps one vote per normalized name, the latest by timestamp', () => {
		const votes = [
			vote('Ava', '2026-10-01T10:00:00Z', [{ breed: 'Beagle', pct: 100 }]),
			vote('Ben', '2026-10-01T11:00:00Z'),
			vote('ava  ', '2026-10-01T12:00:00Z', [{ breed: 'Boxer', pct: 100 }])
		];
		const latest = latestVotesByName(votes);
		expect(latest).toHaveLength(2);
		const ava = latest.find((v) => normalizeName(v.name) === 'ava');
		expect(ava.guesses).toEqual([{ breed: 'Boxer', pct: 100 }]);
		expect(ava.name).toBe('ava');
	});

	it('breaks equal timestamps by later sheet order', () => {
		const latest = latestVotesByName([
			vote('Ava', '2026-10-01T10:00:00Z', [{ breed: 'Beagle', pct: 100 }]),
			vote('AVA', '2026-10-01T10:00:00Z', [{ breed: 'Boxer', pct: 100 }])
		]);
		expect(latest).toEqual([vote('AVA', '2026-10-01T10:00:00Z', [{ breed: 'Boxer', pct: 100 }])]);
	});
});

describe('consensus', () => {
	it('averages across all voters, counting 0 for unpicked breeds', () => {
		const result = consensus([
			vote('Ava', 't1', [{ breed: 'Beagle', pct: 100 }]),
			vote('Ben', 't2', [
				{ breed: 'beagle', pct: 50 },
				{ breed: 'Boxer', pct: 50 }
			])
		]);
		expect(result.all).toEqual([
			{ breed: 'Beagle', pct: 75 },
			{ breed: 'Boxer', pct: 25 }
		]);
		expect(result.top).toEqual(result.all);
	});

	it('folds everything past the top 8 into Other', () => {
		const guesses = Array.from({ length: 10 }, (_, i) => ({ breed: `Breed ${i}`, pct: 10 }));
		const { top } = consensus([vote('Ava', 't1', guesses)]);
		expect(top).toHaveLength(9);
		expect(top[8]).toEqual({ breed: 'Other', pct: 20, other: true });
	});

	it('returns empty lists with no votes', () => {
		expect(consensus([])).toEqual({ all: [], top: [] });
	});
});

describe('crowdView', () => {
	const votes = [vote('Ava', '2026-10-01T10:00:00Z'), vote('Ben', '2026-10-01T12:00:00Z')];

	it('reveals consensus and votes (newest first) to someone who voted', () => {
		const view = crowdView(votes, 'AVA ');
		expect(view.count).toBe(2);
		expect(view.voted).toBe(true);
		expect(view.consensus).toEqual([{ breed: 'Beagle', pct: 100 }]);
		expect(view.votes.map((v) => v.name)).toEqual(['Ben', 'Ava']);
	});

	it('returns only the count to someone who has not voted', () => {
		expect(crowdView(votes, 'Zed')).toEqual({ count: 2, voted: false });
		expect(crowdView(votes, null)).toEqual({ count: 2, voted: false });
	});
});
