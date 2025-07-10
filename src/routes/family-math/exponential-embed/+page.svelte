<script>
	import ExponentialVisualization from '$lib/components/visualizations/ExponentialVisualization.svelte';
	import PymChild from '$lib/components/PymChild.svelte';
	
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
</style>

<PymChild>
	<ExponentialVisualization 
		bind:familySize 
		bind:scenarioDisplay 
		bind:formulaDisplay 
		showFullText={false} 
	/>
</PymChild>