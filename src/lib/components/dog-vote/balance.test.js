import { describe, it, expect } from 'vitest';
import { evenSplit, appendRemainder, snap, stepUp, stepDown, totalStatus, STEP } from './balance.js';

describe('evenSplit', () => {
	it('splits 100 into multiples of 5, larger shares first', () => {
		expect(evenSplit(1)).toEqual([100]);
		expect(evenSplit(2)).toEqual([50, 50]);
		expect(evenSplit(3)).toEqual([35, 35, 30]);
		expect(evenSplit(4)).toEqual([25, 25, 25, 25]);
		expect(evenSplit(5)).toEqual([20, 20, 20, 20, 20]);
		expect(evenSplit(0)).toEqual([]);
	});
});

describe('appendRemainder', () => {
	it('gives a new breed whatever is left, leaving the others alone', () => {
		expect(appendRemainder([60, 25])).toEqual([60, 25, 15]);
	});
	it('starts a new breed at the smallest step when nothing is left', () => {
		expect(appendRemainder([60, 40])).toEqual([60, 40, STEP]);
		expect(appendRemainder([80, 40])).toEqual([80, 40, STEP]);
	});
});

describe('snap / stepUp / stepDown', () => {
	it('snaps to the nearest 5 within [5, max]', () => {
		expect(snap(33, 90)).toBe(35);
		expect(snap(32, 90)).toBe(30);
		expect(snap(1, 90)).toBe(5);
		expect(snap(97, 90)).toBe(90);
	});
	it('steps to the next multiple of 5, so odd values land on round numbers', () => {
		expect(stepUp(33, 90)).toBe(35);
		expect(stepUp(35, 90)).toBe(40);
		expect(stepUp(90, 90)).toBe(90);
		expect(stepDown(33)).toBe(30);
		expect(stepDown(30)).toBe(25);
		expect(stepDown(5)).toBe(5);
	});
});

describe('totalStatus', () => {
	it('is ready at exactly 100', () => {
		expect(totalStatus([60, 40])).toEqual({ total: 100, ok: true, label: '100% ✓' });
	});
	it('says how much is left', () => {
		expect(totalStatus([60, 25])).toEqual({ total: 85, ok: false, label: '85% · 15% left' });
	});
	it('says how much is over', () => {
		expect(totalStatus([60, 50])).toEqual({ total: 110, ok: false, label: '110% · 10% over' });
	});
});
