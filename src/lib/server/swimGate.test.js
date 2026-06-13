import { describe, it, expect } from 'vitest';
import { verifyPassword } from './swimGate.js';
import { loadSwimData } from './swimGate.js';

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
