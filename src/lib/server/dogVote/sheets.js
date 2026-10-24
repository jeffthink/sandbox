/**
 * Thin wrappers over the Google Sheets REST API v4.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values
 */

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

export class SheetsError extends Error {
	/**
	 * @param {number} status
	 * @param {string} message
	 */
	constructor(status, message) {
		super(message);
		this.name = 'SheetsError';
		this.status = status;
	}
}

/** @param {Response} res */
async function ensureOk(res) {
	if (res.ok) return res.json();
	const body = await res.json().catch(() => ({}));
	throw new SheetsError(res.status, body?.error?.message || `Sheets API error ${res.status}`);
}

/**
 * Read several ranges in one request.
 * @param {{ token: string, sheetId: string, ranges: string[], fetch: typeof fetch }} opts
 * @returns {Promise<string[][][]>}
 */
export async function batchGet({ token, sheetId, ranges, fetch }) {
	const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
	const res = await fetch(`${API}/${sheetId}/values:batchGet?${query}`, {
		headers: { authorization: `Bearer ${token}` }
	});
	const body = await ensureOk(res);
	return ranges.map((_, i) => body.valueRanges?.[i]?.values ?? []);
}

/**
 * Read a single range.
 * @param {{ token: string, sheetId: string, range: string, fetch: typeof fetch }} opts
 * @returns {Promise<string[][]>}
 */
export async function getRange({ token, sheetId, range, fetch }) {
	const res = await fetch(`${API}/${sheetId}/values/${encodeURIComponent(range)}`, {
		headers: { authorization: `Bearer ${token}` }
	});
	const body = await ensureOk(res);
	return body.values ?? [];
}

/**
 * Append one row. RAW input keeps user text (e.g. "=SUM(...)") literal
 * instead of letting Sheets evaluate it as a formula.
 * @param {{ token: string, sheetId: string, range: string, row: string[], fetch: typeof fetch }} opts
 * @returns {Promise<void>}
 */
export async function appendRow({ token, sheetId, range, row, fetch }) {
	const res = await fetch(
		`${API}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
		{
			method: 'POST',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify({ values: [row] })
		}
	);
	await ensureOk(res);
}
