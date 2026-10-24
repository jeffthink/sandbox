import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./store.js', () => ({ loadDog: vi.fn(), appendVote: vi.fn() }));

const { loadDog, appendVote } = await import('./store.js');
const { loadPage, handleVote, handleCrowd } = await import('./handlers.js');
const { SetupError } = await import('./config.js');

const env = { DOGVOTE_BISCUIT_SHEET_ID: 'sheet1' };
const fetch = /** @type {typeof globalThis.fetch} */ (vi.fn());

function dog({ revealed = false } = {}) {
	return {
		settings: { dogName: 'Biscuit', pronoun: 'she', intro: '', photos: [] },
		breeds: [{ breed: 'Beagle', group: 'Scent Hound group', imageUrl: '' }],
		votes: [
			{ name: 'Ava', timestamp: '2026-10-01T00:00:00Z', guesses: [{ breed: 'Beagle', pct: 100 }], comment: '' }
		],
		results: { revealed, rows: revealed ? [{ name: 'Beagle', pct: 100 }] : [] }
	};
}

beforeEach(() => {
	vi.mocked(loadDog).mockReset().mockResolvedValue(dog());
	vi.mocked(appendVote).mockReset().mockResolvedValue('ok');
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('loadPage', () => {
	it('404s for an unknown dog', async () => {
		expect(await loadPage({ env, fetch, slug: 'rex', dev: true })).toEqual({ status: 404 });
	});

	it('returns settings, breeds and a count but no individual votes before the reveal', async () => {
		const data = await loadPage({ env, fetch, slug: 'biscuit', dev: false });
		expect(data).toMatchObject({ slug: 'biscuit', count: 1, revealed: false, reveal: null });
		expect(data.settings.dogName).toBe('Biscuit');
		expect(data).not.toHaveProperty('votes');
	});

	it('includes the leaderboard and results once revealed', async () => {
		vi.mocked(loadDog).mockResolvedValue(dog({ revealed: true }));
		const data = await loadPage({ env, fetch, slug: 'biscuit', dev: false });
		expect(data.reveal.leaderboard).toHaveLength(1);
		expect(data.reveal.results).toEqual([{ name: 'Beagle', pct: 100 }]);
	});

	it('shows setup details only in dev', async () => {
		vi.mocked(loadDog).mockRejectedValue(new SetupError('Tab `votes` not found.'));
		expect(await loadPage({ env, fetch, slug: 'biscuit', dev: true })).toEqual({
			setupError: 'Tab `votes` not found.'
		});
		expect(await loadPage({ env, fetch, slug: 'biscuit', dev: false })).toEqual({
			setupError: "This game isn't set up yet."
		});
	});
});

describe('handleVote', () => {
	const body = { name: 'Ben', guesses: [{ breed: 'beagle', pct: 100 }], comment: '' };

	it('404s for an unknown dog', async () => {
		expect((await handleVote({ env, fetch, slug: 'rex', body })).status).toBe(404);
	});

	it('rejects an invalid vote with field errors', async () => {
		const res = await handleVote({ env, fetch, slug: 'biscuit', body: { ...body, guesses: [] } });
		expect(res.status).toBe(400);
		expect(res.body.errors.guesses).toBeTruthy();
		expect(appendVote).not.toHaveBeenCalled();
	});

	it('appends the canonicalized vote and returns the crowd view', async () => {
		vi.mocked(loadDog)
			.mockResolvedValueOnce(dog())
			.mockResolvedValueOnce({
				...dog(),
				votes: [...dog().votes, { ...body, guesses: [{ breed: 'Beagle', pct: 100 }], timestamp: '2026-10-02T00:00:00Z' }]
			});
		const res = await handleVote({ env, fetch, slug: 'biscuit', body });
		expect(res.status).toBe(200);
		expect(vi.mocked(appendVote).mock.calls[0][0].vote).toEqual({
			name: 'Ben',
			guesses: [{ breed: 'Beagle', pct: 100 }],
			comment: ''
		});
		expect(res.body.ok).toBe(true);
		expect(res.body.crowd).toMatchObject({ count: 2, voted: true });
	});

	it('409s once voting has closed', async () => {
		vi.mocked(appendVote).mockResolvedValue('closed');
		const res = await handleVote({ env, fetch, slug: 'biscuit', body });
		expect(res).toEqual({ status: 409, body: { error: 'Voting is closed' } });
	});

	it('returns a generic 500 when saving fails', async () => {
		vi.mocked(appendVote).mockRejectedValue(new Error('network down'));
		const res = await handleVote({ env, fetch, slug: 'biscuit', body });
		expect(res.status).toBe(500);
		expect(res.body.error).not.toMatch(/network/);
	});
});

describe('handleCrowd', () => {
	it('returns the full crowd only to someone who voted', async () => {
		expect((await handleCrowd({ env, fetch, slug: 'biscuit', name: 'ava' })).body).toMatchObject({
			count: 1,
			voted: true
		});
		expect((await handleCrowd({ env, fetch, slug: 'biscuit', name: null })).body).toEqual({
			count: 1,
			voted: false
		});
	});

	it('404s for an unknown dog', async () => {
		expect((await handleCrowd({ env, fetch, slug: 'rex', name: null })).status).toBe(404);
	});
});
