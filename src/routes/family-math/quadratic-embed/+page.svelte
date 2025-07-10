<script>
	import QuadraticVisualization from '$lib/components/visualizations/QuadraticVisualization.svelte';
	import IframeResizerChild from '$lib/components/IframeResizerChild.svelte';
	
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
		max-width: 100%;
	}
</style>

<IframeResizerChild>
	<QuadraticVisualization bind:familySize bind:relationshipDisplay />
</IframeResizerChild>