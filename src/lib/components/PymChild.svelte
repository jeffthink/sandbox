<script>
	import { onMount } from 'svelte';
	
	let pymChild;
	
	onMount(() => {
		// Load Pym.js if not already loaded
		if (typeof window.pym === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://pym.npruninteractive.org/pym.v1.min.js';
			script.onload = () => {
				initializePym();
			};
			document.head.appendChild(script);
		} else {
			initializePym();
		}
		
		// Clean up on unmount
		return () => {
			if (pymChild) {
				// Pym doesn't have a destroy method, but we can remove event listeners
				window.removeEventListener('resize', sendHeight);
			}
		};
	});
	
	function initializePym() {
		pymChild = new window.pym.Child();
		pymChild.sendHeight();
		
		// Send height on window resize
		window.addEventListener('resize', sendHeight);
		
		// Send height after content changes
		setTimeout(() => pymChild.sendHeight(), 100);
		setTimeout(() => pymChild.sendHeight(), 500);
		setTimeout(() => pymChild.sendHeight(), 1000);
	}
	
	function sendHeight() {
		if (pymChild) {
			pymChild.sendHeight();
		}
	}
	
	// Export function so parent can trigger height updates
	export function updateHeight() {
		sendHeight();
	}
</script>

<slot {updateHeight} />