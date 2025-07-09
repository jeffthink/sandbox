<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import FamilySlider from '$lib/components/FamilySlider.svelte';
	import EmbedWrapper from '$lib/components/EmbedWrapper.svelte';
	
	// Embed mode is passed as data from the load function
	export let data;
	let isEmbedMode = data.isEmbedMode;
	
	let familySize = 4;
	let svgElement;
	let svg;
	let updateHeight;
	
	// Configuration constants - using reactive statements to avoid circular references
	$: CONFIG = {
		ticket: {
			width: 100,
			height: 40,
			spacing: 8,
			padding: 20
		},
		cost: {
			perPerson: 250
		},
		transitions: {
			duration: 150,
			textDuration: 150,
			enterDelay: 30
		}
	};
	
	// Emoji mapping
	const EMOJI_MAP = {
		1: "😊", 2: "😄", 3: "😐", 4: "😰",
		5: "😟", 6: "😢", 7: "😭", 8: "🫠"
	};
	
	let costDisplay = "$1000 😊";
	
	
	// Reactive statement to initialize when SVG element becomes available
	$: if (svgElement && !svg) {
		setupVisualization();
		updateLinearVisualization();
	}
	
	function setupVisualization() {
		if (!svgElement) return;
		
		// Clear any existing SVG content
		d3.select(svgElement).selectAll("*").remove();
		
		svg = d3.select(svgElement)
			.attr("width", CONFIG.width)
			.attr("height", CONFIG.height)
			.attr("viewBox", `0 0 ${CONFIG.width} ${CONFIG.height}`)
			.attr("preserveAspectRatio", "xMidYMid meet");
		
		// Create defs for filters
		const defs = svg.append("defs");
		const filter = defs.append("filter")
			.attr("id", "dropshadow")
			.attr("x", "-20%")
			.attr("y", "-20%")
			.attr("width", "140%")
			.attr("height", "140%");
		
		filter.append("feDropShadow")
			.attr("dx", "1")
			.attr("dy", "2")
			.attr("stdDeviation", "2")
			.attr("flood-color", "rgba(0,0,0,0.1)");
	}
	
	function createTicketStructure(ticketEnter) {
		// Main ticket body
		ticketEnter.append("rect")
			.attr("class", "ticket-body")
			.attr("width", CONFIG.ticket.width)
			.attr("height", CONFIG.ticket.height)
			.attr("rx", 8)
			.style("fill", "white")
			.style("stroke", "#e5e7eb")
			.style("stroke-width", "2")
			.style("filter", "url(#dropshadow)");
		
		// Perforations
		ticketEnter.selectAll(".perforation")
			.data(d3.range(6))
			.enter()
			.append("rect")
			.attr("class", "perforation")
			.attr("x", 12)
			.attr("y", (d, i) => 7 + i * 4.5)
			.attr("width", 2)
			.attr("height", 2)
			.attr("rx", 1)
			.style("fill", "#9ca3af");
		
		// Dashed line
		ticketEnter.selectAll(".dash")
			.data(d3.range(8))
			.enter()
			.append("rect")
			.attr("class", "dash")
			.attr("x", 24)
			.attr("y", (d, i) => 5 + i * 4)
			.attr("width", 1)
			.attr("height", 2)
			.style("fill", "#d1d5db");
		
		// Airplane icon
		const planeGroup = ticketEnter.append("g")
			.attr("transform", "translate(75, 12)");
		
		planeGroup.append("path")
			.attr("d", "M2 12L1 3L20 12L1 21L2 12ZM2 12L9 12")
			.style("fill", "none")
			.style("stroke", "#374151")
			.style("stroke-width", "2")
			.style("stroke-linecap", "round")
			.style("stroke-linejoin", "round")
			.attr("transform", "scale(0.7)");
		
		// Text lines
		const textLines = [
			{x: 30, y: 10, width: 20},
			{x: 30, y: 14, width: 15},
			{x: 30, y: 18, width: 25},
			{x: 30, y: 22, width: 18}
		];
		
		ticketEnter.selectAll(".text-line")
			.data(textLines)
			.enter()
			.append("rect")
			.attr("class", "text-line")
			.attr("x", d => d.x)
			.attr("y", d => d.y)
			.attr("width", d => d.width)
			.attr("height", 1.5)
			.style("fill", "#d1d5db");
	}
	
	function updateLinearVisualization() {
		if (!svg) return;
		
		const cost = familySize * CONFIG.cost.perPerson;
		const ticketData = d3.range(familySize);
		
		// Calculate dynamic dimensions based on content
		const width = CONFIG.ticket.width + (2 * CONFIG.ticket.padding);
		const height = CONFIG.ticket.padding + (familySize * CONFIG.ticket.spacing) + CONFIG.ticket.height + CONFIG.ticket.padding;
		const startX = CONFIG.ticket.padding;
		const startY = CONFIG.ticket.padding;
		
		// Update SVG dimensions based on content
		svg.attr("width", width)
			.attr("height", height)
			.attr("viewBox", `0 0 ${width} ${height}`);
		
		// Check if this is the first load
		const isFirstLoad = svg.selectAll(".ticket-group").empty();
		
		// Update tickets using D3's enter/update/exit pattern
		const tickets = svg.selectAll(".ticket-group")
			.data(ticketData);
		
		// EXIT: Remove extra tickets
		tickets.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new tickets
		const ticketEnter = tickets.enter()
			.append("g")
			.attr("class", "ticket-group")
			.attr("transform", (d, i) => 
				`translate(${startX}, ${startY + i * CONFIG.ticket.spacing})`)
			.style("opacity", isFirstLoad ? 1 : 0);
		
		// Build ticket structure for new tickets
		createTicketStructure(ticketEnter);
		
		// Animate new tickets in (only if not first load)
		if (!isFirstLoad) {
			ticketEnter
				.transition()
				.duration(CONFIG.transitions.duration)
				.delay((d, i) => i * CONFIG.transitions.enterDelay)
				.style("opacity", 1);
		}
		
		// UPDATE: Reposition all tickets (both existing and new)
		tickets
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("transform", (d, i) => 
				`translate(${startX}, ${startY + i * CONFIG.ticket.spacing})`);
		
		// Update cost display
		updateCostDisplay(cost);
		
		// Notify parent of height change for responsive iframe
		if (updateHeight) {
			updateHeight();
		}
	}
	
	function updateCostDisplay(cost) {
		const currentEmoji = EMOJI_MAP[familySize] || "💀";
		costDisplay = `$${cost.toLocaleString()} ${currentEmoji}`;
	}
	
	function handleSliderChange(event) {
		familySize = event.detail;
		if (svg) {
			updateLinearVisualization();
		}
	}
	
	function handleSliderInput(event) {
		familySize = event.detail;
		// Update cost display immediately for feedback
		if (svg) {
			updateCostDisplay(familySize * CONFIG.cost.perPerson);
		}
	}
</script>

<svelte:head>
	<title>Linear Growth: Family Complexity Calculator</title>
</svelte:head>

<style>
	.section-title {
		font-size: 20px;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 15px;
		text-align: center;
	}
	
	.visualization-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
	
	.cost-display {
		text-align: center;
		margin-top: 0;
	}
	
	.cost-amount {
		font-size: 28px;
		font-weight: bold;
		color: #10b981;
	}
	
	@media (max-width: 768px) {
		.section-title {
			font-size: 18px;
		}
		
		.cost-amount {
			font-size: 24px;
		}
	}
</style>

<EmbedWrapper {isEmbedMode} bind:updateHeight>
	{#if !isEmbedMode}
		<h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
			Family Complexity Interactive Calculator
		</h1>
		
		<div class="section-title">Linear Growth: Airline Costs</div>
	{/if}
	
	<FamilySlider bind:familySize on:change={handleSliderChange} on:input={handleSliderInput} />
	
	<div class="visualization-container">
		<svg bind:this={svgElement}></svg>
	</div>
	
	<div class="cost-display">
		<div class="cost-amount">{costDisplay}</div>
	</div>
</EmbedWrapper>