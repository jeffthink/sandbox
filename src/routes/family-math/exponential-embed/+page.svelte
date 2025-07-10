<script>
	import ExponentialVisualization from '$lib/components/visualizations/ExponentialVisualization.svelte';
	
	let familySize = 4;
	let scenarioDisplay = "16 scenarios";
	let formulaDisplay = "2^4 = 16";
</script>

<svelte:head>
	<title>Exponential Growth: Family Decision Making</title>
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

<ExponentialVisualization 
	bind:familySize 
	bind:scenarioDisplay 
	bind:formulaDisplay 
	showFullText={false} 
/>