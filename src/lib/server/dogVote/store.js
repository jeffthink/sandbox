import { getDogConfig, getServiceAccount, SetupError } from './config.js';
import { getAccessToken } from './googleAuth.js';
import { batchGet, getRange, appendRow, SheetsError } from './sheets.js';
import { parseVoteRows, latestVotesByName, normalizeName } from './rules.js';

/** @typedef {import('./rules.js').DogData} DogData */
/** @typedef {import('./rules.js').Settings} Settings */
/** @typedef {import('./rules.js').Breed} Breed */
/** @typedef {import('./rules.js').Results} Results */

const CACHE_TTL_MS = 15_000;
const RANGES = ['settings!A:B', 'votes!A:D', 'breeds!A:E', 'results!A1:B200'];
const VOTE_HEADERS = ['timestamp', 'name', 'guesses', 'comment'];
const PRONOUNS = new Set(['he', 'she', 'they']);

/** @type {Map<string, { at: number, data: DogData }>} */
const cache = new Map();

/** @param {unknown} cell */
const cellText = (cell) => String(cell ?? '').trim();

/**
 * @param {string[][]} rows - settings tab, key/value rows (header optional)
 * @param {string} slug
 * @returns {Settings}
 */
export function parseSettings(rows, slug) {
	/** @type {Record<string, string>} */
	const values = {};
	for (const [key, value] of rows) {
		const k = normalizeName(key);
		if (k && k !== 'key') values[k] = cellText(value);
	}
	if (!values.dog_name) throw new SetupError('Tab `settings` needs a `dog_name` row.');
	const pronoun = normalizeName(values.pronoun ?? '');
	return {
		dogName: values.dog_name,
		pronoun: PRONOUNS.has(pronoun) ? /** @type {Settings['pronoun']} */ (pronoun) : 'they',
		intro: values.intro ?? '',
		photos: (values.photos ?? '')
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean)
			.map((p) => (/^https?:\/\//.test(p) ? p : `/dog-vote/${slug}/${p}`))
	};
}

/**
 * @param {string[][]} rows - breeds tab including its header
 * @returns {Breed[]}
 */
export function parseBreeds(rows) {
	const header = (rows[0] ?? []).map(normalizeName);
	const breedCol = header.indexOf('breed');
	const groupCol = header.indexOf('group');
	const imageCol = header.indexOf('image_url');
	const creditCol = header.indexOf('image_credit');
	const creditUrlCol = header.indexOf('image_credit_url');
	if (breedCol < 0 || groupCol < 0) {
		throw new SetupError(
			'Tab `breeds` needs headers: breed, group, plus optional image_url, image_credit, image_credit_url.'
		);
	}
	/** @param {string[]} row @param {number} col */
	const optional = (row, col) => (col >= 0 ? cellText(row[col]) : '');
	return rows
		.slice(1)
		.map((row) => ({
			breed: cellText(row[breedCol]),
			group: cellText(row[groupCol]),
			imageUrl: optional(row, imageCol),
			// Photo attribution for licenses that require it (e.g. CC BY).
			credit: optional(row, creditCol),
			creditUrl: /^https:\/\//.test(optional(row, creditUrlCol)) ? optional(row, creditUrlCol) : ''
		}))
		.filter((b) => b.breed);
}

/**
 * The results tab has a fixed layout: A1 "revealed" / B1 TRUE|FALSE,
 * A2:B2 header "breed_or_group | pct", data from row 3.
 * @param {string[][]} rows
 * @returns {Results}
 */
export function parseResults(rows) {
	const [first = [], second = []] = rows;
	if (
		normalizeName(first[0]) !== 'revealed' ||
		normalizeName(second[0]) !== 'breed_or_group' ||
		normalizeName(second[1]) !== 'pct'
	) {
		throw new SetupError(
			'Tab `results` must have A1 = "revealed", B1 = TRUE/FALSE, and A2:B2 = "breed_or_group | pct". If those are one column to the right, delete column A.'
		);
	}
	const rowsOut = [];
	for (const row of rows.slice(2)) {
		const name = cellText(row[0]);
		const pct = Number(cellText(row[1]).replace(/%$/, ''));
		if (name && cellText(row[1]) !== '' && Number.isFinite(pct)) rowsOut.push({ name, pct });
	}
	return { revealed: normalizeName(first[1]) === 'true', rows: rowsOut };
}

/** @param {string[][]} rows */
function checkVoteHeaders(rows) {
	const header = (rows[0] ?? []).map(normalizeName);
	if (!VOTE_HEADERS.every((h, i) => header[i] === h)) {
		throw new SetupError(`Tab \`votes\` needs headers: ${VOTE_HEADERS.join(', ')}.`);
	}
}

/**
 * Resolve the sheet id and an access token for a dog.
 * @param {Record<string, string|undefined>} env
 * @param {typeof fetch} fetch
 * @param {string} slug
 */
async function connect(env, fetch, slug) {
	const config = getDogConfig(env, slug);
	if (!config) throw new SetupError(`DOGVOTE_${slug.toUpperCase()}_SHEET_ID is not set.`);
	const account = getServiceAccount(env);
	const token = await getAccessToken({ ...account, fetch });
	return { sheetId: config.sheetId, token, email: account.email };
}

/**
 * Turn Google API failures into owner-fixable SetupErrors where we can.
 * @param {unknown} err
 * @param {string} slug
 * @param {string} email
 */
function explain(err, slug, email) {
	if (!(err instanceof SheetsError)) return err;
	if (err.status === 403) {
		return new SetupError(`The sheet isn't shared with ${email}. Share it as Editor.`);
	}
	if (err.status === 404) {
		return new SetupError(`No spreadsheet found for DOGVOTE_${slug.toUpperCase()}_SHEET_ID.`);
	}
	const missingTab = /Unable to parse range: '?([^'!]+)/.exec(err.message);
	if (err.status === 400 && missingTab) return new SetupError(`Tab \`${missingTab[1]}\` not found.`);
	return err;
}

/**
 * Load everything for one dog, cached for 15 s per slug.
 * @param {{ env: Record<string, string|undefined>, fetch: typeof fetch, slug: string }} opts
 * @returns {Promise<DogData>}
 */
export async function loadDog({ env, fetch, slug }) {
	const hit = cache.get(slug);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

	const { sheetId, token, email } = await connect(env, fetch, slug);
	let tabs;
	try {
		tabs = await batchGet({ token, sheetId, ranges: RANGES, fetch });
	} catch (err) {
		throw explain(err, slug, email);
	}
	const [settingsRows, voteRows, breedRows, resultRows] = tabs;
	checkVoteHeaders(voteRows);
	const data = {
		settings: parseSettings(settingsRows, slug),
		breeds: parseBreeds(breedRows),
		votes: latestVotesByName(parseVoteRows(voteRows.slice(1))),
		results: parseResults(resultRows)
	};
	cache.set(slug, { at: Date.now(), data });
	return data;
}

/**
 * Append a validated vote unless voting has closed. The revealed switch is
 * read fresh (not from cache) so nobody sneaks in a vote after the reveal.
 * @param {{ env: Record<string, string|undefined>, fetch: typeof fetch, slug: string, vote: { name: string, guesses: import('./rules.js').Guess[], comment: string }, now?: () => Date }} opts
 * @returns {Promise<'ok' | 'closed'>}
 */
export async function appendVote({ env, fetch, slug, vote, now = () => new Date() }) {
	const { sheetId, token, email } = await connect(env, fetch, slug);
	try {
		const results = parseResults(await getRange({ token, sheetId, range: 'results!A1:B2', fetch }));
		if (results.revealed) {
			cache.delete(slug); // so the next page load shows the reveal
			return 'closed';
		}
		await appendRow({
			token,
			sheetId,
			range: 'votes!A:D',
			row: [now().toISOString(), vote.name, JSON.stringify(vote.guesses), vote.comment],
			fetch
		});
	} catch (err) {
		throw explain(err, slug, email);
	}
	cache.delete(slug);
	return 'ok';
}

/** Test helper. */
export function _resetStoreCache() {
	cache.clear();
}
