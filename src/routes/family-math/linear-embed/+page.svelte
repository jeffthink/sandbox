<script>
	import LinearVisualization from '$lib/components/visualizations/LinearVisualization.svelte';
	
	let familySize = 4;
	let costDisplay = "$1000 😊";
</script>

<svelte:head>
	<title>Linear Growth: Family Complexity Calculator</title>
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

<LinearVisualization bind:familySize bind:costDisplay />