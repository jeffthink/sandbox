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
	Family Decision Making Complexity
</h1>

<div class="section-title">Exponential Growth: Decision Scenarios</div>

<ExponentialVisualization 
	bind:familySize 
	bind:scenarioDisplay 
	bind:formulaDisplay 
	showFullText={true} 
/>