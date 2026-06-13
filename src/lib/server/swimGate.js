import { createHash, timingSafeEqual } from 'node:crypto';
import { parseCSV } from '../utils/googleSheetsCSV.js';

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

/**
 * @param {string} url
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Array<Record<string, string>>>}
 */
async function fetchCsvRows(url, fetchImpl) {
	const res = await fetchImpl(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch CSV (${res.status})`);
	}
	return parseCSV(await res.text());
}

/**
 * Fetches and parses the three swim CSVs server-side.
 * @param {{ meetsUrl: string, racesUrl: string, swimmersUrl?: string, fetch: typeof fetch }} opts
 * @returns {Promise<{ meets: Array, races: Array, swimmers: Array }>}
 */
export async function loadSwimData({ meetsUrl, racesUrl, swimmersUrl, fetch: fetchImpl }) {
	const [meets, races, swimmers] = await Promise.all([
		fetchCsvRows(meetsUrl, fetchImpl),
		fetchCsvRows(racesUrl, fetchImpl),
		swimmersUrl ? fetchCsvRows(swimmersUrl, fetchImpl) : Promise.resolve([])
	]);
	return { meets, races, swimmers };
}
