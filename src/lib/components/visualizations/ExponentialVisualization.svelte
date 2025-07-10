<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import FamilySlider from '$lib/components/FamilySlider.svelte';
	
	export let familySize = 4;
	export let scenarioDisplay = "16 scenarios";
	export let formulaDisplay = "2^4 = 16";
	export let showFullText = true;
	
	let svgElement;
	let svg;
	
	// Configuration constants - using reactive statements to avoid circular references
	$: CONFIG = {
		box: {
			width: 30,
			height: 20,
			spacing: 4
		},
		layout: {
			padding: 20,
			rowSpacing: 25,
			maxDisplayRows: 10
		},
		transitions: {
			duration: 500,
			textDuration: 400
		}
	};
	
	// Generate all possible decision scenarios
	function generateScenarios(n) {
		const scenarios = [];
		const totalScenarios = Math.pow(2, n);
		
		// Generate all possible binary combinations
		for (let i = 0; i < totalScenarios; i++) {
			const scenario = [];
			for (let j = 0; j < n; j++) {
				// Extract bit j from number i
				const bit = (i >> j) & 1;
				scenario.push(bit === 1);
			}
			scenarios.push(scenario);
		}
		
		// Filter scenarios to ensure each person says "yes" 40-60% of the time
		const targetYesRatio = 0.4 + Math.random() * 0.2; // Random between 40-60%
		
		// Try to maintain the target ratio for each person
		for (let personIndex = 0; personIndex < n; personIndex++) {
			const targetYesCount = Math.round(totalScenarios * targetYesRatio);
			
			// Count current yes votes for this person
			let currentYesCount = 0;
			scenarios.forEach(scenario => {
				if (scenario[personIndex]) currentYesCount++;
			});
			
			// If we have too many yes votes, flip some to no
			if (currentYesCount > targetYesCount) {
				let flipsNeeded = currentYesCount - targetYesCount;
				for (let i = 0; i < scenarios.length && flipsNeeded > 0; i++) {
					if (scenarios[i][personIndex] && Math.random() < 0.5) {
						scenarios[i][personIndex] = false;
						flipsNeeded--;
					}
				}
			}
			
			// If we have too few yes votes, flip some to yes
			if (currentYesCount < targetYesCount) {
				let flipsNeeded = targetYesCount - currentYesCount;
				for (let i = 0; i < scenarios.length && flipsNeeded > 0; i++) {
					if (!scenarios[i][personIndex] && Math.random() < 0.5) {
						scenarios[i][personIndex] = true;
						flipsNeeded--;
					}
				}
			}
		}
		
		// Randomize the order of scenarios
		for (let i = scenarios.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
		}
		
		return scenarios;
	}
	
	// Calculate layout positions for decision boxes
	function calculateBoxPositions(scenarios, familySize, startX, startY) {
		const positions = [];
		const displayRows = Math.min(scenarios.length, CONFIG.layout.maxDisplayRows);
		
		scenarios.slice(0, displayRows).forEach((scenario, rowIndex) => {
			const rowPositions = [];
			scenario.forEach((decision, colIndex) => {
				const x = startX + colIndex * (CONFIG.box.width + CONFIG.box.spacing);
				const y = startY + rowIndex * CONFIG.layout.rowSpacing;
				
				rowPositions.push({
					x: x,
					y: y,
					decision: decision,
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
		updateExponentialVisualization();
	}
	
	
	function setupVisualization() {
		if (!svgElement) return;
		
		// Clear any existing SVG content
		d3.select(svgElement).selectAll("*").remove();
		
		svg = d3.select(svgElement)
			.attr("preserveAspectRatio", "xMidYMid meet");
		
		// Create layer groups to ensure proper z-order
		svg.append("g").attr("class", "scenarios-layer");
		svg.append("g").attr("class", "labels-layer");
		svg.append("g").attr("class", "text-layer");
	}
	
	function updateExponentialVisualization() {
		if (!svg) return;
		
		const scenarios = generateScenarios(familySize);
		const totalScenarios = Math.pow(2, familySize);
		const displayRows = Math.min(totalScenarios, CONFIG.layout.maxDisplayRows);
		const hasMoreText = totalScenarios > CONFIG.layout.maxDisplayRows;
		
		// Calculate dynamic dimensions
		const startX = CONFIG.layout.padding;
		const startY = CONFIG.layout.padding;
		const width = startX + (familySize * (CONFIG.box.width + CONFIG.box.spacing)) + CONFIG.layout.padding;
		const height = startY + (displayRows * CONFIG.layout.rowSpacing) + (hasMoreText ? 35 : 5);
		
		const boxPositions = calculateBoxPositions(scenarios, familySize, startX, startY);
		
		// Update SVG dimensions based on content
		svg.attr("width", width)
			.attr("height", height)
			.attr("viewBox", `0 0 ${width} ${height}`);
		
		// Flatten positions for D3 data binding
		const flatPositions = boxPositions.flat();
		
		// Update decision boxes
		const decisionBoxes = svg.select(".scenarios-layer").selectAll(".decision-group")
			.data(flatPositions);
		
		// EXIT: Remove extra boxes
		decisionBoxes.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new boxes
		const boxEnter = decisionBoxes.enter()
			.append("g")
			.attr("class", "decision-group")
			.attr("transform", d => `translate(${d.x}, ${d.y})`)
			.style("opacity", 0);
		
		boxEnter.append("rect")
			.attr("class", d => `decision-box ${d.decision ? 'agree' : 'disagree'}`)
			.attr("width", CONFIG.box.width)
			.attr("height", CONFIG.box.height)
			.attr("rx", 2);
		
		boxEnter.append("text")
			.attr("class", "decision-text")
			.attr("x", CONFIG.box.width / 2)
			.attr("y", CONFIG.box.height / 2)
			.text(d => d.decision ? "✓" : "✗");
		
		boxEnter
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 1);
		
		// UPDATE: Update existing boxes
		decisionBoxes
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("transform", d => `translate(${d.x}, ${d.y})`);
		
		// Update box colors and text
		decisionBoxes.select(".decision-box")
			.attr("class", d => `decision-box ${d.decision ? 'agree' : 'disagree'}`);
		
		decisionBoxes.select(".decision-text")
			.text(d => d.decision ? "✓" : "✗");
		
		// Update number headers  
		const numberLabels = svg.select(".labels-layer").selectAll(".number-label")
			.data(d3.range(familySize));
		
		numberLabels.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		numberLabels.enter()
			.append("text")
			.attr("class", "number-label")
			.attr("x", (d, i) => startX + i * (CONFIG.box.width + CONFIG.box.spacing) + CONFIG.box.width / 2)
			.attr("y", startY - 10)
			.style("text-anchor", "middle")
			.style("font-size", "12px")
			.style("fill", "#374151")
			.style("font-weight", "600")
			.text((d, i) => `${i + 1}`)
			.style("opacity", 0)
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 1);
		
		numberLabels
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("x", (d, i) => startX + i * (CONFIG.box.width + CONFIG.box.spacing) + CONFIG.box.width / 2);
		
		// Add "...and more..." indicator if there are more rows than displayed
		const hasMoreRows = scenarios.length > CONFIG.layout.maxDisplayRows;
		const moreIndicator = svg.select(".scenarios-layer").selectAll(".more-indicator")
			.data(hasMoreRows ? [1] : []);
		
		moreIndicator.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		if (hasMoreRows) {
			const moreEnter = moreIndicator.enter()
				.append("text")
				.attr("class", "more-indicator")
				.attr("x", startX + familySize * (CONFIG.box.width + CONFIG.box.spacing) / 2)
				.attr("y", startY + CONFIG.layout.maxDisplayRows * CONFIG.layout.rowSpacing + 15)
				.style("text-anchor", "middle")
				.style("font-size", "14px")
				.style("fill", "#9ca3af")
				.style("font-style", "italic")
				.text(`...and ${scenarios.length - CONFIG.layout.maxDisplayRows} more scenarios`)
				.style("opacity", 0);
			
			moreEnter
				.transition()
				.duration(CONFIG.transitions.duration)
				.style("opacity", 1);
			
			moreIndicator
				.transition()
				.duration(CONFIG.transitions.duration)
				.attr("x", startX + familySize * (CONFIG.box.width + CONFIG.box.spacing) / 2)
				.text(`...and ${scenarios.length - CONFIG.layout.maxDisplayRows} more scenarios`);
		}
		
		// Update scenario count and formula
		updateScenarioDisplay(totalScenarios, scenarios.length > CONFIG.layout.maxDisplayRows);
	}
	
	function updateScenarioDisplay(count, hasMore) {
		scenarioDisplay = `${count} scenario${count !== 1 ? 's' : ''}`;
		formulaDisplay = `2^${familySize} = ${count}`;
	}
	
	function handleSliderChange(event) {
		familySize = event.detail;
		if (svg) {
			updateExponentialVisualization();
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
	
	.scenario-display {
		text-align: center;
		margin-top: 0;
	}
	
	.scenario-count {
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
	
	:global(.decision-box) {
		stroke: #374151;
		stroke-width: 1;
		cursor: pointer;
		transition: fill 0.3s ease;
	}
	
	:global(.decision-box.agree) {
		fill: #10b981;
	}
	
	:global(.decision-box.disagree) {
		fill: #ef4444;
	}
	
	:global(.decision-text) {
		font-size: 10px;
		text-anchor: middle;
		dominant-baseline: middle;
		fill: white;
		font-weight: bold;
		pointer-events: none;
	}
	
	:global(.family-member-label) {
		font-size: 12px;
		text-anchor: middle;
		fill: #374151;
		font-weight: 600;
	}
	
	:global(.more-indicator) {
		font-size: 14px;
		fill: #9ca3af;
		text-anchor: middle;
		font-style: italic;
	}
	
	@media (max-width: 768px) {
		.scenario-count {
			font-size: 24px;
		}
	}
</style>

<FamilySlider bind:familySize on:change={handleSliderChange} />

<div class="visualization-container">
	<svg bind:this={svgElement}></svg>
</div>

<div class="scenario-display">
	<div class="scenario-count">{scenarioDisplay}</div>
	{#if showFullText}
		<div class="formula-text">{formulaDisplay}</div>
		<div class="formula-text">Each person can</div>
		<div class="formula-text">agree or disagree</div>
	{/if}
</div>