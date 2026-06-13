import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ runtime: 'nodejs22.x' }),
		prerender: {
			handleMissingId: 'warn'
		}
	}
};

export default config;