# Swim Tracker Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the real swim results behind a server-side password gate (Google CSV URL never reaches the browser) and turn the public `/swim-tracker` route into a synthetic, bundled-data demo.

**Architecture:** `/swim-tracker` becomes a fully static demo that imports a synthetic dataset from the repo (no network, no password). `/swim-tracker/family` is a password-gated page that POSTs to a new `/api/swim-data` Vercel serverless function; the function holds the Google CSV URLs and the password as server-side env vars, validates the password, fetches + parses the CSVs server-side, and returns JSON. Both pages render through a shared `SwimDashboard` component. The site adapter switches from `adapter-static` to `adapter-vercel` so the one function route can run while all other pages stay prerendered/static.

**Tech Stack:** SvelteKit (Svelte 5), `@sveltejs/adapter-vercel`, Node `crypto` for constant-time password compare, Vitest for unit tests on the pure logic.

**Reference spec:** `docs/superpowers/specs/2026-06-13-swim-tracker-privacy-design.md`

---

## File Structure

**Create:**
- `vitest.config.js` — Vitest config (node environment, `src/**/*.test.js`).
- `src/lib/server/swimGate.js` — server-only logic: `verifyPassword()` (constant-time) and `loadSwimData()` (fetch + parse CSVs via injected fetch). `$lib/server/*` is never bundled to the client.
- `src/lib/server/swimGate.test.js` — unit tests for the above.
- `src/routes/api/swim-data/+server.js` — the gated POST endpoint; wires `$env/dynamic/private` + request into `swimGate`.
- `src/lib/data/demoSwimData.js` — synthetic `meets`, `races`, `swimmers` arrays in CSV-parser shape (string values).
- `src/lib/data/demoSwimData.test.js` — referential-integrity + processing test for the demo data.
- `src/lib/components/swim-tracker/SwimDashboard.svelte` — shared tabs + content, props `{ processedData, meets, swimmerEmojis }`.
- `src/lib/utils/googleSheetsCSV.test.js` — unit tests for `parseCSV`.
- `src/routes/swim-tracker/family/+page.svelte` — the password-gated real tracker.

**Modify:**
- `src/lib/utils/googleSheetsCSV.js` — export the currently-private `parseCSV`.
- `src/routes/swim-tracker/+page.svelte` — rewrite to render the demo from bundled data via `SwimDashboard`.
- `svelte.config.js` — swap adapter to `@sveltejs/adapter-vercel`.
- `package.json` — adapter dependency swap, add `vitest` + `test` script.
- `.env`, `.env.example` — replace `VITE_*` swim URLs with server-side `MEETS_CSV_URL` / `RACES_CSV_URL` / `SWIMMERS_CSV_URL` / `SWIM_PASSWORD`.
- `README.md`, `src/routes/swim-tracker/README.md` — document the demo/gated split and new env vars.

---

## Task 1: Test harness + export `parseCSV`

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json`
- Modify: `src/lib/utils/googleSheetsCSV.js`
- Test: `src/lib/utils/googleSheetsCSV.test.js`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: `vitest` added to `devDependencies`, install completes with no errors.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.js']
	}
});
```

- [ ] **Step 3: Add the test script to package.json**

In `package.json`, add to the `"scripts"` object:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing test for `parseCSV`**

Create `src/lib/utils/googleSheetsCSV.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseCSV } from './googleSheetsCSV.js';

describe('parseCSV', () => {
	it('parses headers and rows into objects', () => {
		const csv = 'Name,Time\nMarlin Waters,35.20\nPip Splash,38.40';
		expect(parseCSV(csv)).toEqual([
			{ Name: 'Marlin Waters', Time: '35.20' },
			{ Name: 'Pip Splash', Time: '38.40' }
		]);
	});

	it('handles quoted values containing commas', () => {
		const csv = 'Name,Note\n"Reef, Coral","fast, very fast"';
		expect(parseCSV(csv)).toEqual([
			{ Name: 'Reef, Coral', Note: 'fast, very fast' }
		]);
	});

	it('returns an empty array for empty input', () => {
		expect(parseCSV('')).toEqual([]);
	});
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `parseCSV` is not exported (import resolves to `undefined`), so calling it throws "parseCSV is not a function".

- [ ] **Step 6: Export `parseCSV`**

In `src/lib/utils/googleSheetsCSV.js`, change the `parseCSV` declaration from:

```js
function parseCSV(csvText) {
```

to:

```js
export function parseCSV(csvText) {
```

(Leave `parseCSVLine` and `fetchSheetCSV` unchanged.)

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 passing tests.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.js package.json package-lock.json src/lib/utils/googleSheetsCSV.js src/lib/utils/googleSheetsCSV.test.js
git commit -m "test: add vitest harness and export parseCSV"
```

---

## Task 2: Constant-time password verification

**Files:**
- Create: `src/lib/server/swimGate.js`
- Test: `src/lib/server/swimGate.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/server/swimGate.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { verifyPassword } from './swimGate.js';

describe('verifyPassword', () => {
	it('returns true when the password matches', () => {
		expect(verifyPassword('correct horse', 'correct horse')).toBe(true);
	});

	it('returns false when the password does not match', () => {
		expect(verifyPassword('wrong', 'correct horse')).toBe(false);
	});

	it('returns false when the expected password is empty', () => {
		expect(verifyPassword('anything', '')).toBe(false);
	});

	it('returns false for non-string input', () => {
		expect(verifyPassword(undefined, 'correct horse')).toBe(false);
		expect(verifyPassword(null, 'correct horse')).toBe(false);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot import `verifyPassword` from a non-existent module.

- [ ] **Step 3: Implement `verifyPassword`**

Create `src/lib/server/swimGate.js`:

```js
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time password comparison. Both inputs are hashed to a fixed-length
 * digest first so timingSafeEqual never sees mismatched lengths (which would
 * throw and could leak length information).
 * @param {unknown} submitted - password provided by the client
 * @param {unknown} expected - the configured SWIM_PASSWORD
 * @returns {boolean}
 */
export function verifyPassword(submitted, expected) {
	if (typeof submitted !== 'string' || typeof expected !== 'string' || expected.length === 0) {
		return false;
	}
	const a = createHash('sha256').update(submitted).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `verifyPassword` tests green (plus Task 1's tests still passing).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/swimGate.js src/lib/server/swimGate.test.js
git commit -m "feat: add constant-time swim password verification"
```

---

## Task 3: Server-side `loadSwimData`

**Files:**
- Modify: `src/lib/server/swimGate.js`
- Test: `src/lib/server/swimGate.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/server/swimGate.test.js`:

```js
import { loadSwimData } from './swimGate.js';

describe('loadSwimData', () => {
	function fakeFetch(map) {
		return async (url) => {
			if (!(url in map)) return { ok: false, status: 404, text: async () => '' };
			return { ok: true, status: 200, text: async () => map[url] };
		};
	}

	it('fetches and parses meets, races, and swimmers', async () => {
		const fetch = fakeFetch({
			'meets': 'MeetId,MeetName\nm1,Week 1',
			'races': 'RaceId,MeetId,Swimmer\nr1,m1,Marlin Waters',
			'swimmers': 'Name,Emoji\nMarlin Waters,🐟'
		});
		const data = await loadSwimData({
			meetsUrl: 'meets', racesUrl: 'races', swimmersUrl: 'swimmers', fetch
		});
		expect(data.meets).toEqual([{ MeetId: 'm1', MeetName: 'Week 1' }]);
		expect(data.races).toEqual([{ RaceId: 'r1', MeetId: 'm1', Swimmer: 'Marlin Waters' }]);
		expect(data.swimmers).toEqual([{ Name: 'Marlin Waters', Emoji: '🐟' }]);
	});

	it('returns empty swimmers when no swimmers URL is provided', async () => {
		const fetch = fakeFetch({
			'meets': 'MeetId\nm1',
			'races': 'RaceId\nr1'
		});
		const data = await loadSwimData({ meetsUrl: 'meets', racesUrl: 'races', swimmersUrl: '', fetch });
		expect(data.swimmers).toEqual([]);
	});

	it('throws when a required CSV fetch fails', async () => {
		const fetch = fakeFetch({ 'races': 'RaceId\nr1' });
		await expect(
			loadSwimData({ meetsUrl: 'meets', racesUrl: 'races', swimmersUrl: '', fetch })
		).rejects.toThrow();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `loadSwimData` is not exported yet.

- [ ] **Step 3: Implement `loadSwimData`**

Add to `src/lib/server/swimGate.js` (keep the existing `verifyPassword`; add this import at the top and the functions below):

```js
import { parseCSV } from '../utils/googleSheetsCSV.js';

/**
 * @param {string} url
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Array<Record<string, string>>>}
 */
async function fetchCsvRows(url, fetchImpl) {
	const res = await fetchImpl(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch CSV (${res.status})`);
	}
	return parseCSV(await res.text());
}

/**
 * Fetches and parses the three swim CSVs server-side.
 * @param {{ meetsUrl: string, racesUrl: string, swimmersUrl?: string, fetch: typeof fetch }} opts
 * @returns {Promise<{ meets: Array, races: Array, swimmers: Array }>}
 */
export async function loadSwimData({ meetsUrl, racesUrl, swimmersUrl, fetch: fetchImpl }) {
	const [meets, races, swimmers] = await Promise.all([
		fetchCsvRows(meetsUrl, fetchImpl),
		fetchCsvRows(racesUrl, fetchImpl),
		swimmersUrl ? fetchCsvRows(swimmersUrl, fetchImpl) : Promise.resolve([])
	]);
	return { meets, races, swimmers };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `loadSwimData` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/swimGate.js src/lib/server/swimGate.test.js
git commit -m "feat: add server-side loadSwimData CSV fetcher"
```

---

## Task 4: The gated `/api/swim-data` endpoint

**Files:**
- Create: `src/routes/api/swim-data/+server.js`
- Modify: `.env`

This endpoint depends on `$env/dynamic/private`, so it is verified manually against the dev server rather than with a unit test.

- [ ] **Step 1: Add the server-side env vars to `.env`**

Append to `.env` (keep the existing `VITE_*` lines for now — they are removed in Task 8). Reuse the same Google published-CSV URLs that the `VITE_*` vars currently hold, and choose a strong passphrase:

```bash
# Server-side swim tracker config (never shipped to the browser)
MEETS_CSV_URL=<same URL as VITE_MEETS_CSV_URL>
RACES_CSV_URL=<same URL as VITE_RACES_CSV_URL>
SWIMMERS_CSV_URL=<same URL as VITE_SWIMMERS_CSV_URL>
SWIM_PASSWORD=<a strong passphrase, not a short PIN>
```

- [ ] **Step 2: Create the endpoint**

Create `src/routes/api/swim-data/+server.js`:

```js
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { verifyPassword, loadSwimData } from '$lib/server/swimGate.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function POST({ request, fetch }) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	if (!verifyPassword(body?.password, env.SWIM_PASSWORD ?? '')) {
		throw error(401, 'Incorrect password');
	}

	try {
		const data = await loadSwimData({
			meetsUrl: env.MEETS_CSV_URL,
			racesUrl: env.RACES_CSV_URL,
			swimmersUrl: env.SWIMMERS_CSV_URL,
			fetch
		});
		return json(data);
	} catch {
		// Do not leak internal URLs or fetch details to the client.
		throw error(500, 'Could not load swim data');
	}
}
```

- [ ] **Step 3: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:5173` (note the actual port if different).

- [ ] **Step 4: Verify a wrong password is rejected**

Run: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5173/api/swim-data -H "Content-Type: application/json" -d '{"password":"definitely-wrong"}'`
Expected: `401`

- [ ] **Step 5: Verify the correct password returns data**

Run (replace `YOUR_PASSWORD` with the `SWIM_PASSWORD` value from `.env`):
`curl -s -X POST http://localhost:5173/api/swim-data -H "Content-Type: application/json" -d '{"password":"YOUR_PASSWORD"}' | head -c 300`
Expected: HTTP 200 with a JSON body beginning `{"meets":[...` containing real meet/race data.

- [ ] **Step 6: Commit**

Note: `.env` is git-ignored and is NOT committed.

```bash
git add src/routes/api/swim-data/+server.js
git commit -m "feat: add gated /api/swim-data serverless endpoint"
```

---

## Task 5: Synthetic demo dataset

**Files:**
- Create: `src/lib/data/demoSwimData.js`
- Test: `src/lib/data/demoSwimData.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/demoSwimData.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { meets, races, swimmers } from './demoSwimData.js';
import { processSwimData } from '../utils/swimData.js';

const MEET_KEYS = ['MeetId', 'Date', 'MeetName', 'Opponent', 'Location', 'PoolSize', 'PoolUnit', 'OurPoints', 'TheirPoints', 'TeamPlace', 'NumTeams'];
const RACE_KEYS = ['RaceId', 'MeetId', 'Swimmer', 'EventNumber', 'AgeGroup', 'Distance', 'Stroke', 'Time', 'Place', 'NumSwimmers'];

describe('demoSwimData', () => {
	it('has meets, races, and swimmers', () => {
		expect(meets.length).toBeGreaterThan(0);
		expect(races.length).toBeGreaterThan(0);
		expect(swimmers.length).toBeGreaterThan(0);
	});

	it('every meet row has the expected columns', () => {
		for (const meet of meets) {
			for (const key of MEET_KEYS) expect(meet).toHaveProperty(key);
		}
	});

	it('every race row has the expected columns', () => {
		for (const race of races) {
			for (const key of RACE_KEYS) expect(race).toHaveProperty(key);
		}
	});

	it('every race references an existing meet', () => {
		const meetIds = new Set(meets.map((m) => m.MeetId));
		for (const race of races) {
			expect(meetIds.has(race.MeetId)).toBe(true);
		}
	});

	it('processSwimData runs and yields at least one personal record', () => {
		const result = processSwimData(meets, races);
		expect(result).toBeTruthy();
		const racesOut = Array.isArray(result) ? result : (result.races ?? result.processedRaces ?? []);
		expect(racesOut.some((r) => r.isPersonalRecord)).toBe(true);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `./demoSwimData.js` does not exist.

- [ ] **Step 3: Create the demo dataset**

Create `src/lib/data/demoSwimData.js`. Values are strings to mirror what `parseCSV` produces from a real sheet.

```js
/**
 * Synthetic swim data for the public demo. All swimmers and meets are fictional.
 * Values are strings to match the shape produced by the CSV parser, so this data
 * flows through processSwimData() identically to real sheet data.
 */

// MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams
const MEET_ROWS = [
	['2025-06-14-week-1', '2025-06-14', 'Summer League Week 1', 'Otters', 'Home Pool', 25, 'meters', 312, 288, '', ''],
	['2025-06-21-week-2', '2025-06-21', 'Summer League Week 2', 'Sharks', 'Away Pool', 25, 'meters', 305, 295, '', ''],
	['2025-06-28-week-3', '2025-06-28', 'Summer League Week 3', 'Dolphins', 'Home Pool', 25, 'meters', 330, 270, '', ''],
	['2025-07-12-champs', '2025-07-12', 'Summer Championships', 'Multiple', 'Regional Aquatic Center', 25, 'meters', 0, 0, 2, 6]
];

// RaceId, MeetId, Swimmer, EventNumber, AgeGroup, Distance, Stroke, Time, Place, NumSwimmers
const RACE_ROWS = [
	// Marlin Waters — 50 Freestyle (steady improvement, wins at champs)
	['R001', '2025-06-14-week-1', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '35.20', 3, 8],
	['R002', '2025-06-21-week-2', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '34.85', 2, 8],
	['R003', '2025-06-28-week-3', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '34.10', 2, 8],
	['R004', '2025-07-12-champs', 'Marlin Waters', 12, '11-12', 50, 'Freestyle', '33.60', 1, 8],
	// Marlin Waters — 50 Backstroke
	['R005', '2025-06-14-week-1', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '42.10', 4, 8],
	['R006', '2025-06-21-week-2', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '41.50', 3, 8],
	['R007', '2025-06-28-week-3', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '41.80', 3, 8],
	['R008', '2025-07-12-champs', 'Marlin Waters', 20, '11-12', 50, 'Backstroke', '40.90', 2, 8],
	// Pip Splash — 50 Freestyle (DQ at champs)
	['R009', '2025-06-14-week-1', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '38.40', 5, 8],
	['R010', '2025-06-21-week-2', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '37.90', 4, 8],
	['R011', '2025-06-28-week-3', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '37.20', 4, 8],
	['R012', '2025-07-12-champs', 'Pip Splash', 12, '11-12', 50, 'Freestyle', 'DQ', 'DQ', 8],
	// Pip Splash — 100 IM
	['R013', '2025-06-14-week-1', 'Pip Splash', 9, '11-12', 100, 'IM', '1:34.50', 4, 6],
	['R014', '2025-06-21-week-2', 'Pip Splash', 9, '11-12', 100, 'IM', '1:32.80', 3, 6],
	['R015', '2025-06-28-week-3', 'Pip Splash', 9, '11-12', 100, 'IM', '1:31.40', 3, 6],
	['R016', '2025-07-12-champs', 'Pip Splash', 24, '11-12', 100, 'IM', '1:30.10', 2, 6],
	// Coral Reef — 25 Freestyle (8 & Under)
	['R017', '2025-06-14-week-1', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.90', 2, 6],
	['R018', '2025-06-21-week-2', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.40', 2, 6],
	['R019', '2025-06-28-week-3', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.10', 1, 6],
	['R020', '2025-07-12-champs', 'Coral Reef', 4, '8 & Under', 25, 'Freestyle', '17.80', 1, 6],
	// Coral Reef — 25 Butterfly
	['R021', '2025-06-14-week-1', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '22.30', 3, 6],
	['R022', '2025-06-21-week-2', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '21.80', 2, 6],
	['R023', '2025-06-28-week-3', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '21.50', 2, 6],
	['R024', '2025-07-12-champs', 'Coral Reef', 8, '8 & Under', 25, 'Butterfly', '21.20', 2, 6],
	// Finn Current — 100 Freestyle (13-14)
	['R025', '2025-06-14-week-1', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:12.40', 3, 8],
	['R026', '2025-06-21-week-2', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:11.20', 2, 8],
	['R027', '2025-06-28-week-3', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:10.50', 2, 8],
	['R028', '2025-07-12-champs', 'Finn Current', 28, '13-14', 100, 'Freestyle', '1:09.80', 1, 8],
	// Finn Current — 50 Breaststroke
	['R029', '2025-06-14-week-1', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '45.60', 4, 8],
	['R030', '2025-06-21-week-2', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '45.10', 3, 8],
	['R031', '2025-06-28-week-3', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '44.30', 3, 8],
	['R032', '2025-07-12-champs', 'Finn Current', 32, '13-14', 50, 'Breaststroke', '43.90', 2, 8]
];

export const meets = MEET_ROWS.map(
	([MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams]) => ({
		MeetId,
		Date,
		MeetName,
		Opponent,
		Location,
		PoolSize: String(PoolSize),
		PoolUnit,
		OurPoints: String(OurPoints),
		TheirPoints: String(TheirPoints),
		TeamPlace: String(TeamPlace),
		NumTeams: String(NumTeams)
	})
);

export const races = RACE_ROWS.map(
	([RaceId, MeetId, Swimmer, EventNumber, AgeGroup, Distance, Stroke, Time, Place, NumSwimmers]) => ({
		RaceId,
		MeetId,
		Swimmer,
		EventNumber: String(EventNumber),
		AgeGroup,
		Distance: String(Distance),
		Stroke,
		Time,
		Place: String(Place),
		NumSwimmers: String(NumSwimmers)
	})
);

export const swimmers = [
	{ Name: 'Marlin Waters', Emoji: '🐟' },
	{ Name: 'Pip Splash', Emoji: '🐬' },
	{ Name: 'Coral Reef', Emoji: '🐠' },
	{ Name: 'Finn Current', Emoji: '🦈' }
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `demoSwimData` tests green. If the personal-record assertion fails, the `racesOut` extraction line in the test does not match `processSwimData`'s return shape; open `src/lib/utils/swimData.js`, confirm the property name of the processed-races array in the returned object, and update the fallback chain in the test accordingly.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/demoSwimData.js src/lib/data/demoSwimData.test.js
git commit -m "feat: add synthetic demo swim dataset"
```

---

## Task 6: Shared `SwimDashboard` + rewrite `/swim-tracker` as the demo

**Files:**
- Create: `src/lib/components/swim-tracker/SwimDashboard.svelte`
- Modify: `src/routes/swim-tracker/+page.svelte`

- [ ] **Step 1: Create the shared dashboard component**

Create `src/lib/components/swim-tracker/SwimDashboard.svelte`. This is the tabs + content extracted from the current `+page.svelte`, parameterized by props.

```svelte
<script>
	import SummerSummary from '$lib/components/swim-tracker/SummerSummary.svelte';
	import RacesTable from '$lib/components/swim-tracker/RacesTable.svelte';
	import TimeProgressChart from '$lib/components/swim-tracker/TimeProgressChart.svelte';
	import MeetPerformanceChart from '$lib/components/swim-tracker/MeetPerformanceChart.svelte';

	export let processedData;
	export let meets = [];
	export let swimmerEmojis = {};

	let activeView = 'summary'; // 'summary' | 'table' | 'progress' | 'meets'
</script>

<div class="nav-tabs">
	<button class="nav-tab" class:active={activeView === 'summary'} on:click={() => (activeView = 'summary')}>🏆 Summer Highlights</button>
	<button class="nav-tab" class:active={activeView === 'table'} on:click={() => (activeView = 'table')}>📊 Race Results</button>
	<button class="nav-tab" class:active={activeView === 'progress'} on:click={() => (activeView = 'progress')}>📈 Time Progress</button>
	<button class="nav-tab" class:active={activeView === 'meets'} on:click={() => (activeView = 'meets')}>📅 Meet Performance</button>
</div>

<div class="content">
	{#if activeView === 'summary'}
		<SummerSummary data={processedData} {swimmerEmojis} />
	{:else if activeView === 'table'}
		<RacesTable data={processedData} />
	{:else if activeView === 'progress'}
		<TimeProgressChart data={processedData} />
	{:else if activeView === 'meets'}
		<MeetPerformanceChart {meets} />
	{/if}
</div>

<style>
	.nav-tabs {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #ecf0f1;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.nav-tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		color: #7f8c8d;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: -2px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.nav-tab:hover { color: #2c3e50; }
	.nav-tab.active { color: #3498db; border-bottom-color: #3498db; }
	.content {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		min-height: 400px;
	}
	@media (max-width: 768px) {
		.content { padding: 1rem; border-radius: 4px; }
		.nav-tabs { gap: 0.5rem; margin-bottom: 1rem; }
		.nav-tab { padding: 0.5rem 1rem; font-size: 0.875rem; }
	}
	@media (max-width: 480px) {
		.nav-tab { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
	}
</style>
```

- [ ] **Step 2: Rewrite `/swim-tracker/+page.svelte` to render the demo**

Replace the entire contents of `src/routes/swim-tracker/+page.svelte` with:

```svelte
<script>
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { processSwimData } from '$lib/utils/swimData.js';
	import { meets, races, swimmers } from '$lib/data/demoSwimData.js';

	// Computed at build time during prerender — no network, no password.
	const processedData = processSwimData(meets, races);
	const swimmerEmojis = Object.fromEntries(
		swimmers.filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
	);
</script>

<svelte:head>
	<title>Swim Tracker Demo - Interactive Sandbox</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Swim Times Tracker <span class="demo-badge">Demo</span></h1>
		<p>Track meet results and visualize swimming progress over time. This demo uses fictional swimmers and synthetic data.</p>
		<a class="family-link" href="/swim-tracker/family">🔒 Family results</a>
	</div>

	<SwimDashboard {processedData} {meets} {swimmerEmojis} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
	.demo-badge {
		font-size: 0.7em;
		vertical-align: middle;
		background: #3498db;
		color: white;
		padding: 0.15em 0.6em;
		border-radius: 999px;
	}
	.family-link {
		display: inline-block;
		margin-top: 0.5rem;
		color: #3498db;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.family-link:hover { text-decoration: underline; }
	@media (max-width: 768px) {
		.header { margin-bottom: 1rem; }
		.header h1 { font-size: 1.5rem; }
	}
</style>
```

- [ ] **Step 3: Run the unit tests (no regression)**

Run: `npm test`
Expected: PASS — all existing tests still green (this task adds no new tests; it is verified in the browser next).

- [ ] **Step 4: Verify the demo in the browser**

Run: `npm run dev`, then open `http://localhost:5173/swim-tracker`.
Expected:
- All four tabs (Summer Highlights, Race Results, Time Progress, Meet Performance) render with the fictional swimmers (Marlin Waters, Pip Splash, Coral Reef, Finn Current) and the 🔒 Family results link is visible.
- Open DevTools → Network and reload: there is **no request to `docs.google.com`**.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/swim-tracker/SwimDashboard.svelte src/routes/swim-tracker/+page.svelte
git commit -m "feat: render /swim-tracker as a synthetic demo via shared SwimDashboard"
```

---

## Task 7: The gated `/swim-tracker/family` page

**Files:**
- Create: `src/routes/swim-tracker/family/+page.svelte`

- [ ] **Step 1: Create the gated page**

Create `src/routes/swim-tracker/family/+page.svelte`:

```svelte
<script>
	import { onMount } from 'svelte';
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { processSwimData } from '$lib/utils/swimData.js';

	const STORAGE_KEY = 'swim-family-pw';

	let password = '';
	let unlocked = false;
	let loading = false;
	let error = null;

	let processedData = null;
	let meets = [];
	let swimmerEmojis = {};

	async function loadData(pw) {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/swim-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: pw })
			});
			if (res.status === 401) throw new Error('Incorrect password. Please try again.');
			if (!res.ok) throw new Error('Could not load swim data. Please try again later.');

			const data = await res.json();
			meets = data.meets;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			processedData = processSwimData(data.meets, data.races);
			unlocked = true;
			sessionStorage.setItem(STORAGE_KEY, pw);
		} catch (err) {
			error = err.message;
			unlocked = false;
			sessionStorage.removeItem(STORAGE_KEY);
		} finally {
			loading = false;
		}
	}

	function handleSubmit() {
		if (password) loadData(password);
	}

	onMount(() => {
		const saved = sessionStorage.getItem(STORAGE_KEY);
		if (saved) {
			password = saved;
			loadData(saved);
		}
	});
</script>

<svelte:head>
	<title>Family Swim Results</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Family Swim Results</h1>
		<p>Private results. Enter the family password to view.</p>
	</div>

	{#if !unlocked}
		<form class="gate" on:submit|preventDefault={handleSubmit}>
			<label for="pw">Password</label>
			<input id="pw" type="password" bind:value={password} autocomplete="current-password" disabled={loading} />
			<button type="submit" disabled={loading || !password}>{loading ? 'Unlocking…' : 'Unlock'}</button>
			{#if error}<p class="error">{error}</p>{/if}
		</form>
	{:else}
		<SwimDashboard {processedData} {meets} {swimmerEmojis} />
	{/if}
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
	.gate {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 320px;
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}
	.gate label { font-weight: 600; color: #2c3e50; }
	.gate input {
		padding: 0.6rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}
	.gate button {
		padding: 0.6rem;
		border: none;
		border-radius: 4px;
		background: #3498db;
		color: white;
		font-size: 1rem;
		cursor: pointer;
	}
	.gate button:disabled { opacity: 0.6; cursor: not-allowed; }
	.error { color: #c00; margin: 0; }
</style>
```

- [ ] **Step 2: Verify the gate in the browser**

Run: `npm run dev` (if not already running), then open `http://localhost:5173/swim-tracker/family`.
Expected:
- A password form is shown; the dashboard is hidden.
- Entering a wrong password shows "Incorrect password. Please try again." and keeps the form visible.
- Entering the correct `SWIM_PASSWORD` reveals the dashboard with the **real** data.
- In DevTools → Network, the only data request is `POST /api/swim-data`; there is **no request to `docs.google.com`** and the Google CSV URL appears nowhere in the request/response.
- Reload the page: it auto-unlocks (password cached in sessionStorage). Open a new tab to the same URL after closing this one and it prompts again.

- [ ] **Step 3: Commit**

```bash
git add src/routes/swim-tracker/family/+page.svelte
git commit -m "feat: add password-gated /swim-tracker/family page"
```

---

## Task 8: Adapter swap, env cleanup, and docs

**Files:**
- Modify: `package.json`
- Modify: `svelte.config.js`
- Modify: `.env`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `src/routes/swim-tracker/README.md`

- [ ] **Step 1: Swap the adapter dependency**

Run: `npm uninstall @sveltejs/adapter-static && npm install -D @sveltejs/adapter-vercel`
Expected: `@sveltejs/adapter-static` removed and `@sveltejs/adapter-vercel` added in `devDependencies`.

- [ ] **Step 2: Update `svelte.config.js`**

Change the adapter import line from:

```js
import adapter from '@sveltejs/adapter-static';
```

to:

```js
import adapter from '@sveltejs/adapter-vercel';
```

Then replace the `adapter` object in the config with the default invocation (adapter-vercel does not take the static `pages`/`assets`/`fallback` options):

```js
		adapter: adapter(),
```

Leave the `prerender: { handleMissingId: 'warn' }` block unchanged.

- [ ] **Step 3: Remove the now-unused `VITE_*` swim vars from `.env`**

Edit `.env` and delete the three `VITE_MEETS_CSV_URL` / `VITE_RACES_CSV_URL` / `VITE_SWIMMERS_CSV_URL` lines (the demo no longer fetches Google, and the family page uses the server-side vars added in Task 4). Keep `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, and `SWIM_PASSWORD`.

- [ ] **Step 4: Rewrite `.env.example`**

Replace the entire contents of `.env.example` with:

```bash
# Server-side swim tracker config for the gated /swim-tracker/family page.
# These are read by the /api/swim-data serverless function and are NEVER shipped
# to the browser (note: no VITE_ prefix). Set the same values in your Vercel
# project settings for production.
#
# To get the CSV URLs:
# 1. Open your Google Sheet
# 2. File > Share > Publish to web
# 3. Select the sheet tab and CSV format, then Publish and copy the URL
MEETS_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=MEETS_GID&single=true&output=csv
RACES_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=RACES_GID&single=true&output=csv

# Optional: a "Swimmers" tab with "Name" and "Emoji" columns to assign each
# swimmer a custom emoji. Swimmers not listed fall back to a default emoji.
SWIMMERS_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=SWIMMERS_GID&single=true&output=csv

# The password that unlocks the family results page.
# Use a strong passphrase, not a short numeric PIN.
SWIM_PASSWORD=change-me-to-a-strong-passphrase
```

- [ ] **Step 5: Verify the production build**

Run: `npm run build`
Expected: build succeeds. The output indicates `/swim-tracker` and other pages are prerendered, and `/api/swim-data` is built as a serverless/edge function (not prerendered). No error about `prerender` on the API route.

- [ ] **Step 6: Confirm the bundle contains no Google CSV URL**

Run: `grep -rl "docs.google.com" .svelte-kit/output/client/ .vercel/output/static/ 2>/dev/null || echo "CLEAN: no Google URL in client output"`
Expected: `CLEAN: no Google URL in client output` (the URL lives only in server env / the function, never the client bundle). Note: with `adapter-vercel` the client bundle is under `.svelte-kit/output/client/` and `.vercel/output/static/` — not `build/` (that was `adapter-static`).

- [ ] **Step 7: Update documentation**

In `src/routes/swim-tracker/README.md`, add a section near the top explaining the split:

```markdown
## Demo vs. Family results

- `/swim-tracker` is a **public demo** using synthetic, fictional data bundled in
  `src/lib/data/demoSwimData.js`. It makes no network calls and needs no password.
- `/swim-tracker/family` shows the **real** results. It is gated by a password
  checked server-side in the `/api/swim-data` serverless function, which holds the
  published Google Sheet CSV URLs as server-side env vars (`MEETS_CSV_URL`,
  `RACES_CSV_URL`, `SWIMMERS_CSV_URL`) and the `SWIM_PASSWORD`. The CSV URLs are
  never exposed to the browser.

Set `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, and `SWIM_PASSWORD` in
your local `.env` and in the Vercel project settings.
```

In the root `README.md`, find any swim-tracker mention/env-var instructions and update them to reference the new server-side vars (`MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, `SWIM_PASSWORD`) instead of the old `VITE_*` vars, and note that `/swim-tracker` is now a public demo with the real data at `/swim-tracker/family`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json svelte.config.js .env.example README.md src/routes/swim-tracker/README.md
git commit -m "chore: switch to adapter-vercel, move swim config server-side, update docs"
```

---

## Manual Vercel deployment note (not a code step)

After merging, set `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, and
`SWIM_PASSWORD` in the Vercel project's Environment Variables (Production). These
are server-side only — do **not** prefix them with `VITE_`.

If the kids' sheet has been published-to-web for a while, consider rotating it
(new published URL or a fresh sheet) so previously-crawled/cached copies stop
matching what the gate serves.

## Final verification checklist

- [ ] `npm test` — all unit tests pass.
- [ ] `npm run dev` — `/swim-tracker` demo renders all tabs with fictional data and zero Google requests.
- [ ] `/swim-tracker/family` — wrong password rejected, correct password reveals real data, only `/api/swim-data` is called.
- [ ] `npm run build` — succeeds; `/api/swim-data` is a function, pages are prerendered.
- [ ] `grep` of client build output contains no `docs.google.com` URL.
