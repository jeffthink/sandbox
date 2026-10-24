import { describe, it, expect, vi } from 'vitest';
import { batchGet, appendRow, SheetsError } from './sheets.js';

/** @param {unknown} body */
function okFetch(body = {}) {
	return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

describe('batchGet', () => {
	it('requests every range and returns their values (empty when absent)', async () => {
		const fetch = okFetch({ valueRanges: [{ values: [['a']] }, {}] });
		const result = await batchGet({ token: 'tok', sheetId: 'sheet1', ranges: ['votes!A:D', 'results!A1:B200'], fetch });
		expect(result).toEqual([[['a']], []]);
		const [url, init] = fetch.mock.calls[0];
		expect(url).toContain('/v4/spreadsheets/sheet1/values:batchGet?');
		expect(url).toContain(`ranges=${encodeURIComponent('votes!A:D')}`);
		expect(url).toContain(`ranges=${encodeURIComponent('results!A1:B200')}`);
		expect(init.headers.authorization).toBe('Bearer tok');
	});

	it('rejects with the HTTP status on failure', async () => {
		const fetch = vi.fn(
			async () => new Response(JSON.stringify({ error: { message: 'denied' } }), { status: 403 })
		);
		const attempt = batchGet({ token: 't', sheetId: 's', ranges: ['votes!A:D'], fetch });
		await expect(attempt).rejects.toBeInstanceOf(SheetsError);
		await expect(batchGet({ token: 't', sheetId: 's', ranges: ['votes!A:D'], fetch })).rejects.toMatchObject({
			status: 403,
			message: 'denied'
		});
	});
});

describe('appendRow', () => {
	it('appends RAW so formula-looking text is stored literally', async () => {
		const fetch = okFetch();
		const row = ['2026-10-01T00:00:00.000Z', '=HYPERLINK("x")', '[]', '+1'];
		await appendRow({ token: 'tok', sheetId: 'sheet1', range: 'votes!A:D', row, fetch });
		const [url, init] = fetch.mock.calls[0];
		expect(url).toContain(`/v4/spreadsheets/sheet1/values/${encodeURIComponent('votes!A:D')}:append?`);
		expect(url).toContain('valueInputOption=RAW');
		expect(url).toContain('insertDataOption=INSERT_ROWS');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({ values: [row] });
	});
});
