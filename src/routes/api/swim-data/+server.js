import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { verifyPassword, loadSwimData } from '$lib/server/swimGate.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function POST({ request, fetch }) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	if (!verifyPassword(body?.password, env.SWIM_PASSWORD ?? '')) {
		throw error(401, 'Incorrect password');
	}

	try {
		const data = await loadSwimData({
			meetsUrl: env.MEETS_CSV_URL,
			racesUrl: env.RACES_CSV_URL,
			swimmersUrl: env.SWIMMERS_CSV_URL,
			fetch
		});
		return json(data);
	} catch {
		// Do not leak internal URLs or fetch details to the client.
		throw error(500, 'Could not load swim data');
	}
}
