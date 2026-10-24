/**
 * Percentage helpers for the guess form. Values move in steps of 5. Until
 * the visitor moves a slider, breeds split evenly (evenSplit). After that,
 * sliders are independent: nothing moves on its own, and the visitor brings
 * the total to 100 themselves (totalStatus drives the hint and the submit
 * button). The server still accepts any whole number, so older guesses with
 * odd values stay valid; they snap to 5s the first time they're edited.
 */

export const STEP = 5;

/**
 * Split 100 evenly into multiples of 5; leftover steps go to the first
 * breeds (3 breeds → 35, 35, 30).
 * @param {number} n
 * @returns {number[]}
 */
export function evenSplit(n) {
	if (n <= 0) return [];
	const steps = 100 / STEP;
	const base = Math.floor(steps / n);
	const extra = steps - base * n;
	return Array.from({ length: n }, (_, i) => (base + (i < extra ? 1 : 0)) * STEP);
}

/**
 * Add a breed after the visitor has adjusted sliders: it gets whatever is
 * left (at least one step) and the others are left alone.
 * @param {number[]} pcts
 * @returns {number[]}
 */
export function appendRemainder(pcts) {
	const left = 100 - pcts.reduce((sum, p) => sum + p, 0);
	return [...pcts, Math.max(STEP, left)];
}

/**
 * Nearest multiple of 5, clamped to [5, max].
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
export function snap(value, max) {
	return Math.min(Math.max(Math.round(value / STEP) * STEP, STEP), max);
}

/**
 * Next multiple of 5 above `value` (33 → 35, 35 → 40), capped at `max`.
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
export function stepUp(value, max) {
	return Math.min(Math.floor(value / STEP) * STEP + STEP, max);
}

/**
 * Next multiple of 5 below `value` (33 → 30, 30 → 25), never below 5.
 * @param {number} value
 * @returns {number}
 */
export function stepDown(value) {
	return Math.max(Math.ceil(value / STEP) * STEP - STEP, STEP);
}

/**
 * @param {number[]} pcts
 * @returns {{ total: number, ok: boolean, label: string }}
 */
export function totalStatus(pcts) {
	const total = pcts.reduce((sum, p) => sum + p, 0);
	if (total === 100) return { total, ok: true, label: '100% ✓' };
	const label = total < 100 ? `${total}% · ${100 - total}% left` : `${total}% · ${total - 100}% over`;
	return { total, ok: false, label };
}
