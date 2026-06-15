import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Depends on runtime env; override global prerender = true.
export const prerender = false;

export function load() {
	// Owner's own family is just another slug. Redirect old bookmarks to it,
	// falling back to the public demo if OWNER_SLUG isn't configured.
	const owner = env.OWNER_SLUG;
	throw redirect(308, owner ? `/swim-tracker/${owner}` : '/swim-tracker');
}
