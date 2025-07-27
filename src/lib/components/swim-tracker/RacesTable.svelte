<script>
	import { filterRaces, formatTime, isDisqualified } from '$lib/utils/swimData.js';
	
	export let data;
	
	// Extract races and filters from data
	$: races = data?.races || [];
	$: filters = data?.filters || {};
	
	// Filter state
	let selectedSwimmer = '';
	let selectedStroke = '';
	let selectedEvent = '';
	let selectedMeet = '';
	let searchTerm = '';
	let showStandardizedTimes = true;
	
	// Sort state
	let sortColumn = 'date';
	let sortDirection = 'desc';
	
	// Apply filters
	$: filteredRaces = filterRaces(races, {
		swimmer: selectedSwimmer,
		stroke: selectedStroke,
		event: selectedEvent,
		meet: selectedMeet
	}).filter(race => {
		if (!searchTerm) return true;
		const term = searchTerm.toLowerCase();
		return (
			race.Swimmer.toLowerCase().includes(term) ||
			race.eventKey.toLowerCase().includes(term) ||
			race.meet.MeetName.toLowerCase().includes(term)
		);
	});
	
	// Apply sorting
	$: sortedRaces = [...filteredRaces].sort((a, b) => {
		let aVal, bVal;
		
		switch (sortColumn) {
			case 'date':
				aVal = a.date;
				bVal = b.date;
				break;
			case 'swimmer':
				aVal = a.Swimmer;
				bVal = b.Swimmer;
				break;
			case 'event':
				aVal = a.eventKey;
				bVal = b.eventKey;
				break;
			case 'time':
				aVal = a.timeInSeconds;
				bVal = b.timeInSeconds;
				break;
			case 'place':
				aVal = a.Place || 999;
				bVal = b.Place || 999;
				break;
			case 'improvement':
				aVal = a.improvementSeconds || -999;
				bVal = b.improvementSeconds || -999;
				break;
			default:
				return 0;
		}
		
		if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
		if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});
	
	// Toggle sort
	function toggleSort(column) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}
	
	// Reset filters
	function resetFilters() {
		selectedSwimmer = '';
		selectedStroke = '';
		selectedEvent = '';
		selectedMeet = '';
		searchTerm = '';
	}
</script>

<style>
	.filters {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
	}
	
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.filter-group label {
		font-size: 0.875rem;
		color: #6c757d;
		font-weight: 500;
	}
	
	.filter-group select,
	.filter-group input {
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		background: white;
		font-size: 0.875rem;
		min-width: 150px;
	}
	
	.filter-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		margin-left: auto;
	}
	
	.toggle-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	
	.toggle-group input[type="checkbox"] {
		margin: 0;
	}
	
	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.btn-reset {
		background: #6c757d;
		color: white;
	}
	
	.btn-reset:hover {
		background: #5a6268;
	}
	
	.summary {
		margin-bottom: 1rem;
		color: #6c757d;
		font-size: 0.875rem;
	}
	
	.table-container {
		overflow-x: auto;
		border: 1px solid #dee2e6;
		border-radius: 8px;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		font-size: 0.875rem;
	}
	
	th {
		background: #f8f9fa;
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #495057;
		border-bottom: 2px solid #dee2e6;
		white-space: nowrap;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	th.sortable {
		cursor: pointer;
		user-select: none;
	}
	
	th.sortable:hover {
		background: #e9ecef;
	}
	
	th.sortable::after {
		content: ' ↕';
		opacity: 0.3;
		font-size: 0.75rem;
	}
	
	th.sorted-asc::after {
		content: ' ↑';
		opacity: 1;
	}
	
	th.sorted-desc::after {
		content: ' ↓';
		opacity: 1;
	}
	
	td {
		padding: 0.75rem;
		border-bottom: 1px solid #f1f3f5;
	}
	
	tr:hover {
		background: #f8f9fa;
	}
	
	.place {
		font-weight: 600;
	}
	
	.place.top-half {
		color: #28a745;
	}
	
	.improvement {
		font-weight: 500;
	}
	
	.improvement.positive {
		color: #28a745;
	}
	
	.pr-badge {
		background: #ffd700;
		color: #333;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		display: inline-block;
		margin-left: 0.5rem;
	}
	
	.converted-indicator {
		color: #6c757d;
		font-size: 0.75rem;
		font-style: italic;
		margin-left: 0.25rem;
	}
	
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #6c757d;
	}
	
	@media (max-width: 768px) {
		.filters {
			flex-direction: column;
			padding: 0.75rem;
			gap: 0.75rem;
		}
		
		.filter-group {
			width: 100%;
		}
		
		.filter-group select,
		.filter-group input {
			width: 100%;
			min-width: auto;
		}
		
		.filter-actions {
			margin-left: 0;
			width: 100%;
			align-items: stretch;
		}
		
		.toggle-group {
			margin-bottom: 0.5rem;
		}
		
		.btn {
			flex: 1;
		}
		
		.table-container {
			font-size: 0.75rem;
		}
		
		th, td {
			padding: 0.5rem 0.25rem;
		}
		
		th {
			font-size: 0.7rem;
		}
		
		.pr-badge {
			font-size: 0.65rem;
			padding: 0.1rem 0.3rem;
		}
		
		.converted-indicator {
			font-size: 0.65rem;
		}
		
		.summary {
			font-size: 0.8rem;
			margin-bottom: 0.5rem;
		}
	}
	
	@media (max-width: 480px) {
		.filters {
			padding: 0.5rem;
		}
		
		.filter-group label {
			font-size: 0.8rem;
		}
		
		.filter-group select,
		.filter-group input {
			font-size: 0.8rem;
			padding: 0.4rem;
		}
		
		.table-container {
			font-size: 0.7rem;
		}
		
		th, td {
			padding: 0.4rem 0.2rem;
		}
		
		th {
			font-size: 0.65rem;
		}
		
		.btn {
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
		}
	}
</style>

<div class="filters">
	<div class="filter-group">
		<label for="swimmer">Swimmer</label>
		<select id="swimmer" bind:value={selectedSwimmer}>
			<option value="">All Swimmers</option>
			{#each filters.swimmers || [] as swimmer}
				<option value={swimmer}>{swimmer}</option>
			{/each}
		</select>
	</div>
	
	<div class="filter-group">
		<label for="stroke">Stroke</label>
		<select id="stroke" bind:value={selectedStroke}>
			<option value="">All Strokes</option>
			{#each filters.strokes || [] as stroke}
				<option value={stroke}>{stroke}</option>
			{/each}
		</select>
	</div>
	
	<div class="filter-group">
		<label for="event">Event</label>
		<select id="event" bind:value={selectedEvent}>
			<option value="">All Events</option>
			{#each filters.events || [] as event}
				<option value={event}>{event}</option>
			{/each}
		</select>
	</div>
	
	<div class="filter-group">
		<label for="meet">Meet</label>
		<select id="meet" bind:value={selectedMeet}>
			<option value="">All Meets</option>
			{#each filters.meetNames || [] as meet}
				<option value={meet}>{meet}</option>
			{/each}
		</select>
	</div>
	
	<div class="filter-group">
		<label for="search">Search</label>
		<input 
			id="search"
			type="text" 
			placeholder="Search..." 
			bind:value={searchTerm}
		/>
	</div>
	
	<div class="filter-actions">
		<div class="toggle-group">
			<label for="standardized-toggle">
				<input 
					id="standardized-toggle"
					type="checkbox" 
					bind:checked={showStandardizedTimes}
				/>
				Show standardized times (meters)
			</label>
		</div>
		<button class="btn btn-reset" on:click={resetFilters}>
			Reset Filters
		</button>
	</div>
</div>

<div class="summary">
	Showing {sortedRaces.length} of {races.length} races
</div>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'date' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'date' && sortDirection === 'desc'}
					on:click={() => toggleSort('date')}
				>
					Date
				</th>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'swimmer' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'swimmer' && sortDirection === 'desc'}
					on:click={() => toggleSort('swimmer')}
				>
					Swimmer
				</th>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'event' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'event' && sortDirection === 'desc'}
					on:click={() => toggleSort('event')}
				>
					Event
				</th>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'time' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'time' && sortDirection === 'desc'}
					on:click={() => toggleSort('time')}
				>
					Time
				</th>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'place' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'place' && sortDirection === 'desc'}
					on:click={() => toggleSort('place')}
				>
					Place
				</th>
				<th>Meet</th>
				<th 
					class="sortable" 
					class:sorted-asc={sortColumn === 'improvement' && sortDirection === 'asc'}
					class:sorted-desc={sortColumn === 'improvement' && sortDirection === 'desc'}
					on:click={() => toggleSort('improvement')}
				>
					Improvement
				</th>
			</tr>
		</thead>
		<tbody>
			{#if sortedRaces.length === 0}
				<tr>
					<td colspan="7" class="no-data">
						No races found matching the selected filters
					</td>
				</tr>
			{:else}
				{#each sortedRaces as race}
					<tr>
						<td>{race.meet.Date.toLocaleDateString()}</td>
						<td>{race.Swimmer}</td>
						<td>
							{race.eventKey}
							{#if race.isPersonalRecord}
								<span class="pr-badge">PR</span>
							{/if}
						</td>
						<td>
							{#if race.isDQ}
								-
							{:else if showStandardizedTimes && race.isTimeConverted}
								{race.formattedStandardizedTime}
								<span class="converted-indicator">(conv.)</span>
							{:else}
								{race.formattedTime}
							{/if}
						</td>
						<td>
							{#if race.isDQ}
								DQ
							{:else if race.Place}
								<span 
									class="place"
									class:top-half={race.Place <= Math.ceil((race.NumSwimmers || 1) / 2)}
								>
									{race.Place}/{race.NumSwimmers || '?'}
									{#if race.Place <= 3}⭐{/if}
								</span>
							{:else}
								-
							{/if}
						</td>
						<td>{race.meet.MeetName}</td>
						<td>
							{#if race.improvementSeconds !== null && race.improvementSeconds > 0}
								<span class="improvement positive">
									+{formatTime(race.improvementSeconds)}
									(+{race.improvementPercent.toFixed(1)}%)
								</span>
							{:else}
								-
							{/if}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>