import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { handleVote } from '$lib/server/dogVote/handlers.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function POST({ params, request, fetch }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}
	const res = await handleVote({ env, fetch, slug: params.dog, body });
	return json(res.body, { status: res.status });
}
