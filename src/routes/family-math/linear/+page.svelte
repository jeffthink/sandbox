<script>
	import LinearVisualization from '$lib/components/visualizations/LinearVisualization.svelte';
	
	let familySize = 4;
	let costDisplay = "$1000 😊";
</script>

<svelte:head>
	<title>Linear Growth: Family Complexity Calculator</title>
</svelte:head>

<style>
	.section-title {
		font-size: 20px;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 15px;
		text-align: center;
	}

	@media (max-width: 768px) {
		.section-title {
			font-size: 18px;
		}
	}
</style>

<h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
	Family Complexity Interactive Calculator
</h1>

<div class="section-title">Linear Growth: Airline Costs</div>

<LinearVisualization bind:familySize bind:costDisplay />