import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time password comparison. Both inputs are hashed to a fixed-length
 * digest first so timingSafeEqual never sees mismatched lengths (which would
 * throw and could leak length information).
 * @param {unknown} submitted - password provided by the client
 * @param {unknown} expected - the configured SWIM_PASSWORD
 * @returns {boolean}
 */
export function verifyPassword(submitted, expected) {
	if (typeof submitted !== 'string' || typeof expected !== 'string' || expected.length === 0) {
		return false;
	}
	const a = createHash('sha256').update(submitted).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}
