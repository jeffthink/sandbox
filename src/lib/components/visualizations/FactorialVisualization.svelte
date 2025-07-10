<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import FamilySlider from '$lib/components/FamilySlider.svelte';
	
	export let familySize = 4;
	export let arrangementDisplay = "24 arrangements";
	export let formulaDisplay = "4! = 24";
	export let showFullText = true;
	
	let svgElement;
	let svg;
	
	// Configuration constants - using reactive statements to avoid circular references
	$: CONFIG = {
		person: {
			radius: 15,
			spacing: 45,
			lineSpacing: 35
		},
		layout: {
			padding: 20,
			maxDisplayRows: 10
		},
		transitions: {
			duration: 500,
			textDuration: 400
		}
	};
	
	// Person names and colors for variety
	const PERSON_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8"];
	const PERSON_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
	
	// Calculate factorial
	function factorial(n) {
		if (n <= 1) return 1;
		return n * factorial(n - 1);
	}
	
	// Generate all possible line arrangements (permutations)
	function generateArrangements(n) {
		const people = Array.from({length: n}, (_, i) => i);
		const arrangements = [];
		
		// Generate all permutations
		function permute(arr, start = 0) {
			if (start >= arr.length) {
				arrangements.push([...arr]);
				return;
			}
			
			for (let i = start; i < arr.length; i++) {
				[arr[start], arr[i]] = [arr[i], arr[start]];
				permute(arr, start + 1);
				[arr[start], arr[i]] = [arr[i], arr[start]];
			}
		}
		
		permute(people);
		
		// Shuffle arrangements for variety
		for (let i = arrangements.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arrangements[i], arrangements[j]] = [arrangements[j], arrangements[i]];
		}
		
		return arrangements;
	}
	
	// Calculate positions for line arrangements
	function calculateArrangementPositions(arrangements, familySize, startX, startY) {
		const positions = [];
		const displayRows = Math.min(arrangements.length, CONFIG.layout.maxDisplayRows);
		
		arrangements.slice(0, displayRows).forEach((arrangement, rowIndex) => {
			const rowPositions = [];
			arrangement.forEach((personIndex, colIndex) => {
				const x = startX + colIndex * CONFIG.person.spacing;
				const y = startY + rowIndex * CONFIG.person.lineSpacing;
				
				rowPositions.push({
					x: x,
					y: y,
					personIndex: personIndex,
					rowIndex: rowIndex,
					colIndex: colIndex
				});
			});
			positions.push(rowPositions);
		});
		
		return positions;
	}
	
	// Reactive statement to initialize when SVG element becomes available
	$: if (svgElement && !svg) {
		setupVisualization();
		updateFactorialVisualization();
	}
	
	
	function setupVisualization() {
		if (!svgElement) return;
		
		// Clear any existing SVG content
		d3.select(svgElement).selectAll("*").remove();
		
		svg = d3.select(svgElement)
			.attr("preserveAspectRatio", "xMidYMid meet");
		
		// Create layer groups to ensure proper z-order
		svg.append("g").attr("class", "lines-layer");
		svg.append("g").attr("class", "arrangements-layer");
		svg.append("g").attr("class", "text-layer");
	}
	
	function updateFactorialVisualization() {
		if (!svg) return;
		
		const arrangements = generateArrangements(familySize);
		const totalArrangements = factorial(familySize);
		const displayRows = Math.min(totalArrangements, CONFIG.layout.maxDisplayRows);
		const hasMoreText = totalArrangements > CONFIG.layout.maxDisplayRows;
		
		// Calculate dynamic dimensions
		const totalWidth = (familySize - 1) * CONFIG.person.spacing;
		const startX = CONFIG.layout.padding;
		const startY = CONFIG.layout.padding;
		const width = totalWidth + (2 * CONFIG.layout.padding);
		const height = startY + (displayRows * CONFIG.person.lineSpacing) + (hasMoreText ? 30 : 5);
		
		const arrangementPositions = calculateArrangementPositions(arrangements, familySize, startX, startY);
		
		// Update SVG dimensions based on content
		svg.attr("width", width)
			.attr("height", height)
			.attr("viewBox", `0 0 ${width} ${height}`);
		
		// Flatten positions for D3 data binding
		const flatPositions = arrangementPositions.flat();
		
		// Update connecting lines first (so they appear behind circles)
		const lineData = [];
		arrangementPositions.forEach(arrangement => {
			for (let i = 0; i < arrangement.length - 1; i++) {
				lineData.push({
					x1: arrangement[i].x,
					y1: arrangement[i].y,
					x2: arrangement[i + 1].x,
					y2: arrangement[i + 1].y,
					rowIndex: arrangement[i].rowIndex
				});
			}
		});
		
		const arrangementLines = svg.select(".lines-layer").selectAll(".arrangement-line")
			.data(lineData);
		
		// EXIT: Remove extra lines
		arrangementLines.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new lines
		arrangementLines.enter()
			.append("line")
			.attr("class", "arrangement-line")
			.attr("x1", d => d.x1)
			.attr("y1", d => d.y1)
			.attr("x2", d => d.x2)
			.attr("y2", d => d.y2)
			.style("opacity", 0)
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0.6);
		
		// UPDATE: Update existing lines
		arrangementLines
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("x1", d => d.x1)
			.attr("y1", d => d.y1)
			.attr("x2", d => d.x2)
			.attr("y2", d => d.y2);
		
		// Update person avatars
		const personAvatars = svg.select(".arrangements-layer").selectAll(".person-avatar")
			.data(flatPositions);
		
		// EXIT: Remove extra avatars
		personAvatars.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new avatars
		const avatarEnter = personAvatars.enter()
			.append("g")
			.attr("class", "person-avatar")
			.attr("transform", d => `translate(${d.x}, ${d.y})`)
			.style("opacity", 0);
		
		avatarEnter.append("circle")
			.attr("class", "person-circle")
			.attr("r", CONFIG.person.radius)
			.style("fill", d => PERSON_COLORS[d.personIndex % PERSON_COLORS.length])
			.style("stroke", d => d3.color(PERSON_COLORS[d.personIndex % PERSON_COLORS.length]).darker(0.5));
		
		avatarEnter.append("text")
			.attr("class", "person-label")
			.attr("x", 0)
			.attr("y", 0)
			.text(d => PERSON_NAMES[d.personIndex]);
		
		avatarEnter
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 1);
		
		// UPDATE: Update existing avatars
		personAvatars
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("transform", d => `translate(${d.x}, ${d.y})`);
		
		// Update circle colors and labels
		personAvatars.select(".person-circle")
			.style("fill", d => PERSON_COLORS[d.personIndex % PERSON_COLORS.length])
			.style("stroke", d => d3.color(PERSON_COLORS[d.personIndex % PERSON_COLORS.length]).darker(0.5));
		
		personAvatars.select(".person-label")
			.text(d => PERSON_NAMES[d.personIndex]);
		
		// Add "...and more..." indicator if there are more arrangements than displayed
		const hasMoreArrangements = arrangements.length > CONFIG.layout.maxDisplayRows;
		const moreIndicator = svg.select(".arrangements-layer").selectAll(".more-indicator")
			.data(hasMoreArrangements ? [1] : []);
		
		moreIndicator.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		if (hasMoreArrangements) {
			const centerX = startX + (familySize - 1) * CONFIG.person.spacing / 2;
			const moreEnter = moreIndicator.enter()
				.append("text")
				.attr("class", "more-indicator")
				.attr("x", centerX)
				.attr("y", startY + CONFIG.layout.maxDisplayRows * CONFIG.person.lineSpacing + 15)
				.style("text-anchor", "middle")
				.style("font-size", "14px")
				.style("fill", "#9ca3af")
				.style("font-style", "italic")
				.text(`...and ${arrangements.length - CONFIG.layout.maxDisplayRows} more arrangements`)
				.style("opacity", 0);
			
			moreEnter
				.transition()
				.duration(CONFIG.transitions.duration)
				.style("opacity", 1);
			
			moreIndicator
				.transition()
				.duration(CONFIG.transitions.duration)
				.attr("x", centerX)
				.text(`...and ${arrangements.length - CONFIG.layout.maxDisplayRows} more arrangements`);
		}
		
		// Update arrangement count and formula
		updateArrangementDisplay(totalArrangements, arrangements.length > CONFIG.layout.maxDisplayRows);
	}
	
	function updateArrangementDisplay(count, hasMore) {
		arrangementDisplay = `${count} arrangement${count !== 1 ? 's' : ''}`;
		formulaDisplay = `${familySize}! = ${count}`;
	}
	
	function handleSliderChange(event) {
		familySize = event.detail;
		if (svg) {
			updateFactorialVisualization();
		}
	}
</script>

<style>
	.visualization-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
	
	.arrangement-display {
		text-align: center;
		margin-top: 0;
	}
	
	.arrangement-count {
		font-size: 28px;
		font-weight: bold;
		color: #10b981;
		margin-bottom: 10px;
	}
	
	.formula-text {
		font-size: 16px;
		color: #6b7280;
		margin: 5px 0;
	}
	
	:global(.person-avatar) {
		cursor: pointer;
	}
	
	:global(.person-circle) {
		stroke-width: 2;
	}
	
	:global(.person-label) {
		font-size: 12px;
		text-anchor: middle;
		dominant-baseline: middle;
		fill: white;
		font-weight: bold;
	}
	
	:global(.arrangement-line) {
		stroke: #d1d5db;
		stroke-width: 2;
		opacity: 0.6;
	}
	
	:global(.line-arrangement) {
		opacity: 0.8;
	}
	
	:global(.line-arrangement:hover) {
		opacity: 1;
	}
	
	:global(.more-indicator) {
		font-size: 14px;
		fill: #9ca3af;
		text-anchor: middle;
		font-style: italic;
	}
	
	@media (max-width: 768px) {
		.arrangement-count {
			font-size: 24px;
		}
	}
</style>

<FamilySlider bind:familySize on:change={handleSliderChange} />

<div class="visualization-container">
	<svg bind:this={svgElement}></svg>
</div>

<div class="arrangement-display">
	<div class="arrangement-count">{arrangementDisplay}</div>
	{#if showFullText}
		<div class="formula-text">{formulaDisplay}</div>
		<div class="formula-text">Each person can</div>
		<div class="formula-text">be in any position</div>
	{/if}
</div>