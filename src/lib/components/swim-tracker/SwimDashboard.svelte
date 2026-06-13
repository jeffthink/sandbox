<script>
	import SummerSummary from '$lib/components/swim-tracker/SummerSummary.svelte';
	import RacesTable from '$lib/components/swim-tracker/RacesTable.svelte';
	import TimeProgressChart from '$lib/components/swim-tracker/TimeProgressChart.svelte';
	import MeetPerformanceChart from '$lib/components/swim-tracker/MeetPerformanceChart.svelte';
	import { processSwimData, getDefaultSeasons } from '$lib/utils/swimData.js';

	export let meets = [];
	export let races = [];
	export let swimmerEmojis = {};

	let activeView = 'summary'; // 'summary' | 'table' | 'progress' | 'meets'

	// All calendar years present in the data, most recent first.
	$: allSeasons = [...new Set(meets.map((m) => new Date(m.Date).getFullYear()))].sort((a, b) => b - a);

	// Default selection: current year if it has data, else the latest year.
	let selectedSeasons = null;
	$: if (selectedSeasons === null && allSeasons.length > 0) {
		selectedSeasons = getDefaultSeasons(allSeasons, new Date().getFullYear());
	}

	function toggleSeason(year) {
		selectedSeasons = selectedSeasons.includes(year)
			? selectedSeasons.filter((y) => y !== year)
			: [...selectedSeasons, year];
	}

	function selectAllSeasons() {
		selectedSeasons = [...allSeasons];
	}

	$: allSelected = selectedSeasons !== null && selectedSeasons.length === allSeasons.length;

	// Re-process only the meets/races within the selected seasons so stats stay season-scoped.
	$: seasonSet = new Set(selectedSeasons ?? []);
	$: filteredMeets = meets.filter((m) => seasonSet.has(new Date(m.Date).getFullYear()));
	$: filteredMeetIds = new Set(filteredMeets.map((m) => m.MeetId));
	$: filteredRaces = races.filter((r) => filteredMeetIds.has(r.MeetId));
	$: processedData = processSwimData(filteredMeets, filteredRaces);
</script>

{#if allSeasons.length > 1}
	<div class="season-filter">
		<span class="season-label">Season:</span>
		{#each allSeasons as year}
			<button
				type="button"
				class="season-chip"
				class:active={selectedSeasons?.includes(year)}
				on:click={() => toggleSeason(year)}
			>{year}</button>
		{/each}
		<button
			type="button"
			class="season-chip season-all"
			class:active={allSelected}
			on:click={selectAllSeasons}
		>All</button>
	</div>
{/if}

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
		<MeetPerformanceChart meets={filteredMeets} />
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
	.season-filter {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.season-label {
		color: #7f8c8d;
		font-size: 0.9rem;
		font-weight: 600;
		margin-right: 0.25rem;
	}
	.season-chip {
		padding: 0.35rem 0.9rem;
		border: 1px solid #d0d7de;
		border-radius: 999px;
		background: white;
		color: #7f8c8d;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.season-chip:hover { color: #2c3e50; border-color: #3498db; }
	.season-chip.active {
		background: #3498db;
		border-color: #3498db;
		color: white;
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
