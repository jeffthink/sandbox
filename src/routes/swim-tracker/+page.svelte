<script>
	import { onMount } from 'svelte';
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
	
	// View state
	let activeView = 'table'; // 'table', 'progress', 'meets'
	
	onMount(async () => {
		try {
			// TODO: Replace with your published CSV URLs
			// To get these URLs:
			// 1. Open your Google Sheet
			// 2. File → Share → Publish to web
			// 3. Select the sheet tab and CSV format
			// 4. Click Publish and copy the URL
			const MEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCC-lvLd0mo16b3q6qt6b_lE-LwCYJ4GAtFm6ezQdSrLQdjS-3rBv5LlGOAOyVvKRq2ZhUbJyGyaTY/pub?gid=3535918&single=true&output=csv';
			const RACES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCC-lvLd0mo16b3q6qt6b_lE-LwCYJ4GAtFm6ezQdSrLQdjS-3rBv5LlGOAOyVvKRq2ZhUbJyGyaTY/pub?gid=0&single=true&output=csv';
			
			// Fetch both sheets
			const [meetsData, racesData] = await Promise.all([
				fetchSheetCSV(MEETS_CSV_URL),
				fetchSheetCSV(RACES_CSV_URL)
			]);
			
			meets = meetsData;
			races = racesData;
			
			// Process the data (join meets with races, calculate PRs, etc.)
			processedData = processSwimData(meets, races);
			
			loading = false;
		} catch (err) {
			console.error('Error loading swim data:', err);
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
	
	.setup-notice {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		color: #856404;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.setup-notice h3 {
		margin: 0 0 0.5rem 0;
	}
	
	.setup-notice code {
		background: rgba(0,0,0,0.05);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
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
	
	{#if !loading && processedData === null}
		<div class="setup-notice">
			<h3>Setup Required</h3>
			<p>To use this swim tracker, you need to:</p>
			<ol>
				<li>Create a Google Sheet with "Meets" and "Races" tabs</li>
				<li>Publish each tab to web as CSV format</li>
				<li>Update the <code>MEETS_CSV_URL</code> and <code>RACES_CSV_URL</code> in this file</li>
			</ol>
			<p>See the <a href="/swim-tracker/README.md">README</a> for detailed instructions.</p>
		</div>
	{/if}
	
	<div class="nav-tabs">
		<button 
			class="nav-tab" 
			class:active={activeView === 'table'}
			on:click={() => activeView = 'table'}
		>
			Race Results
		</button>
		<button 
			class="nav-tab" 
			class:active={activeView === 'progress'}
			on:click={() => activeView = 'progress'}
		>
			Time Progress
		</button>
		<button 
			class="nav-tab" 
			class:active={activeView === 'meets'}
			on:click={() => activeView = 'meets'}
		>
			Meet Performance
		</button>
	</div>
	
	<div class="content">
		{#if loading}
			<div class="loading">
				Loading swim data...
			</div>
		{:else if processedData}
			{#if activeView === 'table'}
				<RacesTable data={processedData} />
			{:else if activeView === 'progress'}
				<TimeProgressChart data={processedData} />
			{:else if activeView === 'meets'}
				<MeetPerformanceChart meets={meets} />
			{/if}
		{/if}
	</div>
</div>