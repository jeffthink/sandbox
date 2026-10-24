import { describe, it, expect } from 'vitest';
import { addSlot, removeSlot, appendRemainder, totalStatus } from './balance.js';

/** @param {number[]} pcts */
function expectValid(pcts) {
	expect(pcts.every((p) => Number.isInteger(p) && p >= 1)).toBe(true);
	expect(pcts.reduce((a, b) => a + b, 0)).toBe(100);
}

describe('even split before any slider is moved', () => {
	it('gives a new breed an even share taken from the others', () => {
		expect(addSlot([100])).toEqual([50, 50]);
		const three = addSlot([50, 50]);
		expectValid(three);
		expect(three[2]).toBe(33);
	});
	it('hands a removed breed’s share back to the rest', () => {
		const two = removeSlot([50, 30, 20], 2);
		expect(two).toHaveLength(2);
		expectValid(two);
		expect(removeSlot([100], 0)).toEqual([]);
	});
});

describe('appendRemainder (after the visitor has adjusted sliders)', () => {
	it('gives a new breed whatever is left, leaving the others alone', () => {
		expect(appendRemainder([60, 25])).toEqual([60, 25, 15]);
	});
	it('starts a new breed at 1 when nothing is left', () => {
		expect(appendRemainder([60, 40])).toEqual([60, 40, 1]);
		expect(appendRemainder([80, 40])).toEqual([80, 40, 1]);
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
