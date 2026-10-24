import { getDogConfig, SetupError } from './config.js';
import { loadDog, appendVote } from './store.js';
import { validateVote, crowdView } from './rules.js';
import { buildReveal } from './scoring.js';

/**
 * Framework-free request handlers. The SvelteKit route files are thin
 * wrappers so this logic can be unit-tested without a server.
 */

const GENERIC_SETUP = "This game isn't set up yet.";

/** @typedef {{ env: Record<string, string|undefined>, fetch: typeof fetch, slug: string }} Ctx */

/**
 * Data for the /dog-vote/[dog] page. Individual votes are never included
 * before the reveal; the crowd view is fetched separately after voting.
 * @param {Ctx & { dev: boolean }} ctx
 */
export async function loadPage({ env, fetch, slug, dev }) {
	if (!getDogConfig(env, slug)) return { status: 404 };
	let dog;
	try {
		dog = await loadDog({ env, fetch, slug });
	} catch (err) {
		console.error('[dog-vote] load failed:', err);
		return { setupError: dev && err instanceof Error ? err.message : GENERIC_SETUP };
	}
	const { settings, breeds, votes, results } = dog;
	return {
		slug,
		settings,
		breeds,
		count: votes.length,
		revealed: results.revealed,
		reveal: results.revealed
			? { ...buildReveal(votes, results, breeds), results: results.rows }
			: null
	};
}

/**
 * @param {Ctx & { body: unknown }} ctx
 * @returns {Promise<{ status: number, body: Record<string, unknown> }>}
 */
export async function handleVote({ env, fetch, slug, body }) {
	if (!getDogConfig(env, slug)) return { status: 404, body: { error: 'Not found' } };
	try {
		const { breeds } = await loadDog({ env, fetch, slug });
		const result = validateVote(body, breeds);
		if (!result.ok) return { status: 400, body: { errors: result.errors } };

		const outcome = await appendVote({ env, fetch, slug, vote: result.vote });
		if (outcome === 'closed') return { status: 409, body: { error: 'Voting is closed' } };

		const { votes } = await loadDog({ env, fetch, slug });
		return { status: 200, body: { ok: true, vote: result.vote, crowd: crowdView(votes, result.vote.name) } };
	} catch (err) {
		console.error('[dog-vote] vote failed:', err);
		const error =
			err instanceof SetupError ? GENERIC_SETUP : 'Something went wrong saving your guess. Try again?';
		return { status: 500, body: { error } };
	}
}

/**
 * @param {Ctx & { name: string | null }} ctx
 * @returns {Promise<{ status: number, body: Record<string, unknown> }>}
 */
export async function handleCrowd({ env, fetch, slug, name }) {
	if (!getDogConfig(env, slug)) return { status: 404, body: { error: 'Not found' } };
	try {
		const { votes } = await loadDog({ env, fetch, slug });
		return { status: 200, body: crowdView(votes, name) };
	} catch (err) {
		console.error('[dog-vote] crowd failed:', err);
		return { status: 500, body: { error: 'Could not load the crowd right now.' } };
	}
}
