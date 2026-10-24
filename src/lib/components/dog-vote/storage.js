/**
 * Per-visitor memory of their own guess. Storage can be unavailable (private
 * mode, blocked site data), so every access is guarded and failure is silent.
 */

/** @typedef {{ name: string, guesses: Array<{ breed: string, pct: number }>, comment: string, submittedAt: string }} MyGuess */

/** @param {string} slug */
const key = (slug) => `dogvote:${slug}`;

/**
 * @param {string} slug
 * @returns {MyGuess | null}
 */
export function loadMine(slug) {
	try {
		const raw = localStorage.getItem(key(slug));
		const value = raw ? JSON.parse(raw) : null;
		return value && typeof value.name === 'string' && Array.isArray(value.guesses) ? value : null;
	} catch {
		return null;
	}
}

/**
 * @param {string} slug
 * @param {MyGuess} value
 */
export function saveMine(slug, value) {
	try {
		localStorage.setItem(key(slug), JSON.stringify(value));
	} catch {
		// Storage unavailable; the visitor just won't be remembered.
	}
}

/** @param {string} slug */
export function clearMine(slug) {
	try {
		localStorage.removeItem(key(slug));
	} catch {
		// Nothing to clear.
	}
}
