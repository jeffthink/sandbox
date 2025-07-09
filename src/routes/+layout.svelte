<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Embed mode is passed as data from the layout load function
	export let data;
	let isEmbedMode = data.isEmbedMode;
	
	onMount(() => {
		// Apply embed mode class to body
		if (isEmbedMode) {
			document.body.classList.add('embed-mode');
		}
	});
</script>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		background: #f8fafc;
	}
	
	/* Embed mode styles */
	:global(body.embed-mode) {
		margin: 0;
		padding: 10px;
		background: white;
		min-height: 100vh;
		max-width: 100%;
	}
	
	:global(body.embed-mode .widget-container) {
		padding: 20px;
		box-shadow: none;
		border-radius: 0;
	}
	
	:global(body.embed-mode .family-size) {
		font-size: 18px;
	}
	
	:global(body.embed-mode .slider-label) {
		font-size: 14px;
	}
	
	:global(body.embed-mode #familySlider) {
		width: 200px;
		height: 6px;
	}
	
	:global(body.embed-mode .nav-header) {
		display: none;
	}
	
	:global(body.embed-mode h1) {
		font-size: 20px !important;
		margin-bottom: 20px !important;
	}
	
	:global(body.embed-mode .section-title) {
		font-size: 16px;
	}
	
	@media (max-width: 768px) {
		:global(body) {
			padding: 10px;
			max-width: 100%;
		}
	}
	
	.widget-container {
		background: white;
		padding: 30px;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		margin-bottom: 20px;
		text-align: center;
	}
	
	.nav-header {
		background: #f8fafc;
		padding: 1rem 0;
		margin-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.nav-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 20px;
	}
	
	.nav-link {
		color: #6b7280;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: color 0.2s ease;
	}
	
	.nav-link:hover {
		color: #3b82f6;
	}
	
	.nav-link::before {
		content: "← ";
		margin-right: 4px;
	}
</style>

{#if !isEmbedMode && $page.url.pathname !== '/'}
	<div class="nav-header">
		<div class="nav-content">
			<a href="/" class="nav-link">Back to All Experiments</a>
		</div>
	</div>
{/if}

<div class="widget-container">
	<slot {isEmbedMode} />
</div>