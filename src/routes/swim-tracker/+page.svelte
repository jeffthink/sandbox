<script>
	import { onMount } from 'svelte';
	import SummerSummary from '$lib/components/swim-tracker/SummerSummary.svelte';
	import RacesTable from '$lib/components/swim-tracker/RacesTable.svelte';
	import TimeProgressChart from '$lib/components/swim-tracker/TimeProgressChart.svelte';
	import MeetPerformanceChart from '$lib/components/swim-tracker/MeetPerformanceChart.svelte';
	import { fetchSheetCSV } from '$lib/utils/googleSheetsCSV.js';
	import { processSwimData } from '$lib/utils/swimData.js';
	
	let loading = true;
	let error = null;
	let meets = [];
	let races = [];
	let processedData = null;
	let swimmerEmojis = {};
	
	// View state
	let activeView = 'summary'; // 'summary', 'table', 'progress', 'meets'
	
	onMount(async () => {
		try {
			const MEETS_CSV_URL = import.meta.env.VITE_MEETS_CSV_URL || '';
			const RACES_CSV_URL = import.meta.env.VITE_RACES_CSV_URL || '';
			const SWIMMERS_CSV_URL = import.meta.env.VITE_SWIMMERS_CSV_URL || '';

			// Fetch sheets (Swimmers tab is optional)
			const [meetsData, racesData, swimmersData] = await Promise.all([
				fetchSheetCSV(MEETS_CSV_URL),
				fetchSheetCSV(RACES_CSV_URL),
				SWIMMERS_CSV_URL ? fetchSheetCSV(SWIMMERS_CSV_URL) : Promise.resolve([])
			]);

			meets = meetsData;
			races = racesData;

			// Build a name → emoji lookup from the Swimmers tab (blank emojis fall back later)
			swimmerEmojis = Object.fromEntries(
				swimmersData
					.filter(s => s.Name && s.Emoji)
					.map(s => [s.Name, s.Emoji])
			);

			// Process the data (join meets with races, calculate PRs, etc.)
			processedData = processSwimData(meets, races);
			
			loading = false;
		} catch (err) {
			error = err.message;
			loading = false;
		}
	});
</script>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}
	}
	
	.header {
		margin-bottom: 2rem;
	}
	
	.header h1 {
		color: #2c3e50;
		margin-bottom: 0.5rem;
	}
	
	.header p {
		color: #7f8c8d;
	}
	
	.nav-tabs {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #ecf0f1;
		padding-bottom: 0;
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
	
	.nav-tab:hover {
		color: #2c3e50;
	}
	
	.nav-tab.active {
		color: #3498db;
		border-bottom-color: #3498db;
	}
	
	.content {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		min-height: 400px;
	}
	
	@media (max-width: 768px) {
		.content {
			padding: 1rem;
			border-radius: 4px;
		}
		
		.nav-tabs {
			gap: 0.5rem;
			margin-bottom: 1rem;
		}
		
		.nav-tab {
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
		}
		
		.header {
			margin-bottom: 1rem;
		}
		
		.header h1 {
			font-size: 1.5rem;
		}
	}
	
	@media (max-width: 480px) {
		.nav-tab {
			padding: 0.5rem 0.75rem;
			font-size: 0.8rem;
		}
	}
	
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 400px;
		color: #7f8c8d;
	}
	
	.error {
		background: #fee;
		color: #c00;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	

</style>

<svelte:head>
	<title>Swim Tracker - Interactive Sandbox</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Swim Times Tracker</h1>
		<p>Track meet results and visualize swimming progress over time</p>
	</div>
	
	{#if error}
		<div class="error">
			<strong>Error loading data:</strong> {error}
		</div>
	{/if}
	
	<div class="nav-tabs">
		<button 
			class="nav-tab" 
			class:active={activeView === 'summary'}
			on:click={() => activeView = 'summary'}
		>
			🏆 Summer Highlights
		</button>
		<button 
			class="nav-tab" 
			class:active={activeView === 'table'}
			on:click={() => activeView = 'table'}
		>
			📊 Race Results
		</button>
		<button 
			class="nav-tab" 
			class:active={activeView === 'progress'}
			on:click={() => activeView = 'progress'}
		>
			📈 Time Progress
		</button>
		<button 
			class="nav-tab" 
			class:active={activeView === 'meets'}
			on:click={() => activeView = 'meets'}
		>
			📅 Meet Performance
		</button>
	</div>
	
	<div class="content">
		{#if loading}
			<div class="loading">
				Loading swim data...
			</div>
		{:else if processedData}
			{#if activeView === 'summary'}
				<SummerSummary data={processedData} {swimmerEmojis} />
			{:else if activeView === 'table'}
				<RacesTable data={processedData} />
			{:else if activeView === 'progress'}
				<TimeProgressChart data={processedData} />
			{:else if activeView === 'meets'}
				<MeetPerformanceChart meets={meets} />
			{/if}
		{/if}
	</div>
</div>