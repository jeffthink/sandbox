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
