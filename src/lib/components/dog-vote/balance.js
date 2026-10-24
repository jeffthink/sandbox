/**
 * Percentage auto-balancing for the guess form. Every function returns a new
 * array of integers, each ≥ 1, summing to exactly 100.
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
 * Set one breed's percentage and rebalance the rest.
 * @param {number[]} pcts
 * @param {number} index
 * @param {number} value
 * @returns {number[]}
 */
export function setPct(pcts, index, value) {
	const n = pcts.length;
	if (n <= 1) return n === 1 ? [100] : [];
	const v = Math.min(Math.max(Math.round(value), 1), 100 - (n - 1));
	const others = distribute(
		pcts.filter((_, i) => i !== index),
		100 - v
	);
	const out = [...others];
	out.splice(index, 0, v);
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
