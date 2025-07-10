<script>
	import FactorialVisualization from '$lib/components/visualizations/FactorialVisualization.svelte';
	
	let familySize = 4;
	let arrangementDisplay = "24 arrangements";
	let formulaDisplay = "4! = 24";
</script>

<svelte:head>
	<title>Factorial Growth: Line Ordering</title>
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

<FactorialVisualization 
	bind:familySize 
	bind:arrangementDisplay 
	bind:formulaDisplay 
	showFullText={false} 
/>