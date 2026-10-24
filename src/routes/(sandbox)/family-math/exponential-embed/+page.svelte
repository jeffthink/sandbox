<script>
	import ExponentialVisualization from '$lib/components/visualizations/ExponentialVisualization.svelte';
	import IframeResizerChild from '$lib/components/IframeResizerChild.svelte';
	
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
		max-width: 100%;
	}
</style>

<IframeResizerChild>
	<ExponentialVisualization 
		bind:familySize 
		bind:scenarioDisplay 
		bind:formulaDisplay 
		showFullText={false} 
	/>
</IframeResizerChild>