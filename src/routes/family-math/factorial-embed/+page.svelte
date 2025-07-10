<script>
	import FactorialVisualization from '$lib/components/visualizations/FactorialVisualization.svelte';
	import IframeResizerChild from '$lib/components/IframeResizerChild.svelte';
	
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
		max-width: 100%;
	}
</style>

<IframeResizerChild>
	<FactorialVisualization 
		bind:familySize 
		bind:arrangementDisplay 
		bind:formulaDisplay 
		showFullText={false} 
	/>
</IframeResizerChild>