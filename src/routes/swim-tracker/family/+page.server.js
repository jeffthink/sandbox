import { env } from '$env/dynamic/private';

// Reads runtime env to pre-fill the gate; override global prerender = true.
export const prerender = false;

export function load() {
	// OWNER_SLUG, when set, pre-fills the generic gate's family field.
	return { ownerSlug: env.OWNER_SLUG ?? '' };
}
