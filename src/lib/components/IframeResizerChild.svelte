<script>
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Load iframe-resizer child script
		if (typeof window.iframeResizerChild === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@5/js/iframeResizer.child.min.js';
			script.onload = () => {
				// iframe-resizer automatically initializes when the script loads
				console.log('iframe-resizer child loaded');
			};
			document.head.appendChild(script);
		}
	});
</script>

<slot />