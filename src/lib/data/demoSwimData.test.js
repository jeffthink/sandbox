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
