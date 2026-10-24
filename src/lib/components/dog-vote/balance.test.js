import { describe, it, expect } from 'vitest';
import { setPct, addSlot, removeSlot } from './balance.js';

/** @param {number[]} pcts */
function expectValid(pcts) {
	expect(pcts.every((p) => Number.isInteger(p) && p >= 1)).toBe(true);
	expect(pcts.reduce((a, b) => a + b, 0)).toBe(100);
}

describe('setPct', () => {
	it('moves the difference onto the others in proportion', () => {
		expect(setPct([50, 50], 0, 70)).toEqual([70, 30]);
		expect(setPct([40, 30, 30], 0, 70)).toEqual([70, 15, 15]);
	});
	it('keeps every slot at least 1', () => {
		expect(setPct([98, 1, 1], 1, 1)).toEqual([98, 1, 1]);
		expect(setPct([34, 33, 33], 2, 100)).toEqual([1, 1, 98]);
	});
	it('pins a single breed at 100', () => {
		expect(setPct([100], 0, 40)).toEqual([100]);
	});
	it('rounds a fractional value', () => {
		expectValid(setPct([50, 50], 0, 62.6));
		expect(setPct([50, 50], 0, 62.6)[0]).toBe(63);
	});
});

describe('addSlot / removeSlot', () => {
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

describe('invariants under random use', () => {
	it('always sums to 100 with integers ≥ 1', () => {
		let seed = 42;
		const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
		let pcts = [100];
		for (let i = 0; i < 500; i++) {
			const r = rand();
			if (r < 0.2 && pcts.length < 5) pcts = addSlot(pcts);
			else if (r < 0.35 && pcts.length > 1) pcts = removeSlot(pcts, Math.floor(rand() * pcts.length));
			else pcts = setPct(pcts, Math.floor(rand() * pcts.length), Math.floor(rand() * 120) - 10);
			expectValid(pcts);
		}
	});
});
