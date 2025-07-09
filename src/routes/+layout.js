export const prerender = true;

export function load({ url }) {
	// Detect embed mode from URL parameters server-side
	const isEmbedMode = url.searchParams.get('mode') === 'embed' || 
	                    url.searchParams.get('embed') === 'true';
	
	return {
		isEmbedMode
	};
}