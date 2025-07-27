<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	
	export let meets;
	
	let svgElement;
	let containerElement;
	let width = 800;
	let height = 400;
	
	// Process meets data
	$: processedMeets = processMeets(meets);
	
	function processMeets(meetsData) {
		if (!meetsData || meetsData.length === 0) return [];
		
		return meetsData
			.filter(meet => meet.OurPoints && meet.TheirPoints)
			.sort((a, b) => a.Date - b.Date)
			.map(meet => ({
				date: meet.Date,
				meetName: meet.MeetName,
				opponent: meet.Opponent,
				ourPoints: meet.OurPoints,
				theirPoints: meet.TheirPoints,
				won: meet.OurPoints > meet.TheirPoints,
				location: meet.Location,
				teamPlace: meet.TeamPlace,
				numTeams: meet.NumTeams,
				pointDiff: meet.OurPoints - meet.TheirPoints
			}));
	}
	
	// Draw chart when data changes
	$: if (svgElement && processedMeets.length > 0) {
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
		if (!svgElement || processedMeets.length === 0) return;
		
		const margin = { top: 40, right: 100, bottom: 60, left: 70 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;
		
		// Clear previous chart
		d3.select(svgElement).selectAll('*').remove();
		
		const svg = d3.select(svgElement)
			.attr('width', width)
			.attr('height', height);
		
		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);
		
		// Set up scales
		const xScale = d3.scaleBand()
			.domain(processedMeets.map((d, i) => i))
			.range([0, innerWidth])
			.padding(0.1);
		
		const yScale = d3.scaleLinear()
			.domain([0, d3.max(processedMeets, d => Math.max(d.ourPoints, d.theirPoints)) * 1.1])
			.range([innerHeight, 0]);
		
		// Add axes
		const xAxis = g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(d3.axisBottom(xScale).tickFormat((d, i) => {
				if (processedMeets.length > 10 && i % 2 !== 0) return '';
				return processedMeets[d].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			}));
		
		xAxis.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end');
		
		g.append('g')
			.call(d3.axisLeft(yScale))
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', -innerHeight / 2)
			.attr('fill', 'black')
			.style('text-anchor', 'middle')
			.text('Points');
		
		// Add title
		svg.append('text')
			.attr('x', width / 2)
			.attr('y', 20)
			.style('text-anchor', 'middle')
			.style('font-weight', 'bold')
			.style('font-size', '16px')
			.text('Meet Performance Over Time');
		
		// Calculate statistics
		const wins = processedMeets.filter(d => d.won).length;
		const losses = processedMeets.length - wins;
		const avgPointDiff = d3.mean(processedMeets, d => d.pointDiff);
		
		// Add statistics text
		const stats = svg.append('g')
			.attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
		
		stats.append('text')
			.attr('y', 0)
			.style('font-weight', 'bold')
			.text('Season Stats');
		
		stats.append('text')
			.attr('y', 20)
			.style('font-size', '12px')
			.text(`Record: ${wins}-${losses}`);
		
		stats.append('text')
			.attr('y', 40)
			.style('font-size', '12px')
			.text(`Avg Diff: ${avgPointDiff > 0 ? '+' : ''}${avgPointDiff.toFixed(1)}`);
		
		// Create groups for each meet
		const meetGroups = g.selectAll('.meet-group')
			.data(processedMeets)
			.enter().append('g')
			.attr('class', 'meet-group')
			.attr('transform', (d, i) => `translate(${xScale(i)}, 0)`);
		
		// Add bars for our points
		meetGroups.append('rect')
			.attr('x', 0)
			.attr('y', d => yScale(d.ourPoints))
			.attr('width', xScale.bandwidth() / 2)
			.attr('height', d => innerHeight - yScale(d.ourPoints))
			.attr('fill', '#3498db')
			.style('cursor', 'pointer');
		
		// Add bars for their points
		meetGroups.append('rect')
			.attr('x', xScale.bandwidth() / 2)
			.attr('y', d => yScale(d.theirPoints))
			.attr('width', xScale.bandwidth() / 2)
			.attr('height', d => innerHeight - yScale(d.theirPoints))
			.attr('fill', '#e74c3c')
			.style('cursor', 'pointer');
		
		// Add win/loss indicators
		meetGroups.append('text')
			.attr('x', xScale.bandwidth() / 2)
			.attr('y', -5)
			.style('text-anchor', 'middle')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.style('fill', d => d.won ? '#27ae60' : '#e74c3c')
			.text(d => d.won ? 'W' : 'L');
		
		// Add hover tooltip
		meetGroups.on('mouseover', function(event, d) {
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
				<strong>${d.meetName}</strong><br>
				vs ${d.opponent}<br>
				Date: ${d.date.toLocaleDateString()}<br>
				Location: ${d.location}<br>
				<br>
				Our Points: ${d.ourPoints}<br>
				Their Points: ${d.theirPoints}<br>
				Difference: ${d.pointDiff > 0 ? '+' : ''}${d.pointDiff}<br>
				${d.teamPlace && d.numTeams ? `Place: ${d.teamPlace}/${d.numTeams}` : ''}
			`)
				.style('left', (event.pageX + 10) + 'px')
				.style('top', (event.pageY - 10) + 'px');
		})
		.on('mouseout', function() {
			d3.selectAll('.tooltip').remove();
		});
		
		// Add legend
		const legend = g.append('g')
			.attr('transform', `translate(${innerWidth - 120}, ${innerHeight - 40})`);
		
		const legendData = [
			{ label: 'Our Team', color: '#3498db' },
			{ label: 'Opponent', color: '#e74c3c' }
		];
		
		legendData.forEach((item, i) => {
			const legendItem = legend.append('g')
				.attr('transform', `translate(0, ${i * 20})`);
			
			legendItem.append('rect')
				.attr('width', 15)
				.attr('height', 15)
				.attr('fill', item.color);
			
			legendItem.append('text')
				.attr('x', 20)
				.attr('y', 12)
				.style('font-size', '12px')
				.text(item.label);
		});
		
		// Add trend line for point differential
		if (processedMeets.length > 1) {
			const pointDiffScale = d3.scaleLinear()
				.domain(d3.extent(processedMeets, d => d.pointDiff))
				.range([innerHeight * 0.8, innerHeight * 0.2]);
			
			const line = d3.line()
				.x((d, i) => xScale(i) + xScale.bandwidth() / 2)
				.y(d => pointDiffScale(d.pointDiff))
				.curve(d3.curveMonotoneX);
			
			g.append('path')
				.datum(processedMeets)
				.attr('fill', 'none')
				.attr('stroke', '#95a5a6')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.attr('d', line);
			
			// Add zero line for point differential
			g.append('line')
				.attr('x1', 0)
				.attr('x2', innerWidth)
				.attr('y1', pointDiffScale(0))
				.attr('y2', pointDiffScale(0))
				.attr('stroke', '#95a5a6')
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '2,2');
		}
	}
</script>

<style>
	.container {
		width: 100%;
	}
	
	.chart-container {
		width: 100%;
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
	
	.summary-card .value.positive {
		color: #27ae60;
	}
	
	.summary-card .value.negative {
		color: #e74c3c;
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
	{#if processedMeets.length > 0}
		<div class="summary">
			<div class="summary-card">
				<h3>Total Meets</h3>
				<div class="value">{processedMeets.length}</div>
			</div>
			<div class="summary-card">
				<h3>Win Rate</h3>
				<div class="value">
					{((processedMeets.filter(m => m.won).length / processedMeets.length) * 100).toFixed(0)}%
				</div>
			</div>
			<div class="summary-card">
				<h3>Average Points</h3>
				<div class="value">
					{d3.mean(processedMeets, d => d.ourPoints).toFixed(1)}
				</div>
			</div>
			<div class="summary-card">
				<h3>Point Differential</h3>
				<div class="value" class:positive={d3.mean(processedMeets, d => d.pointDiff) > 0} class:negative={d3.mean(processedMeets, d => d.pointDiff) < 0}>
					{d3.mean(processedMeets, d => d.pointDiff) > 0 ? '+' : ''}{d3.mean(processedMeets, d => d.pointDiff).toFixed(1)}
				</div>
			</div>
		</div>
		
		<div class="chart-container">
			<svg bind:this={svgElement}></svg>
		</div>
	{:else}
		<div class="no-data">
			No meet data available with point information
		</div>
	{/if}
</div>