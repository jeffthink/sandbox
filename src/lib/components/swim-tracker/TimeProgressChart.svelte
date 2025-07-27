<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { formatTime } from '$lib/utils/swimData.js';
	
	export let data;
	
	let svgElement;
	let containerElement;
	let width = 800;
	let height = 400;
	
	// Filter controls
	let selectedSwimmers = [];
	let selectedEvent = '';
	
	// Extract unique swimmers and events
	$: swimmers = data?.filters?.swimmers || [];
	$: events = data?.filters?.events || [];
	$: swimmerEventHistory = data?.swimmerEventHistory || new Map();
	
	// Initialize with first swimmer if available
	$: if (swimmers.length > 0 && selectedSwimmers.length === 0) {
		selectedSwimmers = [swimmers[0]];
	}
	
	// Initialize with first event if available
	$: if (events.length > 0 && !selectedEvent) {
		selectedEvent = events[0];
	}
	
	// Prepare chart data
	$: chartData = prepareChartData(swimmerEventHistory, selectedSwimmers, selectedEvent);
	
	function prepareChartData(history, swimmers, event) {
		if (!history || swimmers.length === 0 || !event) return [];
		
		return swimmers.map(swimmer => {
			const key = `${swimmer}-${event}`;
			const races = history.get(key) || [];
			
			return {
				swimmer,
				races: races
					.filter(race => race.standardizedTimeInSeconds && !race.isDQ) // Exclude DQs from charts
					.map(race => ({
						date: race.date,
						time: race.standardizedTimeInSeconds, // Use standardized times for fair comparison
						formattedTime: race.isTimeConverted ? race.formattedStandardizedTime : race.formattedTime,
						meet: race.meet.MeetName,
						place: race.Place,
						isPersonalRecord: race.isPersonalRecord,
						isConverted: race.isTimeConverted
					}))
			};
		}).filter(d => d.races.length > 0);
	}
	
	// Draw chart when data changes
	$: if (svgElement && chartData.length > 0) {
		drawChart();
	}
	
	// Handle resize
	onMount(() => {
		const handleResize = () => {
			if (containerElement) {
				width = containerElement.clientWidth;
				drawChart();
			}
		};
		
		handleResize();
		window.addEventListener('resize', handleResize);
		
		return () => window.removeEventListener('resize', handleResize);
	});
	
	function drawChart() {
		if (!svgElement || chartData.length === 0) return;
		
		const margin = { top: 20, right: 100, bottom: 50, left: 70 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;
		
		// Clear previous chart
		d3.select(svgElement).selectAll('*').remove();
		
		const svg = d3.select(svgElement)
			.attr('width', width)
			.attr('height', height);
		
		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);
		
		// Get all dates and times across all swimmers
		const allDates = chartData.flatMap(d => d.races.map(r => r.date));
		const allTimes = chartData.flatMap(d => d.races.map(r => r.time));
		
		// Set up scales
		const xScale = d3.scaleTime()
			.domain(d3.extent(allDates))
			.range([0, innerWidth]);
		
		const yScale = d3.scaleLinear()
			.domain([d3.max(allTimes) * 1.05, d3.min(allTimes) * 0.95])
			.range([0, innerHeight]);
		
		// Color scale
		const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
		
		// Add axes
		g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')))
			.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', 40)
			.attr('fill', 'black')
			.style('text-anchor', 'middle')
			.text('Date');
		
		g.append('g')
			.call(d3.axisLeft(yScale).tickFormat(d => formatTime(d)))
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', -innerHeight / 2)
			.attr('fill', 'black')
			.style('text-anchor', 'middle')
			.text('Time');
		
		// Add title
		svg.append('text')
			.attr('x', width / 2)
			.attr('y', 15)
			.style('text-anchor', 'middle')
			.style('font-weight', 'bold')
			.text(`${selectedEvent} Progress`);
		
		// Line generator
		const line = d3.line()
			.x(d => xScale(d.date))
			.y(d => yScale(d.time))
			.curve(d3.curveMonotoneX);
		
		// Add lines and points for each swimmer
		chartData.forEach((swimmerData, i) => {
			const color = colorScale(i);
			
			// Add line
			g.append('path')
				.datum(swimmerData.races)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 2)
				.attr('d', line);
			
			// Add points
			const points = g.selectAll(`.point-${i}`)
				.data(swimmerData.races)
				.enter().append('circle')
				.attr('class', `point-${i}`)
				.attr('cx', d => xScale(d.date))
				.attr('cy', d => yScale(d.time))
				.attr('r', d => d.isPersonalRecord ? 6 : 4)
				.attr('fill', d => d.isPersonalRecord ? '#ffd700' : color)
				.attr('stroke', color)
				.attr('stroke-width', 2)
				.style('cursor', 'pointer');
			
			// Add hover tooltip
			points.on('mouseover', function(event, d) {
				const tooltip = d3.select('body').append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('padding', '10px')
					.style('background', 'rgba(0,0,0,0.8)')
					.style('color', 'white')
					.style('border-radius', '4px')
					.style('pointer-events', 'none')
					.style('font-size', '12px');
				
				tooltip.html(`
					<strong>${swimmerData.swimmer}</strong><br>
					Time: ${d.formattedTime}${d.isPersonalRecord ? ' (PR)' : ''}${d.isConverted ? ' (converted)' : ''}<br>
					Place: ${d.place || 'N/A'}<br>
					Meet: ${d.meet}<br>
					Date: ${d.date.toLocaleDateString()}
				`)
					.style('left', (event.pageX + 10) + 'px')
					.style('top', (event.pageY - 10) + 'px');
			})
			.on('mouseout', function() {
				d3.selectAll('.tooltip').remove();
			});
		});
		
		// Add legend
		const legend = svg.append('g')
			.attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
		
		chartData.forEach((swimmerData, i) => {
			const color = colorScale(i);
			
			const legendItem = legend.append('g')
				.attr('transform', `translate(0, ${i * 20})`);
			
			legendItem.append('line')
				.attr('x1', 0)
				.attr('x2', 15)
				.attr('y1', 0)
				.attr('y2', 0)
				.attr('stroke', color)
				.attr('stroke-width', 2);
			
			legendItem.append('text')
				.attr('x', 20)
				.attr('y', 4)
				.style('font-size', '12px')
				.text(swimmerData.swimmer);
		});
	}
	
	function toggleSwimmer(swimmer) {
		if (selectedSwimmers.includes(swimmer)) {
			selectedSwimmers = selectedSwimmers.filter(s => s !== swimmer);
		} else {
			selectedSwimmers = [...selectedSwimmers, swimmer];
		}
	}
</script>

<style>
	.container {
		width: 100%;
	}
	
	.controls {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.control-group label {
		font-weight: 600;
		color: #495057;
		margin-bottom: 0.25rem;
	}
	
	.event-select {
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 0.875rem;
		min-width: 200px;
	}
	
	.swimmer-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		background: #f8f9fa;
	}
	
	.swimmer-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.swimmer-checkbox input {
		margin: 0;
	}
	
	.swimmer-checkbox label {
		font-size: 0.875rem;
		cursor: pointer;
		margin: 0;
		font-weight: normal;
	}
	
	.chart-container {
		width: 100%;
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #6c757d;
	}
	
	:global(.tooltip) {
		z-index: 1000;
	}
</style>

<div class="container" bind:this={containerElement}>
	<div class="controls">
		<div class="control-group">
			<label>Event</label>
			<select class="event-select" bind:value={selectedEvent}>
				{#each events as event}
					<option value={event}>{event}</option>
				{/each}
			</select>
		</div>
		
		<div class="control-group">
			<label>Swimmers</label>
			<div class="swimmer-checkboxes">
				{#each swimmers as swimmer}
					<div class="swimmer-checkbox">
						<input 
							type="checkbox" 
							id={`swimmer-${swimmer}`}
							checked={selectedSwimmers.includes(swimmer)}
							on:change={() => toggleSwimmer(swimmer)}
						/>
						<label for={`swimmer-${swimmer}`}>{swimmer}</label>
					</div>
				{/each}
			</div>
		</div>
	</div>
	
	<div class="chart-container">
		{#if chartData.length === 0}
			<div class="no-data">
				{#if selectedSwimmers.length === 0}
					Please select at least one swimmer
				{:else}
					No data available for the selected swimmers and event
				{/if}
			</div>
		{:else}
			<svg bind:this={svgElement}></svg>
		{/if}
	</div>
</div>