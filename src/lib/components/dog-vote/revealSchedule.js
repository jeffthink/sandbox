/**
 * Timing for the results reveal, top breed first: the podium (1st–3rd) and
 * the last row each get an announcement and a drumroll pause; rows in between
 * arrive quickly. Times are in ms from the start.
 */
export const TIMING = {
	PAUSE: 1500, // announcement on screen before the bar starts
	GROW: 1300,
	HOLD: 1000, // after an announced bar lands
	QUICK_GAP: 1100,
	QUICK_GROW: 900
};

const PODIUM = ['In first place…', 'In second place…', 'In third place…'];
const MIDDLE = 'Also in the mix…';
const LAST = 'And last but not least…';

/**
 * @typedef {{ lead: string | null, announce: boolean, captionAt: number, barAt: number, grow: number }} Step
 * @param {number} n - number of result rows, sorted largest first
 * @param {{ reduce?: boolean }} [opts]
 * @returns {{ steps: Step[], end: number }}
 */
export function revealSchedule(n, { reduce = false } = {}) {
	if (reduce) {
		return {
			steps: Array.from({ length: n }, () => ({ lead: null, announce: false, captionAt: 0, barAt: 0, grow: 0 })),
			end: 0
		};
	}
	const { PAUSE, GROW, HOLD, QUICK_GAP, QUICK_GROW } = TIMING;
	/** @type {Step[]} */
	const steps = [];
	let t = 0;
	for (let i = 0; i < n; i++) {
		const last = i === n - 1 && n > 1;
		if (i < PODIUM.length || last) {
			// Let a run of quick rows finish growing before the next announcement.
			const prev = steps[i - 1];
			if (prev && !prev.announce) t = Math.max(t, prev.barAt + prev.grow + HOLD);
			steps.push({ lead: last ? LAST : PODIUM[i], announce: true, captionAt: t, barAt: t + PAUSE, grow: GROW });
			t += PAUSE + GROW + HOLD;
		} else {
			steps.push({ lead: MIDDLE, announce: false, captionAt: t, barAt: t, grow: QUICK_GROW });
			t += QUICK_GAP;
		}
	}
	return { steps, end: t };
}
