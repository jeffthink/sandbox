import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { authenticateFamily, loadFamilyData } from '$lib/server/families.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function POST({ request, fetch }) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	// One uniform 401 for bad slug format, unknown family, or wrong password.
	const auth = authenticateFamily(env, { family: body?.family, password: body?.password });
	if (!auth.ok) {
		throw error(401, 'Incorrect password');
	}

	try {
		const data = await loadFamilyData(auth.config, fetch);
		return json(data);
	} catch {
		// Do not leak internal URLs or fetch details to the client.
		throw error(500, 'Could not load swim data');
	}
}
