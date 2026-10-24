/**
 * Percentage helpers for the guess form. Until the visitor moves a slider,
 * breeds are split evenly (addSlot/removeSlot keep the sum at 100). After
 * that, sliders are independent: nothing moves on its own, and the visitor
 * brings the total to 100 themselves (totalStatus drives the hint and the
 * submit button).
 */

/**
 * Split `total` across slots in proportion to their current values. Each slot
 * keeps a floor of 1; rounding leftovers go to the largest (first on ties).
 * @param {number[]} current
 * @param {number} total
 * @returns {number[]}
 */
function distribute(current, total) {
	const n = current.length;
	if (n === 0) return [];
	const spare = total - n;
	const weights = current.map((p) => Math.max(p - 1, 0));
	const weightSum = weights.reduce((a, b) => a + b, 0);
	const shares = weights.map((w) => (weightSum > 0 ? (spare * w) / weightSum : spare / n));
	const out = shares.map((s) => 1 + Math.floor(s));
	let leftover = total - out.reduce((a, b) => a + b, 0);
	const order = current.map((p, i) => i).sort((a, b) => current[b] - current[a] || a - b);
	for (let k = 0; leftover > 0; k = (k + 1) % n, leftover--) out[order[k]] += 1;
	return out;
}

/**
 * Add a breed with an even share, taken proportionally from the others.
 * @param {number[]} pcts
 * @returns {number[]}
 */
export function addSlot(pcts) {
	if (pcts.length === 0) return [100];
	const share = Math.round(100 / (pcts.length + 1));
	return [...distribute(pcts, 100 - share), share];
}

/**
 * Remove a breed and hand its share back proportionally.
 * @param {number[]} pcts
 * @param {number} index
 * @returns {number[]}
 */
export function removeSlot(pcts, index) {
	return distribute(
		pcts.filter((_, i) => i !== index),
		100
	);
}

/**
 * Add a breed after the visitor has adjusted sliders: it gets whatever is
 * left (at least 1) and the others are left alone.
 * @param {number[]} pcts
 * @returns {number[]}
 */
export function appendRemainder(pcts) {
	const left = 100 - pcts.reduce((sum, p) => sum + p, 0);
	return [...pcts, Math.max(1, left)];
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
