import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { loadPage } from '$lib/server/dogVote/handlers.js';

// Live sheet data; override global prerender = true from +layout.js.
export const prerender = false;

export async function load({ params, fetch }) {
	const data = await loadPage({ env, fetch, slug: params.dog, dev });
	if ('status' in data) throw error(404, 'Not found');
	// /dog-vote/<dog>/<name> opens that person's results without re-entering.
	return { ...data, urlName: params.name ?? '' };
}
