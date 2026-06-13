<script>
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Use stable iframe-resizer v4 (no licensing issues)
		if (typeof window.iframeResizerChild === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@4/js/iframeResizer.contentWindow.min.js';
			script.onload = () => {};
			script.onerror = () => {
				console.error('Failed to load iframe-resizer child script');
			};
			document.head.appendChild(script);
		}
	});
</script>

<slot />