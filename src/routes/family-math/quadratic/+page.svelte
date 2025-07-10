<script>
	import QuadraticVisualization from '$lib/components/visualizations/QuadraticVisualization.svelte';
	
	let familySize = 4;
	let relationshipDisplay = "6 relationships";
</script>

<svelte:head>
	<title>Quadratic Growth: Family Relationships</title>
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
	Family Relationships Interactive Calculator
</h1>

<div class="section-title">Quadratic Growth: Family Relationships</div>

<QuadraticVisualization bind:familySize bind:relationshipDisplay />