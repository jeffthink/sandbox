<script>
	import { page } from '$app/stores';
	import FamilyGate from '$lib/components/swim-tracker/FamilyGate.svelte';

	$: family = $page.params.family;
</script>

<svelte:head>
	<title>Family Swim Results</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Family Swim Results</h1>
		<p>Private results. Enter the family password to view.</p>
	</div>

	<FamilyGate initialFamily={family} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; position: relative; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
</style>
