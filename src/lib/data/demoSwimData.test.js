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

describe('demoSwimData de-identification', () => {
	// The demo data is seeded from a real season. This guard fails loudly if any
	// real identifier ever reappears here (names, ID initials, team/league names).
	it('contains no real identifiers', () => {
		const blob = JSON.stringify({ meets, races, swimmers });
		const forbidden = [
			/quinn/i, /maeve/i, /\beva\b/i,
			/fry'?s spring/i, /monticello/i, /farmington/i, /forest lake/i, /key west/i, /fairview/i,
			/\bjsl\b/i, /\bcity\b/i, /fsbc/i, /lmst/i, /flst/i, /kwc/i,
			/-qb\b/i, /-mb\b/i, /-eb\b/i,
			/🐨/, /🐱/, /🐖/
		];
		for (const re of forbidden) {
			expect(blob).not.toMatch(re);
		}
	});
});

describe('demoSwimData season integrity', () => {
	const processed = () => {
		const result = processSwimData(meets, races);
		return Array.isArray(result) ? result : (result.races ?? result.processedRaces ?? []);
	};
	const fieldKey = (r) => `${r.MeetId}|${r.AgeGroup}|${r.Distance}|${r.Stroke}|${r.EventNumber}`;

	it('has swimmers competing head-to-head in the same race', () => {
		const swimmersByRace = {};
		for (const r of races) {
			(swimmersByRace[fieldKey(r)] ??= new Set()).add(r.Swimmer);
		}
		expect(Object.values(swimmersByRace).some((s) => s.size >= 2)).toBe(true);
	});

	it('keeps finish order consistent within shared individual races', () => {
		const out = processed();
		const byRace = {};
		for (const r of out) {
			// relays are team events: teammates legitimately share a time and place
			if (r.isDQ || typeof r.Place !== 'number' || r.Stroke.includes('Relay')) continue;
			(byRace[fieldKey(r)] ??= []).push(r);
		}
		for (const group of Object.values(byRace)) {
			if (group.length < 2) continue;
			const byTime = [...group].sort((a, b) => a.timeInSeconds - b.timeInSeconds);
			for (let i = 1; i < byTime.length; i++) {
				// the faster swimmer must not have a worse (larger) place
				expect(byTime[i - 1].Place).toBeLessThan(byTime[i].Place);
			}
		}
	});

	it('includes at least one team loss', () => {
		const losses = meets.filter(
			(m) => Number(m.TheirPoints) > 0 && Number(m.OurPoints) < Number(m.TheirPoints)
		);
		expect(losses.length).toBeGreaterThan(0);
	});
});
