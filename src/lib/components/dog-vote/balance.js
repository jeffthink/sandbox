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
 * Move `amount` percentage points out of (positive) or into (negative) the
 * `others` slots, protecting values the visitor has set. Untouched slots
 * absorb first, proportionally; then set slots one at a time, most recently
 * set first, so the oldest choices are the last to move.
 * @param {number[]} pcts
 * @param {number[]} others - indices allowed to change
 * @param {number[]} order - indices the visitor has set, oldest first
 * @param {number} amount
 * @returns {number[]}
 */
function absorb(pcts, others, order, amount) {
	const out = [...pcts];
	const untouched = others.filter((i) => !order.includes(i));
	const touched = others
		.filter((i) => order.includes(i))
		.sort((a, b) => order.indexOf(b) - order.indexOf(a));
	const groups = [...(untouched.length > 0 ? [untouched] : []), ...touched.map((i) => [i])];

	let remaining = amount;
	for (const group of groups) {
		if (remaining === 0) break;
		const sum = group.reduce((acc, i) => acc + out[i], 0);
		const target = remaining > 0 ? Math.max(group.length, sum - remaining) : sum - remaining;
		const values = distribute(
			group.map((i) => out[i]),
			target
		);
		group.forEach((i, k) => (out[i] = values[k]));
		remaining -= sum - target;
	}
	return out;
}

/**
 * Set one breed's percentage and rebalance the rest.
 * @param {number[]} pcts
 * @param {number} index
 * @param {number} value
 * @param {number[]} [order] - indices the visitor has set, oldest first
 * @returns {number[]}
 */
export function setPct(pcts, index, value, order = []) {
	const n = pcts.length;
	if (n <= 1) return n === 1 ? [100] : [];
	const v = Math.min(Math.max(Math.round(value), 1), 100 - (n - 1));
	const others = pcts.map((_, i) => i).filter((i) => i !== index);
	const out = absorb(pcts, others, order, v - pcts[index]);
	out[index] = v;
	return out;
}

/**
 * Add a breed with an even share, taken from untouched breeds first.
 * @param {number[]} pcts
 * @param {number[]} [order] - indices the visitor has set, oldest first
 * @returns {number[]}
 */
export function addSlot(pcts, order = []) {
	if (pcts.length === 0) return [100];
	const share = Math.round(100 / (pcts.length + 1));
	return [...absorb(pcts, pcts.map((_, i) => i), order, share), share];
}

/**
 * Remove a breed and hand its share back, to untouched breeds first.
 * @param {number[]} pcts
 * @param {number} index
 * @param {number[]} [order] - indices the visitor has set, oldest first
 * @returns {number[]}
 */
export function removeSlot(pcts, index, order = []) {
	if (pcts.length <= 1) return [];
	const others = pcts.map((_, i) => i).filter((i) => i !== index);
	return absorb(pcts, others, order, -pcts[index]).filter((_, i) => i !== index);
}
