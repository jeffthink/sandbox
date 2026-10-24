/**
 * Shorten a chart label with an ellipsis so it fits `maxWidth` pixels.
 * Long free-text breed names would otherwise run past the card on phones.
 * @param {string} text
 * @param {number} maxWidth
 * @param {(s: string) => number} measure - rendered width of a string in px
 * @returns {string}
 */
export function fitLabel(text, maxWidth, measure) {
	if (measure(text) <= maxWidth) return text;
	let lo = 0;
	let hi = text.length;
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		if (measure(text.slice(0, mid).trimEnd() + '…') <= maxWidth) lo = mid;
		else hi = mid - 1;
	}
	return text.slice(0, lo).trimEnd() + '…';
}
