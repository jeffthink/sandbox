<script>
	export let meets;
	
	// Process meets data
	$: processedMeets = processMeets(meets);
	
	function processMeets(meetsData) {
		if (!meetsData || meetsData.length === 0) return [];
		
		return meetsData
			.map(meet => ({
				date: new Date(meet.Date), // Convert to proper Date object
				meetName: meet.MeetName,
				opponent: meet.Opponent,
				location: meet.Location,
				ourPoints: meet.OurPoints,
				theirPoints: meet.TheirPoints,
				teamPlace: meet.TeamPlace,
				numTeams: meet.NumTeams,
				isExhibition: !meet.OurPoints || meet.OurPoints === '-' || !meet.TheirPoints || meet.TheirPoints === '-',
				won: meet.OurPoints && meet.TheirPoints && meet.OurPoints > meet.TheirPoints
			}))
			.sort((a, b) => b.date - a.date); // Most recent first (now using proper Date objects)
	}
	
	// Calculate summary stats
	$: totalMeets = processedMeets.length;
	$: wins = processedMeets.filter(meet => meet.won).length;
	
</script>

<style>
	.container {
		width: 100%;
	}
	
	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.summary-card {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
	}
	
	.summary-card h3 {
		margin: 0 0 0.5rem 0;
		color: #495057;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.summary-card .value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #2c3e50;
	}
	
	.table-container {
		overflow-x: auto;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		background: white;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
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
	}
	
	td {
		padding: 0.75rem;
		border-bottom: 1px solid #f1f3f5;
	}
	
	tr:hover {
		background: #f8f9fa;
	}
	
	.location {
		text-transform: capitalize;
	}
	
	.points {
		font-weight: 600;
		text-align: center;
	}
	
	.points.win {
		color: #28a745;
	}
	
	.points.loss {
		color: #dc3545;
	}
	
	.place {
		text-align: center;
		font-weight: 500;
	}
	
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #6c757d;
	}
	
	@media (max-width: 768px) {
		.summary {
			grid-template-columns: 1fr 1fr;
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.stat-card {
			padding: 0.75rem;
		}
		
		.stat-label {
			font-size: 0.75rem;
		}
		
		.stat-value {
			font-size: 1.25rem;
		}
		
		table {
			font-size: 0.75rem;
		}
		
		th, td {
			padding: 0.5rem 0.25rem;
		}
		
		th {
			font-size: 0.7rem;
		}
	}
	
	@media (max-width: 480px) {
		.summary {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		
		.stat-card {
			padding: 0.5rem;
		}
		
		.stat-label {
			font-size: 0.7rem;
		}
		
		.stat-value {
			font-size: 1.1rem;
		}
		
		table {
			font-size: 0.7rem;
		}
		
		th, td {
			padding: 0.4rem 0.2rem;
		}
		
		th {
			font-size: 0.65rem;
		}
		
		.points {
			font-size: 0.65rem;
		}
	}
</style>

<div class="container">
	{#if processedMeets.length > 0}
		<div class="summary">
			<div class="summary-card">
				<h3>Total Meets</h3>
				<div class="value">{totalMeets}</div>
			</div>
			<div class="summary-card">
				<h3># of Wins</h3>
				<div class="value">{wins}</div>
			</div>
		</div>
		
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Meet Name</th>
						<th>Opponent</th>
						<th>Location</th>
						<th>Our Points</th>
						<th>Their Points</th>
						<th>Team Place</th>
						<th>Num Teams</th>
					</tr>
				</thead>
				<tbody>
					{#each processedMeets as meet}
						<tr>
							<td>{meet.date.toLocaleDateString()}</td>
							<td>{meet.meetName}</td>
							<td>{meet.opponent}</td>
							<td class="location">{meet.location}</td>
							<td class="points" class:win={meet.won && !meet.isExhibition} class:loss={!meet.won && !meet.isExhibition}>
								{meet.isExhibition ? '-' : meet.ourPoints}
							</td>
							<td class="points" class:win={!meet.won && !meet.isExhibition} class:loss={meet.won && !meet.isExhibition}>
								{meet.isExhibition ? '-' : meet.theirPoints}
							</td>
							<td class="place">
								{meet.teamPlace || '-'}
							</td>
							<td class="place">
								{meet.numTeams || '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="no-data">
			No meet data available
		</div>
	{/if}
</div>