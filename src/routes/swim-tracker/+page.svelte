<script>
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { meets, races, swimmers } from '$lib/data/demoSwimData.js';

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
	</div>
	<a class="family-link" href="/swim-tracker/family" title="Family results" aria-label="Family results">🔒</a>

	<SwimDashboard {meets} {races} {swimmerEmojis} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; position: relative; }
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
		position: absolute;
		top: 0;
		right: 0;
		font-size: 1.2rem;
		line-height: 1;
		text-decoration: none;
		opacity: 0.35;
		transition: opacity 0.2s ease;
	}
	.family-link:hover,
	.family-link:focus-visible { opacity: 1; }
	@media (max-width: 768px) {
		.header { margin-bottom: 1rem; }
		.header h1 { font-size: 1.5rem; }
	}
</style>
