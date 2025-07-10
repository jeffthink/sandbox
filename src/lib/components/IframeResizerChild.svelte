<script>
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Load iframe-resizer child script with GPL license
		if (typeof window.iframeResizerChild === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@5/js/iframeResizer.child.min.js';
			script.onload = () => {
				// Set GPL license for open source usage
				if (window.iframeResizerChild) {
					window.iframeResizerChild.license = 'GPLv3';
				}
				console.log('iframe-resizer child loaded with GPL license');
			};
			document.head.appendChild(script);
		}
	});
</script>

<slot />