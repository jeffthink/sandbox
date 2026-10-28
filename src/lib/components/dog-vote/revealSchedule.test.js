import { describe, it, expect } from 'vitest';
import { revealSchedule, TIMING } from './revealSchedule.js';

const leads = (n) => revealSchedule(n).steps.map((s) => s.lead);

describe('revealSchedule', () => {
	it('announces the podium, rushes the middle, and saves a moment for the last', () => {
		expect(leads(6)).toEqual([
			'In first place…',
			'In second place…',
			'In third place…',
			'Also in the mix…',
			'Also in the mix…',
			'And last but not least…'
		]);
	});

	it('uses "last but not least" for the final row even with a short list', () => {
		expect(leads(1)).toEqual(['In first place…']);
		expect(leads(2)).toEqual(['In first place…', 'And last but not least…']);
		expect(leads(3)).toEqual(['In first place…', 'In second place…', 'And last but not least…']);
	});

	it('reveals rows strictly in order, top first', () => {
		const { steps } = revealSchedule(7);
		for (let i = 1; i < steps.length; i++) expect(steps[i].barAt).toBeGreaterThan(steps[i - 1].barAt);
	});

	it('pauses for a drumroll before announced rows but not the quick middle ones', () => {
		const { steps } = revealSchedule(6);
		expect(steps[0].barAt - steps[0].captionAt).toBe(TIMING.PAUSE);
		expect(steps[3].barAt).toBe(steps[3].captionAt);
		expect(steps[3].grow).toBeLessThan(steps[0].grow);
		expect(steps[3].announce).toBe(false);
		expect(steps[5].announce).toBe(true);
	});

	it('lets every bar finish before the next announcement and before the end', () => {
		const { steps, end } = revealSchedule(6);
		expect(steps[5].captionAt).toBeGreaterThanOrEqual(steps[4].barAt + steps[4].grow);
		expect(end).toBeGreaterThanOrEqual(steps[5].barAt + steps[5].grow);
	});

	it('shows everything at once with reduced motion', () => {
		const { steps, end } = revealSchedule(4, { reduce: true });
		expect(steps.every((s) => s.barAt === 0 && s.grow === 0 && s.lead === null)).toBe(true);
		expect(end).toBe(0);
	});

	it('handles an empty result', () => {
		expect(revealSchedule(0)).toEqual({ steps: [], end: 0 });
	});
});
