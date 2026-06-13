import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// runtime is pinned because adapter auto-detect fails on newer local Node
		// versions; update this when bumping Node or when Vercel deprecates it.
		adapter: adapter({ runtime: 'nodejs22.x' }),
		prerender: {
			handleMissingId: 'warn'
		}
	}
};

export default config;