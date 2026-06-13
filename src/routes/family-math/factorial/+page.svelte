<script>
	import FactorialVisualization from '$lib/components/visualizations/FactorialVisualization.svelte';
	
	let familySize = 4;
	let arrangementDisplay = "24 arrangements";
	let formulaDisplay = "4! = 24";
</script>

<svelte:head>
	<title>Factorial Growth: Line Ordering</title>
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
	Family Line Ordering Complexity
</h1>

<div class="section-title">Factorial Growth: Line Arrangements</div>

<FactorialVisualization 
	bind:familySize 
	bind:arrangementDisplay 
	bind:formulaDisplay 
	showFullText={true} 
/>