import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { handleCrowd } from '$lib/server/dogVote/handlers.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function GET({ params, url, fetch }) {
	const res = await handleCrowd({ env, fetch, slug: params.dog, name: url.searchParams.get('name') });
	return json(res.body, { status: res.status, headers: { 'cache-control': 'no-store' } });
}
