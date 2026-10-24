/**
 * Name/group normalization shared by server rules and client components.
 * Kept outside $lib/server so components can import it.
 */

/**
 * Trim, lowercase and collapse internal whitespace. Used to compare voter
 * names and breed names case-insensitively.
 * @param {string} s
 * @returns {string}
 */
export function normalizeName(s) {
	return String(s ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');
}

/**
 * Normalize a breed-group label so "Terrier group", "terrier GROUP" and
 * "Terrier" all compare equal.
 * @param {string} s
 * @returns {string}
 */
export function normalizeGroup(s) {
	return normalizeName(s).replace(/ group$/, '');
}
