<script>
	import FactorialVisualization from '$lib/components/visualizations/FactorialVisualization.svelte';
	import PymChild from '$lib/components/PymChild.svelte';
	
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
</style>

<PymChild>
	<FactorialVisualization 
		bind:familySize 
		bind:arrangementDisplay 
		bind:formulaDisplay 
		showFullText={false} 
	/>
</PymChild>