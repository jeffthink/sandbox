<script>
	import QuadraticVisualization from '$lib/components/visualizations/QuadraticVisualization.svelte';
	import PymChild from '$lib/components/PymChild.svelte';
	
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
</style>

<PymChild>
	<QuadraticVisualization bind:familySize bind:relationshipDisplay />
</PymChild>