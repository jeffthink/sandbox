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

describe('demoSwimData realism', () => {
	const processedRaces = () => {
		const result = processSwimData(meets, races);
		return Array.isArray(result) ? result : (result.races ?? result.processedRaces ?? []);
	};

	const eventKey = (r) => `${r.Distance} ${r.Stroke}`;

	const isRelay = (r) => r.Stroke.includes('Relay');

	it('gives each swimmer 2-5 distinct individual events, and not everyone the same number', () => {
		const eventsBySwimmer = {};
		for (const r of races) {
			if (isRelay(r)) continue; // relays are team events, not individual variety
			(eventsBySwimmer[r.Swimmer] ??= new Set()).add(eventKey(r));
		}
		const counts = Object.values(eventsBySwimmer).map((s) => s.size);
		for (const c of counts) {
			expect(c).toBeGreaterThanOrEqual(2);
			expect(c).toBeLessThanOrEqual(5);
		}
		// event variety must differ between swimmers (requirement 1)
		expect(new Set(counts).size).toBeGreaterThan(1);
	});

	it('has swimmers competing head-to-head in the same race', () => {
		// requirement 2: ≥2 of our swimmers in the same meet + age group + event
		const fieldKey = (r) => `${r.MeetId}|${r.AgeGroup}|${r.Distance}|${r.Stroke}|${r.EventNumber}`;
		const swimmersByRace = {};
		for (const r of races) {
			(swimmersByRace[fieldKey(r)] ??= new Set()).add(r.Swimmer);
		}
		const sharedRaces = Object.values(swimmersByRace).filter((s) => s.size >= 2);
		expect(sharedRaces.length).toBeGreaterThan(0);
	});

	it('keeps finish order consistent within shared races (faster time = better place)', () => {
		const out = processedRaces();
		const fieldKey = (r) => `${r.MeetId}|${r.AgeGroup}|${r.Distance}|${r.Stroke}|${r.EventNumber}`;
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
				// faster swimmer must not have a worse (larger) place
				expect(byTime[i - 1].Place).toBeLessThan(byTime[i].Place);
			}
		}
	});

	it('does not let swimmers finish top-2 too often', () => {
		// requirement 3
		const out = processedRaces();
		const timed = out.filter((r) => !r.isDQ && typeof r.Place === 'number');
		const topTwo = timed.filter((r) => r.Place <= 2);
		expect(topTwo.length / timed.length).toBeLessThan(0.15);
	});

	it('does not hit personal records too often', () => {
		// requirement 4 — most swims are not PRs (first-ever swims aside)
		const out = processedRaces();
		const timed = out.filter((r) => !r.isDQ);
		const prs = timed.filter((r) => r.isPersonalRecord);
		expect(prs.length / timed.length).toBeLessThan(0.5);
	});

	it('does not improve uniformly within an event (times fluctuate)', () => {
		// requirement 5 — at least one event where a later swim is slower than an earlier one
		const byKey = {};
		for (const r of races) {
			if (r.Time === 'DQ') continue;
			(byKey[`${r.Swimmer}|${eventKey(r)}`] ??= []).push(r);
		}
		const meetOrder = Object.keys(MEET_ORDER);
		const hasFluctuation = Object.values(byKey).some((group) => {
			const seconds = group
				.slice()
				.sort((a, b) => meetOrder.indexOf(a.MeetId) - meetOrder.indexOf(b.MeetId))
				.map((r) => toSeconds(r.Time));
			return seconds.some((t, i) => i > 0 && t > seconds[i - 1]);
		});
		expect(hasFluctuation).toBe(true);
	});

	it('includes at least one team loss', () => {
		// requirement 6
		const losses = meets.filter(
			(m) => Number(m.TheirPoints) > 0 && Number(m.OurPoints) < Number(m.TheirPoints)
		);
		expect(losses.length).toBeGreaterThan(0);
	});
});

// chronological meet order + a tiny time parser, local to the realism tests
const MEET_ORDER = {
	'2025-06-14-week-1': 0,
	'2025-06-21-week-2': 1,
	'2025-06-28-week-3': 2,
	'2025-07-12-champs': 3
};

function toSeconds(time) {
	const parts = String(time).split(':');
	return parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : Number(parts[0]);
}
