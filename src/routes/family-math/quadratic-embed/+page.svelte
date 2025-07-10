<script>
	import QuadraticVisualization from '$lib/components/visualizations/QuadraticVisualization.svelte';
	
	let familySize = 4;
	let relationshipDisplay = "6 relationships";
</script>

<svelte:head>
	<title>Quadratic Growth: Family Relationships</title>
</svelte:head>

<style>
	:global(body) {
		margin: 0;
		padding: 10px;
		background: white;
		min-height: 100vh;
		max-width: 100%;
	}
	
	:global(.widget-container) {
		padding: 20px;
		box-shadow: none;
		border-radius: 0;
		background: transparent;
	}
	
	:global(.family-size) {
		font-size: 18px;
	}
	
	:global(.slider-label) {
		font-size: 14px;
	}
	
	:global(#familySlider) {
		width: 200px;
		height: 6px;
	}
</style>

<QuadraticVisualization bind:familySize bind:relationshipDisplay />