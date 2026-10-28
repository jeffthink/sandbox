import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('./googleAuth.js', () => ({ getAccessToken: vi.fn(async () => 'tok') }));

const { parseSettings, parseBreeds, parseResults, loadDog, appendVote, _resetStoreCache } = await import(
	'./store.js'
);
const { SetupError } = await import('./config.js');

const env = {
	GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@example-project.iam.gserviceaccount.com',
	GOOGLE_PRIVATE_KEY: 'unused-in-tests',
	DOGVOTE_BISCUIT_SHEET_ID: 'sheet1'
};

const tabs = {
	settings: [
		['key', 'value'],
		['dog_name', 'Biscuit'],
		['pronoun', 'she'],
		['intro', 'Hi'],
		['photos', 'a.jpg']
	],
	votes: [
		['timestamp', 'name', 'guesses', 'comment'],
		['2026-10-01T00:00:00Z', 'Ava', '[{"breed":"Beagle","pct":100}]', '']
	],
	breeds: [
		['breed', 'group', 'image_url'],
		['Beagle', 'Scent Hound group', '']
	],
	results: [
		['revealed', 'FALSE'],
		['breed_or_group', 'pct']
	]
};

/**
 * Fake Sheets API: batchGet returns `data`, append records the row,
 * single-range reads serve the results tab.
 */
function fakeSheets(data = tabs, { status = 200, errorMessage = '' } = {}) {
	const calls = { batchGet: 0, append: /** @type {unknown[]} */ ([]), read: 0 };
	const fetch = vi.fn(async (url, init) => {
		if (status !== 200) {
			return new Response(JSON.stringify({ error: { message: errorMessage } }), { status });
		}
		if (url.includes(':append?')) {
			calls.append.push(JSON.parse(init.body).values[0]);
			return new Response('{}', { status: 200 });
		}
		if (url.includes('values:batchGet')) {
			calls.batchGet += 1;
			return Response.json({
				valueRanges: [{ values: data.settings }, { values: data.votes }, { values: data.breeds }, { values: data.results }]
			});
		}
		calls.read += 1;
		return Response.json({ values: data.results.slice(0, 2) });
	});
	return { fetch, calls };
}

beforeEach(() => _resetStoreCache());
afterEach(() => vi.useRealTimers());

describe('parseSettings', () => {
	it('resolves bare photo names under the dog’s folder and keeps full URLs', () => {
		const settings = parseSettings(
			[
				['key', 'value'],
				['Dog_Name', 'Biscuit'],
				['photos', 'a.jpg, https://x.test/b.png,']
			],
			'biscuit'
		);
		expect(settings).toEqual({
			dogName: 'Biscuit',
			pronoun: 'they',
			intro: '',
			photos: ['/dog-vote/biscuit/a.jpg', 'https://x.test/b.png']
		});
	});
	it('falls back to "they" for an unknown pronoun', () => {
		expect(parseSettings([['dog_name', 'Biscuit'], ['pronoun', 'it']], 'biscuit').pronoun).toBe('they');
	});
	it('requires dog_name', () => {
		expect(() => parseSettings([['key', 'value']], 'biscuit')).toThrow(/dog_name/);
	});
});

describe('parseBreeds', () => {
	it('reads breed, group and optional image_url by header, skipping blank breeds', () => {
		expect(
			parseBreeds([
				['Group', 'Breed'],
				['Terrier group', 'Rat Terrier'],
				['Hound', '']
			])
		).toEqual([{ breed: 'Rat Terrier', group: 'Terrier group', imageUrl: '', credit: '', creditUrl: '' }]);
	});
	it('reads optional photo credits, keeping only https credit links', () => {
		expect(
			parseBreeds([
				['breed', 'group', 'image_url', 'image_credit', 'image_credit_url'],
				['Pug', 'Companion group', 'https://x/pug.jpg', 'Pat Doe · CC BY 2.0', 'https://x/pug-page'],
				['Akita', 'Asian and Oceanian group', 'https://x/akita.jpg', 'Lee Roe', 'javascript:alert(1)']
			])
		).toEqual([
			{ breed: 'Pug', group: 'Companion group', imageUrl: 'https://x/pug.jpg', credit: 'Pat Doe · CC BY 2.0', creditUrl: 'https://x/pug-page' },
			{ breed: 'Akita', group: 'Asian and Oceanian group', imageUrl: 'https://x/akita.jpg', credit: 'Lee Roe', creditUrl: '' }
		]);
	});
	it('requires the breed and group headers', () => {
		expect(() => parseBreeds([['name', 'kind']])).toThrow(/breeds/);
	});
});

describe('parseResults', () => {
	it('reads the revealed switch and numeric rows', () => {
		expect(
			parseResults([
				['revealed', 'TRUE'],
				['breed_or_group', 'pct'],
				['Beagle', '37.5'],
				['Terrier group', 'n/a'],
				['Boxer', '62.5%']
			])
		).toEqual({
			revealed: true,
			rows: [
				{ name: 'Beagle', pct: 37.5 },
				{ name: 'Boxer', pct: 62.5 }
			]
		});
		expect(parseResults([['Revealed', 'false'], ['breed_or_group', 'pct']]).revealed).toBe(false);
	});
	it('rejects a layout shifted by a stray column', () => {
		expect(() =>
			parseResults([
				['1', 'revealed', 'FALSE'],
				['2', 'breed_or_group', 'pct']
			])
		).toThrow(/revealed/);
	});
});

describe('loadDog', () => {
	it('loads and parses all four tabs, keeping only latest votes', async () => {
		const data = {
			...tabs,
			votes: [
				...tabs.votes,
				['2026-10-02T00:00:00Z', 'ava', '[{"breed":"Boxer","pct":100}]', '']
			]
		};
		const { fetch } = fakeSheets(data);
		const dog = await loadDog({ env, fetch, slug: 'biscuit' });
		expect(dog.settings.dogName).toBe('Biscuit');
		expect(dog.breeds).toHaveLength(1);
		expect(dog.votes).toHaveLength(1);
		expect(dog.votes[0].guesses[0].breed).toBe('Boxer');
		expect(dog.results).toEqual({ revealed: false, rows: [] });
	});

	it('caches for 15 seconds per dog', async () => {
		vi.useFakeTimers();
		const { fetch, calls } = fakeSheets();
		await loadDog({ env, fetch, slug: 'biscuit' });
		vi.advanceTimersByTime(14_000);
		await loadDog({ env, fetch, slug: 'biscuit' });
		expect(calls.batchGet).toBe(1);
		vi.advanceTimersByTime(1_001);
		await loadDog({ env, fetch, slug: 'biscuit' });
		expect(calls.batchGet).toBe(2);
	});

	it('requires the votes headers', async () => {
		const { fetch } = fakeSheets({ ...tabs, votes: [['when', 'who']] });
		await expect(loadDog({ env, fetch, slug: 'biscuit' })).rejects.toThrow(/votes/);
	});

	it('explains a sheet that is not shared with the service account', async () => {
		const { fetch } = fakeSheets(tabs, { status: 403, errorMessage: 'The caller does not have permission' });
		const attempt = loadDog({ env, fetch, slug: 'biscuit' });
		await expect(attempt).rejects.toBeInstanceOf(SetupError);
		await expect(loadDog({ env, fetch, slug: 'biscuit' })).rejects.toThrow(
			/isn't shared with svc@example-project/
		);
	});

	it('names a missing tab', async () => {
		const { fetch } = fakeSheets(tabs, { status: 400, errorMessage: 'Unable to parse range: breeds!A:C' });
		await expect(loadDog({ env, fetch, slug: 'biscuit' })).rejects.toThrow(/Tab `breeds` not found/);
	});

	it('explains a wrong sheet id', async () => {
		const { fetch } = fakeSheets(tabs, { status: 404, errorMessage: 'Requested entity was not found.' });
		await expect(loadDog({ env, fetch, slug: 'biscuit' })).rejects.toThrow(/DOGVOTE_BISCUIT_SHEET_ID/);
	});
});

describe('appendVote', () => {
	const vote = { name: 'Ben', guesses: [{ breed: 'Beagle', pct: 100 }], comment: 'hm' };
	const now = () => new Date('2026-10-05T12:00:00.000Z');

	it('appends a timestamped row and invalidates the cache', async () => {
		const { fetch, calls } = fakeSheets();
		await loadDog({ env, fetch, slug: 'biscuit' });
		expect(await appendVote({ env, fetch, slug: 'biscuit', vote, now })).toBe('ok');
		expect(calls.append).toEqual([
			['2026-10-05T12:00:00.000Z', 'Ben', '[{"breed":"Beagle","pct":100}]', 'hm']
		]);
		await loadDog({ env, fetch, slug: 'biscuit' });
		expect(calls.batchGet).toBe(2);
	});

	it('refuses once revealed, reading the switch fresh', async () => {
		const { fetch, calls } = fakeSheets();
		await loadDog({ env, fetch, slug: 'biscuit' }); // cached as not revealed
		const revealedTabs = { ...tabs, results: [['revealed', 'TRUE'], ['breed_or_group', 'pct']] };
		const revealed = fakeSheets(revealedTabs);
		expect(await appendVote({ env, fetch: revealed.fetch, slug: 'biscuit', vote, now })).toBe('closed');
		expect(revealed.calls.append).toEqual([]);
		expect(calls.append).toEqual([]);
	});
});

describe('appendVote when closed', () => {
	it('drops the cached page data so the reveal shows on the next load', async () => {
		const open = fakeSheets();
		await loadDog({ env, fetch: open.fetch, slug: 'biscuit' }); // cached as not revealed
		const revealedTabs = { ...tabs, results: [['revealed', 'TRUE'], ['breed_or_group', 'pct']] };
		const closed = fakeSheets(revealedTabs);
		expect(
			await appendVote({ env, fetch: closed.fetch, slug: 'biscuit', vote: { name: 'Ben', guesses: [{ breed: 'Beagle', pct: 100 }], comment: '' } })
		).toBe('closed');
		const dog = await loadDog({ env, fetch: closed.fetch, slug: 'biscuit' });
		expect(dog.results.revealed).toBe(true);
	});
});
