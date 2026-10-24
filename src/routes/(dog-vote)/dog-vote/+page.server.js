import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDefaultSlug } from '$lib/server/dogVote/config.js';

// Reads runtime env; override global prerender = true from +layout.js.
export const prerender = false;

export function load() {
	const slug = getDefaultSlug(env);
	if (!slug) throw error(404, 'Not found');
	throw redirect(307, `/dog-vote/${slug}`);
}
