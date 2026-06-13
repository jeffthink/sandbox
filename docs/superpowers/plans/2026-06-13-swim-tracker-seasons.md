# Swim Tracker Season Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared, multi-select "Season" (calendar year) filter to the swim tracker dashboard that applies to all four views and defaults to the current year, falling back to the latest year with data.

**Architecture:** A season is a calendar year derived from each meet's `Date` — no data schema change. The data utility (`swimData.js`) is extended to tag each race with its `season`, expose the list of `seasons`, support filtering by season, and compute the default selection. Processing is centralized in `SwimDashboard.svelte`: it receives raw `meets`/`races`, owns the `selectedSeasons` state, and reactively re-runs `processSwimData()` on the season-filtered subset so all stats (PRs, improvements, highlights) are season-scoped. The two page routes stop pre-processing and just pass raw data.

**Tech Stack:** SvelteKit, Svelte reactive statements, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-swim-tracker-seasons-design.md`

---

## File Structure

- **Modify** `src/lib/utils/swimData.js` — add `season` to processed races, `seasons` to `filters`, `seasons` support in `filterRaces`, and a new exported `getDefaultSeasons(allSeasons, currentYear)`.
- **Create** `src/lib/utils/swimData.test.js` — unit tests for the new season behavior.
- **Modify** `src/lib/components/swim-tracker/SwimDashboard.svelte` — switch props to raw `meets`/`races`, own `selectedSeasons`, render the Season chip row, reactively re-process.
- **Modify** `src/routes/swim-tracker/+page.svelte` — pass raw `meets`/`races`; drop `processSwimData`.
- **Modify** `src/routes/swim-tracker/family/+page.svelte` — pass `data.meets`/`data.races`; drop `processSwimData`.

---

## Task 1: Tag each processed race with its season

**Files:**
- Modify: `src/lib/utils/swimData.js` (inside `processSwimData`, the `processedRaces` map ~lines 132-155, and the `filters` return ~lines 203-219)
- Test: `src/lib/utils/swimData.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `src/lib/utils/swimData.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { processSwimData, filterRaces, getDefaultSeasons } from './swimData.js';

const MEETS = [
	{ MeetId: 'm-2024', Date: '2024-07-01', MeetName: 'Old Meet', PoolUnit: 'meters' },
	{ MeetId: 'm-2025a', Date: '2025-06-11', MeetName: 'Week 1', PoolUnit: 'meters' },
	{ MeetId: 'm-2025b', Date: '2025-07-02', MeetName: 'Week 4', PoolUnit: 'meters' }
];

const RACES = [
	{ RaceId: 'r1', MeetId: 'm-2024', Swimmer: 'Coral', Distance: '50', Stroke: 'Freestyle', Time: '40.00', Place: '1', NumSwimmers: '8' },
	{ RaceId: 'r2', MeetId: 'm-2025a', Swimmer: 'Coral', Distance: '50', Stroke: 'Freestyle', Time: '39.00', Place: '1', NumSwimmers: '8' },
	{ RaceId: 'r3', MeetId: 'm-2025b', Swimmer: 'Coral', Distance: '50', Stroke: 'Freestyle', Time: '38.00', Place: '1', NumSwimmers: '8' }
];

describe('season tagging', () => {
	it('attaches the meet calendar year as race.season (a number)', () => {
		const { races } = processSwimData(MEETS, RACES);
		const byId = Object.fromEntries(races.map((r) => [r.RaceId, r]));
		expect(byId.r1.season).toBe(2024);
		expect(byId.r2.season).toBe(2025);
		expect(byId.r3.season).toBe(2025);
	});

	it('exposes filters.seasons as all present years sorted descending', () => {
		const { filters } = processSwimData(MEETS, RACES);
		expect(filters.seasons).toEqual([2025, 2024]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: FAIL — `race.season` is `undefined` and `filters.seasons` is `undefined`.

- [ ] **Step 3: Add `season` to each processed race**

In `src/lib/utils/swimData.js`, inside the `processedRaces` map, the returned object currently ends with:

```js
			eventKey: getEventKey(race),
			date: meet ? meet.Date : null
		};
```

Change it to add `season`:

```js
			eventKey: getEventKey(race),
			date: meet ? meet.Date : null,
			season: meet ? meet.Date.getFullYear() : null
		};
```

(`meet.Date` is already a `Date` object at this point — see the `meetsMap` construction earlier in the function.)

- [ ] **Step 4: Add `seasons` to the returned filters**

The filters block currently reads:

```js
	const swimmers = [...new Set(processedRaces.map(r => r.Swimmer))].sort();
	const events = [...new Set(processedRaces.map(r => r.eventKey))].sort();
	const meetNames = [...new Set(meets.map(m => m.MeetName))].sort();
	const strokes = [...new Set(races.map(r => r.Stroke))].sort();
```

Add a `seasons` line after `strokes`:

```js
	const swimmers = [...new Set(processedRaces.map(r => r.Swimmer))].sort();
	const events = [...new Set(processedRaces.map(r => r.eventKey))].sort();
	const meetNames = [...new Set(meets.map(m => m.MeetName))].sort();
	const strokes = [...new Set(races.map(r => r.Stroke))].sort();
	const seasons = [...new Set(processedRaces.map(r => r.season))].sort((a, b) => b - a);
```

Then add `seasons` to the `filters` object in the return value:

```js
		filters: {
			swimmers,
			events,
			meetNames,
			strokes,
			seasons
		}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: PASS (both `season tagging` tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils/swimData.js src/lib/utils/swimData.test.js
git commit -m "feat: tag processed races with season year"
```

---

## Task 2: Support filtering races by season

**Files:**
- Modify: `src/lib/utils/swimData.js` (`filterRaces` ~lines 229-240)
- Test: `src/lib/utils/swimData.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/utils/swimData.test.js`:

```js
describe('filterRaces by season', () => {
	it('keeps only races whose season is in the seasons array', () => {
		const { races } = processSwimData(MEETS, RACES);
		const filtered = filterRaces(races, { seasons: [2025] });
		expect(filtered.map((r) => r.RaceId).sort()).toEqual(['r2', 'r3']);
	});

	it('is a no-op when seasons is empty or undefined', () => {
		const { races } = processSwimData(MEETS, RACES);
		expect(filterRaces(races, { seasons: [] })).toHaveLength(3);
		expect(filterRaces(races, {})).toHaveLength(3);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: FAIL — `filterRaces` ignores `seasons`, so the first test returns 3 races instead of 2.

- [ ] **Step 3: Add the season clause to `filterRaces`**

`filterRaces` currently reads:

```js
export function filterRaces(races, filters) {
	return races.filter(race => {
		if (filters.swimmer && race.Swimmer !== filters.swimmer) return false;
		if (filters.stroke && race.Stroke !== filters.stroke) return false;
		if (filters.event && race.eventKey !== filters.event) return false;
		if (filters.meet && race.meet.MeetName !== filters.meet) return false;
		if (filters.startDate && race.date < filters.startDate) return false;
		if (filters.endDate && race.date > filters.endDate) return false;

		return true;
	});
}
```

Add the `seasons` clause after the `endDate` check:

```js
export function filterRaces(races, filters) {
	return races.filter(race => {
		if (filters.swimmer && race.Swimmer !== filters.swimmer) return false;
		if (filters.stroke && race.Stroke !== filters.stroke) return false;
		if (filters.event && race.eventKey !== filters.event) return false;
		if (filters.meet && race.meet.MeetName !== filters.meet) return false;
		if (filters.startDate && race.date < filters.startDate) return false;
		if (filters.endDate && race.date > filters.endDate) return false;
		if (filters.seasons && filters.seasons.length > 0 && !filters.seasons.includes(race.season)) return false;

		return true;
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: PASS (all season tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/swimData.js src/lib/utils/swimData.test.js
git commit -m "feat: support season filtering in filterRaces"
```

---

## Task 3: Add `getDefaultSeasons` helper

**Files:**
- Modify: `src/lib/utils/swimData.js` (add new exported function near the end of the file)
- Test: `src/lib/utils/swimData.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/utils/swimData.test.js`:

```js
describe('getDefaultSeasons', () => {
	it('returns the current year when it has data', () => {
		expect(getDefaultSeasons([2025, 2024], 2025)).toEqual([2025]);
	});

	it('falls back to the latest year when the current year has no data', () => {
		expect(getDefaultSeasons([2025, 2024], 2026)).toEqual([2025]);
	});

	it('returns an empty array when there are no seasons', () => {
		expect(getDefaultSeasons([], 2026)).toEqual([]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: FAIL — `getDefaultSeasons is not a function` / import is undefined.

- [ ] **Step 3: Implement `getDefaultSeasons`**

Add to the end of `src/lib/utils/swimData.js`:

```js
/**
 * Computes the default season selection for the dashboard filter.
 * @param {number[]} allSeasons - All years present in the data
 * @param {number} currentYear - The current calendar year
 * @returns {number[]} [currentYear] if it has data, else [latestYear], else []
 */
export function getDefaultSeasons(allSeasons, currentYear) {
	if (!allSeasons || allSeasons.length === 0) return [];
	if (allSeasons.includes(currentYear)) return [currentYear];
	return [Math.max(...allSeasons)];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/utils/swimData.test.js`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/swimData.js src/lib/utils/swimData.test.js
git commit -m "feat: add getDefaultSeasons helper"
```

---

## Task 4: Move processing into SwimDashboard and add the Season filter UI

**Files:**
- Modify: `src/lib/components/swim-tracker/SwimDashboard.svelte`

The current component receives `processedData`, `meets`, `swimmerEmojis` and renders a tab nav plus the active view. We switch it to receive raw `meets`/`races`, own the season state, and re-process reactively.

- [ ] **Step 1: Replace the `<script>` block**

Current `<script>`:

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
```

Replace it with:

```svelte
<script>
	import SummerSummary from '$lib/components/swim-tracker/SummerSummary.svelte';
	import RacesTable from '$lib/components/swim-tracker/RacesTable.svelte';
	import TimeProgressChart from '$lib/components/swim-tracker/TimeProgressChart.svelte';
	import MeetPerformanceChart from '$lib/components/swim-tracker/MeetPerformanceChart.svelte';
	import { processSwimData, getDefaultSeasons } from '$lib/utils/swimData.js';

	export let meets = [];
	export let races = [];
	export let swimmerEmojis = {};

	let activeView = 'summary'; // 'summary' | 'table' | 'progress' | 'meets'

	// All calendar years present in the data, most recent first.
	$: allSeasons = [...new Set(meets.map((m) => new Date(m.Date).getFullYear()))].sort((a, b) => b - a);

	// Default selection: current year if it has data, else the latest year.
	let selectedSeasons = null;
	$: if (selectedSeasons === null && allSeasons.length > 0) {
		selectedSeasons = getDefaultSeasons(allSeasons, new Date().getFullYear());
	}

	function toggleSeason(year) {
		selectedSeasons = selectedSeasons.includes(year)
			? selectedSeasons.filter((y) => y !== year)
			: [...selectedSeasons, year];
	}

	function selectAllSeasons() {
		selectedSeasons = [...allSeasons];
	}

	$: allSelected = selectedSeasons !== null && selectedSeasons.length === allSeasons.length;

	// Re-process only the meets/races within the selected seasons so stats stay season-scoped.
	$: seasonSet = new Set(selectedSeasons ?? []);
	$: filteredMeets = meets.filter((m) => seasonSet.has(new Date(m.Date).getFullYear()));
	$: filteredMeetIds = new Set(filteredMeets.map((m) => m.MeetId));
	$: filteredRaces = races.filter((r) => filteredMeetIds.has(r.MeetId));
	$: processedData = processSwimData(filteredMeets, filteredRaces);
</script>
```

- [ ] **Step 2: Add the Season chip row above the tab nav**

The markup currently starts with:

```svelte
<div class="nav-tabs">
```

Insert this block immediately before `<div class="nav-tabs">` (only shown when there is more than one season):

```svelte
{#if allSeasons.length > 1}
	<div class="season-filter">
		<span class="season-label">Season:</span>
		{#each allSeasons as year}
			<button
				type="button"
				class="season-chip"
				class:active={selectedSeasons?.includes(year)}
				on:click={() => toggleSeason(year)}
			>{year}</button>
		{/each}
		<button
			type="button"
			class="season-chip season-all"
			class:active={allSelected}
			on:click={selectAllSeasons}
		>All</button>
	</div>
{/if}
```

- [ ] **Step 3: Add styles for the chip row**

In the `<style>` block, add after the `.nav-tabs { ... }` rule (before `.nav-tab`):

```css
	.season-filter {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.season-label {
		color: #7f8c8d;
		font-size: 0.9rem;
		font-weight: 600;
		margin-right: 0.25rem;
	}
	.season-chip {
		padding: 0.35rem 0.9rem;
		border: 1px solid #d0d7de;
		border-radius: 999px;
		background: white;
		color: #7f8c8d;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.season-chip:hover { color: #2c3e50; border-color: #3498db; }
	.season-chip.active {
		background: #3498db;
		border-color: #3498db;
		color: white;
	}
```

- [ ] **Step 4: Pass season-filtered meets to MeetPerformanceChart**

The view block currently passes the raw `meets` prop to `MeetPerformanceChart`:

```svelte
		{:else if activeView === 'meets'}
			<MeetPerformanceChart {meets} />
		{/if}
```

Change it to pass `filteredMeets` so the meet view respects the season selection. Use an explicit prop name since the variable name differs:

```svelte
		{:else if activeView === 'meets'}
			<MeetPerformanceChart meets={filteredMeets} />
		{/if}
```

(The other three views read `data={processedData}`, which is already season-scoped — leave them unchanged.)

- [ ] **Step 5: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds with no Svelte compile errors. (The routes still pass the old props at this point; they are fixed in Tasks 5-6. If the build flags unused/missing props it will be a warning, not a failure — proceed.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/swim-tracker/SwimDashboard.svelte
git commit -m "feat: add season filter and centralize processing in SwimDashboard"
```

---

## Task 5: Update the public demo route to pass raw data

**Files:**
- Modify: `src/routes/swim-tracker/+page.svelte`

- [ ] **Step 1: Update the script and props**

Current `<script>`:

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
```

Replace with (drop `processSwimData`; the dashboard processes now):

```svelte
<script>
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { meets, races, swimmers } from '$lib/data/demoSwimData.js';

	const swimmerEmojis = Object.fromEntries(
		swimmers.filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
	);
</script>
```

Then update the component usage from:

```svelte
	<SwimDashboard {processedData} {meets} {swimmerEmojis} />
```

to:

```svelte
	<SwimDashboard {meets} {races} {swimmerEmojis} />
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/routes/swim-tracker/+page.svelte
git commit -m "feat: pass raw data to SwimDashboard on demo route"
```

---

## Task 6: Update the family route to pass raw data

**Files:**
- Modify: `src/routes/swim-tracker/family/+page.svelte`

- [ ] **Step 1: Stop pre-processing in `loadData`**

The `loadData` function currently contains:

```js
			const data = await res.json();
			meets = data.meets;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			processedData = processSwimData(data.meets, data.races);
			unlocked = true;
```

Replace with (store raw `races`; drop the `processSwimData` call):

```js
			const data = await res.json();
			meets = data.meets;
			races = data.races;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			unlocked = true;
```

- [ ] **Step 2: Update the imports and state declarations**

Current:

```js
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { processSwimData } from '$lib/utils/swimData.js';
```

Replace with (remove the now-unused `processSwimData` import):

```js
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
```

Current state declarations:

```js
	let processedData = null;
	let meets = [];
	let swimmerEmojis = {};
```

Replace with:

```js
	let meets = [];
	let races = [];
	let swimmerEmojis = {};
```

- [ ] **Step 3: Update the component usage**

Current:

```svelte
		<SwimDashboard {processedData} {meets} {swimmerEmojis} />
```

Replace with:

```svelte
		<SwimDashboard {meets} {races} {swimmerEmojis} />
```

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/routes/swim-tracker/family/+page.svelte
git commit -m "feat: pass raw data to SwimDashboard on family route"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all suites green, including the new `swimData.test.js`.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manual smoke test in dev**

Run: `npm run dev`, then in a browser:
- Open `/swim-tracker`. Because the demo is 2025-only and today is 2026, the dashboard shows 2025 data (latest-year fallback) and the season chip row is **hidden** (only one season). Confirm all four tabs render data.
- (Optional, to see the chip row) temporarily add a meet+race with a 2024 or 2026 date to `demoSwimData.js`, reload, and confirm: a "Season:" chip row appears above the tabs; the current/latest year is preselected; toggling years and "All" updates every view; clearing all chips shows each view's empty state. Revert the temporary data afterward.

- [ ] **Step 4: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: verify season filter end-to-end"
```

(Skip if there is nothing to commit.)

---

## Notes for the implementer

- `selectedSeasons` starts as `null` so the reactive default-init runs exactly once after `allSeasons` is known; never compare against `null` without the `?.`/`?? []` guards already shown.
- `new Date().getFullYear()` is intentionally called in the component (not the util) so the util stays pure and testable; the util's `getDefaultSeasons` takes `currentYear` as a parameter.
- Re-processing on every season toggle is cheap at this data scale (tens of meets); no memoization needed (YAGNI).
- Existing per-view filters (e.g. `RacesTable`'s meet dropdown) automatically reflect only the selected seasons because they read from the re-processed `processedData.filters`.
