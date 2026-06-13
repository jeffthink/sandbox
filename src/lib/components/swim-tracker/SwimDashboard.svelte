<script>
	import SummerSummary from '$lib/components/swim-tracker/SummerSummary.svelte';
	import RacesTable from '$lib/components/swim-tracker/RacesTable.svelte';
	import TimeProgressChart from '$lib/components/swim-tracker/TimeProgressChart.svelte';
	import MeetPerformanceChart from '$lib/components/swim-tracker/MeetPerformanceChart.svelte';

	export let processedData;
	export let meets = [];
	export let swimmerEmojis = {};

	let activeView = 'summary'; // 'summary' | 'table' | 'progress' | 'meets'
</script>

<div class="nav-tabs">
	<button class="nav-tab" class:active={activeView === 'summary'} on:click={() => (activeView = 'summary')}>🏆 Summer Highlights</button>
	<button class="nav-tab" class:active={activeView === 'table'} on:click={() => (activeView = 'table')}>📊 Race Results</button>
	<button class="nav-tab" class:active={activeView === 'progress'} on:click={() => (activeView = 'progress')}>📈 Time Progress</button>
	<button class="nav-tab" class:active={activeView === 'meets'} on:click={() => (activeView = 'meets')}>📅 Meet Performance</button>
</div>

<div class="content">
	{#if activeView === 'summary'}
		<SummerSummary data={processedData} {swimmerEmojis} />
	{:else if activeView === 'table'}
		<RacesTable data={processedData} />
	{:else if activeView === 'progress'}
		<TimeProgressChart data={processedData} />
	{:else if activeView === 'meets'}
		<MeetPerformanceChart {meets} />
	{/if}
</div>

<style>
	.nav-tabs {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #ecf0f1;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.nav-tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		color: #7f8c8d;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: -2px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.nav-tab:hover { color: #2c3e50; }
	.nav-tab.active { color: #3498db; border-bottom-color: #3498db; }
	.content {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		min-height: 400px;
	}
	@media (max-width: 768px) {
		.content { padding: 1rem; border-radius: 4px; }
		.nav-tabs { gap: 0.5rem; margin-bottom: 1rem; }
		.nav-tab { padding: 0.5rem 1rem; font-size: 0.875rem; }
	}
	@media (max-width: 480px) {
		.nav-tab { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
	}
</style>
