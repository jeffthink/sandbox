<script>
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { processSwimData } from '$lib/utils/swimData.js';
	import { meets, races, swimmers } from '$lib/data/demoSwimData.js';

	// Computed at build time during prerender — no network, no password.
	const processedData = processSwimData(meets, races);
	const swimmerEmojis = Object.fromEntries(
		swimmers.filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
	);
</script>

<svelte:head>
	<title>Swim Tracker Demo - Interactive Sandbox</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Swim Times Tracker <span class="demo-badge">Demo</span></h1>
		<p>Track meet results and visualize swimming progress over time. This demo uses fictional swimmers and synthetic data.</p>
		<a class="family-link" href="/swim-tracker/family">🔒 Family results</a>
	</div>

	<SwimDashboard {processedData} {meets} {swimmerEmojis} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
	.demo-badge {
		font-size: 0.7em;
		vertical-align: middle;
		background: #3498db;
		color: white;
		padding: 0.15em 0.6em;
		border-radius: 999px;
	}
	.family-link {
		display: inline-block;
		margin-top: 0.5rem;
		color: #3498db;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.family-link:hover { text-decoration: underline; }
	@media (max-width: 768px) {
		.header { margin-bottom: 1rem; }
		.header h1 { font-size: 1.5rem; }
	}
</style>
