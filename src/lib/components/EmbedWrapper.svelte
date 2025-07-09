<script>
	import { onMount } from 'svelte';
	
	export let isEmbedMode = false;
	
	let pymChild;
	
	onMount(() => {
		if (isEmbedMode) {
			loadPymJS();
			window.addEventListener('resize', handleResize);
		}
		
		return () => {
			if (isEmbedMode) {
				window.removeEventListener('resize', handleResize);
			}
		};
	});
	
	function loadPymJS() {
		if (typeof window.pym === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://pym.npr.org/pym.v1.min.js';
			script.onload = function() {
				pymChild = new window.pym.Child();
				notifyHeightChange();
			};
			document.head.appendChild(script);
		} else {
			pymChild = new window.pym.Child();
			notifyHeightChange();
		}
	}
	
	function handleResize() {
		if (isEmbedMode) {
			notifyHeightChange();
		}
	}
	
	function notifyHeightChange() {
		if (pymChild) {
			pymChild.sendHeight();
		}
	}
	
	// Export function so parent components can trigger height updates
	export function updateHeight() {
		if (isEmbedMode) {
			notifyHeightChange();
		}
	}
</script>

<slot {updateHeight} />